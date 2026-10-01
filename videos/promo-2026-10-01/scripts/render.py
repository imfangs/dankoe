from pathlib import Path
import subprocess,json,sys,hashlib
ROOT=Path(__file__).resolve().parents[1]
FF='/opt/homebrew/Caskroom/miniforge/base/bin/ffmpeg'
mode=sys.argv[1] if len(sys.argv)>1 else 'full'
data=json.loads((ROOT/'raw'/f'{mode}-capture.json').read_text())
segments=data['segments'];outdir=ROOT/'rendered'/mode;outdir.mkdir(parents=True,exist_ok=True)
commands=[]
def run(cmd):
 commands.append(cmd);subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
for s in segments:
 run([FF,'-y','-hide_banner','-threads','2','-ss',str(s['sourceIn']),'-t',str(s['duration']),'-i',str(s.get('source',ROOT/'raw'/f'{mode}.webm')),'-i',str(ROOT/'design'/f"{s['id']}.png"),'-filter_complex_threads','1','-filter_complex','[0:v]fps=25,scale=1408:880:flags=lanczos,pad=1920:1080:448:134:color=0xfafaf7[v];[v][1:v]overlay=0:0:format=auto,format=yuv420p,setsar=1[out]','-map','[out]','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-movflags','+faststart',str(outdir/f"{s['id']}.mp4")])
listing=outdir/'concat.txt';listing.write_text(''.join("file '"+str(outdir/f"{s['id']}.mp4")+"'\n" for s in segments))
duration=sum(s['duration'] for s in segments)
out=ROOT/('sample.mp4' if mode=='sample' else 'final.mp4')
run([FF,'-y','-hide_banner','-threads','2','-f','concat','-safe','0','-i',str(listing),'-i',str(ROOT/'design'/'original-underscore.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',f'afade=t=out:st={duration-1.4}:d=1.4','-c:a','aac','-b:a','192k','-t',str(duration),'-movflags','+faststart',str(out)])
(ROOT/'evidence'/f'{mode}-render-commands.json').write_text(json.dumps(commands,indent=2))
print(json.dumps({'file':str(out),'duration':duration,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
