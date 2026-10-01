from pathlib import Path
import subprocess,json,hashlib,re
ROOT=Path(__file__).resolve().parents[1];FF='/opt/homebrew/Caskroom/miniforge/base/bin/ffmpeg';PROBE='/opt/homebrew/Caskroom/miniforge/base/bin/ffprobe';video=ROOT/'final.mp4';e=ROOT/'evidence'
probe=json.loads(subprocess.check_output([PROBE,'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)],text=True));(e/'final-ffprobe.json').write_text(json.dumps(probe,indent=2))
logs={}
commands={
 'decode':['-v','error','-i',str(video),'-f','null','-'],
 'black-freeze':['-hide_banner','-threads','2','-i',str(video),'-vf','blackdetect=d=0.15:pix_th=0.10,freezedetect=n=-55dB:d=1','-an','-f','null','-'],
 'audio':['-hide_banner','-threads','2','-i',str(video),'-af','silencedetect=n=-45dB:d=0.5,ebur128=peak=true','-vn','-f','null','-']}
for name,args in commands.items():
 p=subprocess.run([FF,*args],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True);logs[name]={'exitCode':p.returncode,'log':'evidence/'+name+'.log'};(e/f'{name}.log').write_text('\n'.join(line.rstrip() for line in p.stderr.splitlines())+'\n')
 assert p.returncode==0,(name,p.stderr[-2000:])
raw=json.loads((ROOT/'raw'/'full-capture.json').read_text());cursor=0;story=[]
text={'home':('从一个问题开始。','观看者辨认非官方中文阅读站及长文范围'),'topic':('沿着兴趣，找到主题。','实际主题筛选从全部文章进入写作与创造'),'search':('想读什么，就搜什么。','输入关键词深思，结果实时变为同一篇文章'),'brief':('先看导读，再读全文。','展开精选的要点、实践问题和独立提醒'),'reading':('带着自己的判断，慢慢读。','在真实正文短暂阅读，保留原文入口和下一步网址')}
for s in raw['segments']:
 story.append({'id':s['id'],'purpose':text[s['id']][1],'source':{'file':str(Path(s['source']).relative_to(ROOT)),'in':s['sourceIn'],'out':s['sourceOut']},'in':cursor,'out':cursor+s['duration'],'speed':1,'screenText':text[s['id']][0],'sound':'original procedural underscore; source video has no audio','transition':'straight cut; loading/preparation gaps omitted','units':'seconds'});cursor+=s['duration']
(ROOT/'storyboard.json').write_text(json.dumps({'units':'seconds','fps':25,'scenes':story},ensure_ascii=False,indent=2))
frames=ROOT/'review'/'frames';frames.mkdir(exist_ok=True)
# All cut sides plus dense/motion keyframes. Boundaries are actual output media times.
times=[0.2,2.0,3.96,4.04,6.6,9.96,10.04,12.2,14.96,15.04,18.6,21.8,22.96,23.04,25.4,28,29.8]
for index,t in enumerate(times):
 subprocess.run([FF,'-y','-v','error','-threads','2','-ss',str(t),'-i',str(video),'-frames:v','1',str(frames/f'{index:02d}-{t:05.2f}.png')],check=True)
# Exact output frame supplies the poster for this render identity.
subprocess.run([FF,'-y','-v','error','-ss','1.6','-i',str(video),'-frames:v','1',str(ROOT/'poster.jpg')],check=True)
sha=hashlib.sha256(video.read_bytes()).hexdigest()
report={'sha256':sha,'file':'final.mp4','probe':'evidence/final-ffprobe.json','checks':logs,'frameReviewTimes':times,'allCuts':[4,10,15,23],'duration':cursor,'sourceNoAudio':all(x['codec_type']!='audio' for s in raw['segments'] for x in s['probe']['streams']),'videoIsRealTime':True,'listening':'not performed','visualReview':'pending'}
(e/'media-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report))
