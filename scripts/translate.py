#!/usr/bin/env python3
"""Resumable block-aligned translation via the local FBT transport; never stores credentials."""
import signal, threading
import argparse, concurrent.futures as cf, hashlib, json, os, pathlib, re, subprocess, time
ROOT=pathlib.Path(__file__).resolve().parent.parent
GATEWAY=pathlib.Path(os.environ.get('FBT_ROOT','/Users/fangs/workspace/fbt'))/'friday-gateway/scripts/invoke_chat.sh'
P=argparse.ArgumentParser();P.add_argument('--assemble-only',action='store_true');P.add_argument('--workers',type=int,default=12);P.add_argument('--limit',type=int);P.add_argument('--model',default='claude-sonnet-5');P.add_argument('--transport-model');args=P.parse_args()
stop_event=threading.Event()
signal.signal(signal.SIGTERM,lambda *_:stop_event.set())
private=ROOT/'.private';private.mkdir(exist_ok=True);private.chmod(0o700)
articles=json.loads((ROOT/'content/articles.json').read_text())
if args.limit:articles=articles[:args.limit]
exceptions=json.loads((ROOT/'scripts/translation-exceptions.json').read_text())
link=re.compile(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)')
def digest(obj):return hashlib.sha256(json.dumps(obj,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def check(src,out):
 if not isinstance(out,dict) or not isinstance(out.get('blocks'),list):raise ValueError('missing blocks')
 if [b.get('id') for b in out['blocks']]!=[b['id'] for b in src]:raise ValueError('block IDs mismatch')
 for a,b in zip(src,out['blocks']):
  text=b.get('text')
  if not isinstance(text,str) or not text.strip():raise ValueError('empty translation')
  if sorted(link.findall(a['text']))!=sorted(link.findall(text)):raise ValueError('link mismatch '+a['id'])
  h1=re.match(r'^#{1,6} ',a['text']);h2=re.match(r'^#{1,6} ',text)
  if (h1.group() if h1 else '')!=(h2.group() if h2 else ''):raise ValueError('heading mismatch '+a['id'])
  if len(a['text'])>200 and len(text)<len(a['text'])*.18:raise ValueError('suspiciously short '+a['id'])
  stripped=re.sub(r'https?://[^\s)]+','',link.sub('',a['text']))
  if hashlib.sha256(a['text'].encode()).hexdigest() not in exceptions and len(re.findall('[A-Za-z]',stripped))>70 and not re.search('[\u4e00-\u9fff]',text):raise ValueError('untranslated '+a['id'])
 return out['blocks']
def chunks(blocks):
 chunk=[];size=0
 for b in blocks:
  if size+len(b['text'])>11000 and chunk:yield chunk;chunk=[];size=0
  chunk.append(b);size+=len(b['text'])
 if chunk:yield chunk
jobs=[];plans={}
for a in articles:
 plan=[]
 for i,blocks in enumerate(chunks(a['blocks'])):
  key=digest({'blocks':blocks,'prompt':(ROOT/'scripts/translation-system.txt').read_text(),'model':args.model})
  file=ROOT/'content/translations'/f'{key}.json';plan.append((file,blocks))
  if file.exists():check(blocks,json.loads(file.read_text()))
  else:jobs.append((a,i,blocks,file))
 plans[a['slug']]=plan
print(json.dumps({'articles':len(articles),'pending_chunks':len(jobs),'workers':args.workers}),flush=True)
def run(job):
 a,i,blocks,file=job
 if stop_event.is_set():return a['slug'],i,False,'paused'
 if file.exists():return a['slug'],i,True,None
 inputfile=private/(file.stem+'.input.json')
 inputfile.write_text(json.dumps({'articleTitle':a['title'],'blocks':blocks},ensure_ascii=False));inputfile.chmod(0o600)
 last=''
 for attempt in range(3):
  cmd=['bash',str(GATEWAY),'--auto-appid',(args.transport_model or args.model),'--system-file',str(ROOT/'scripts/translation-system.txt'),'--user-file',str(inputfile),'--max-tokens','24000','--timeout','240','--retries','1','--json']
  try:
   proc=subprocess.run(cmd,capture_output=True,text=True,timeout=760);receipt=json.loads(proc.stdout)
   if not receipt.get('ok') or receipt.get('finish_reason') not in ('stop','end_turn'):raise ValueError('transport incomplete '+str(receipt.get('http_code'))+' '+str(receipt.get('finish_reason')))
   raw=receipt['text'].strip();raw=re.sub(r'^```(?:json)?\s*|\s*```$','',raw)
   out=json.loads(raw);check(blocks,out)
   data={'blocks':out['blocks'],'model':receipt.get('resolved_model',args.model),'finishReason':receipt['finish_reason'],'translatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'usage':receipt.get('usage'),'durationMs':receipt.get('duration_ms'),'sourceHash':digest(blocks)}
   tmp=file.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');tmp.replace(file)
   inputfile.unlink(missing_ok=True)
   return a['slug'],i,True,None
  except Exception as e:
   last=str(e)
   if '429' in last: time.sleep(30*(attempt+1))
   else: time.sleep(min(2**attempt,5))
 return a['slug'],i,False,last
failed=[]
if args.assemble_only:jobs=[]
with cf.ThreadPoolExecutor(max_workers=args.workers) as pool:
 for n,future in enumerate(cf.as_completed(pool.submit(run,j) for j in jobs),1):
  slug,i,ok,err=future.result()
  print(json.dumps({'done':n,'total':len(jobs),'slug':slug,'chunk':i,'ok':ok,'error':err}),flush=True)
  if not ok:failed.append({'slug':slug,'chunk':i,'error':err})
# Completed articles are assembled only after every aligned chunk has passed.
finished=[]
for a in articles:
 plan=plans[a['slug']]
 if all(f.exists() for f,b in plan):
  translated=[t for f,b in plan for t in check(b,json.loads(f.read_text()))]
  assert [b['id'] for b in translated]==[b['id'] for b in a['blocks']]
  finished.append({'slug':a['slug'],'sourceHash':a['hash'],'blocks':translated})
(ROOT/'content/translated.json').write_text(json.dumps(finished,ensure_ascii=False,indent=2)+'\n')
report={'articles':len(articles),'complete':len(finished),'failed':failed,'model':args.model}
(ROOT/'content/translation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report),flush=True)
raise SystemExit(1 if failed else 0)
