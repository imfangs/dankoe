from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1];PROBE='/opt/homebrew/Caskroom/miniforge/base/bin/ffprobe'
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assets=[]
for rel in ['raw/sample.webm',*[str(p.relative_to(ROOT)) for p in sorted((ROOT/'raw').glob('full-*.webm')) if '-v1' not in p.name],'design/original-underscore.wav','sample.mp4','final.mp4','poster.jpg']:
 p=ROOT/rel;item={'file':rel,'sha256':h(p),'bytes':p.stat().st_size}
 if p.suffix in ['.webm','.wav','.mp4']:
  probe=json.loads(subprocess.check_output([PROBE,'-v','error','-show_streams','-show_format','-of','json',str(p)],text=True));item.update({'duration':float(probe['format']['duration']),'streams':[{k:s[k] for k in ['codec_type','codec_name','width','height','r_frame_rate','sample_rate','channels'] if k in s} for s in probe['streams']]})
 if rel.startswith('raw/'):
  item.update({'source':'https://dankoe.fangs.cc/','sourceVersion':'Live production snapshot captured 2026-10-01; source baseline 5614f26e310546449fd5ad5c91b50156cdbfc622','capture':'Isolated Playwright Chromium 151.0.7922.34 context; real DOM actions; no product modification; 1280x800 viewport; page loads and preparation gaps excluded in edit; no speed changes','rights':'Product demo of unofficial personal-learning translation site. Original texts and graphics remain Dan Koe and respective rightsholders; this record does not establish downstream publication permission. Brief excerpts only, no long-form narration.','audio':'Source recordVideo has no audio stream'})
 elif rel.endswith('.wav'):item.update({'source':'scripts/design.py','creator':'Original procedural composition authored in this project by Ged on 2026-10-01','rights':'No third-party samples or melody source used; output available for this project.','role':'Reconstructed underscore, not site audio or live sound','listening':'Not performed'})
 elif rel=='poster.jpg':item.update({'source':'final.mp4 at 1.6 seconds','rights':'Same rights and provenance as final.mp4'})
 else:item.update({'source':'Real footage + rendered title PNG + original synthesized underscore','rights':'Original product/text rights retained as above. No claim of official endorsement.'})
 assets.append(item)
for p in sorted((ROOT/'design').glob('*.png')):assets.append({'file':str(p.relative_to(ROOT)),'sha256':h(p),'bytes':p.stat().st_size,'source':'scripts/design.py','role':'Film packaging only; not product UI','fontSource':'macOS Hiragino Sans GB and Helvetica Neue; rasterized output, font files not distributed'})
(ROOT/'assets.json').write_text(json.dumps({'date':'2026-10-01','assets':assets},ensure_ascii=False,indent=2))
inputs={str(p.relative_to(ROOT)):h(p) for p in sorted(ROOT.rglob('*')) if p.is_file() and ((p.parent.name=='scripts' and 'rejected' not in p.name) or p.name in ['tools.json','storyboard.json'] or p.parent.name=='design' or (p.parent.name=='raw' and (p.name in ['full-capture.json','sample-capture.json'] or p.name.startswith('reference-'))) or (p.suffix=='.webm' and p.name.startswith(('full-','sample.')) and '-v1' not in p.name))}
(ROOT/'evidence'/'render-identity.json').write_text(json.dumps({'finalSha256':h(ROOT/'final.mp4'),'sampleSha256':h(ROOT/'sample.mp4'),'posterSha256':h(ROOT/'poster.jpg'),'inputHashes':inputs,'dependencies':json.loads((ROOT/'tools.json').read_text()),'rules':'Changing a source, script, font, tool binary or mix invalidates prior output review. Re-render and bind checks to the new MP4 SHA.'},ensure_ascii=False,indent=2))
print(json.dumps({'final':h(ROOT/'final.mp4'),'poster':h(ROOT/'poster.jpg'),'assetCount':len(assets)}))
