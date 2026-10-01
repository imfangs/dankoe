from pathlib import Path
from PIL import Image
import json,subprocess,numpy as np
r=Path(__file__).resolve().parents[1];p=r/'raw/full-capture.json';data=json.loads(p.read_text());audit=[]
for s in data['segments']:
 # Separate recording, exact viewport, same source page/state; grayscale MSE locates a media frame, not a wall-clock assumption.
 ref=np.asarray(Image.open(r/f"raw/reference-{s['id']}.png").convert('L').resize((160,100),Image.Resampling.BILINEAR)).astype(float)
 raw=subprocess.check_output(['/opt/homebrew/Caskroom/miniforge/base/bin/ffmpeg','-v','error','-threads','2','-i',s['source'],'-vf','fps=25,scale=160:100:flags=bilinear,format=gray','-f','rawvideo','-'])
 frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,100,160).astype(float);scores=np.mean((frames-ref)**2,axis=(1,2));best=float(scores.min());close=np.flatnonzero(scores<=max(best*1.15,best+1.5));first=int(close[0]);last=int(close[-1]);start=first/25
 # First stable page baseline retains the actual subsequent action and result. End stays inside this single-page source.
 previous=s['sourceIn'];s['sourceIn']=start;s['sourceOut']=round(start+s['duration'],3);s['alignment']={'method':'first decoded frame within max(minMSE*1.15,minMSE+1.5) of independent starting-page screenshot','reference':f"raw/reference-{s['id']}.png",'minMSE':best,'firstMatchFrame':first,'lastMatchFrame':last,'fps':25,'previousTailIn':previous}
 assert s['sourceOut']<=s['mediaDuration'],s
 audit.append({'id':s['id'],**s['alignment'],'sourceIn':s['sourceIn'],'sourceOut':s['sourceOut']})
data['clockMapping']='Each shot independent WebM; sourceIn chosen from decoded 25fps grayscale MSE match to independently reproduced starting page. Actual key/cut frames visually reviewed.';p.write_text(json.dumps(data,ensure_ascii=False,indent=2));(r/'evidence/media-alignment.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2));print(json.dumps(audit))
