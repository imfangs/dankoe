from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, wave, json, hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
FONT='/System/Library/Fonts/Hiragino Sans GB.ttc'
LATIN='/System/Library/Fonts/HelveticaNeue.ttc'
BG='#fafaf7'; INK='#172b35'; BLUE='#365b70'; MUTED='#64727a'
def f(n): return ImageFont.truetype(FONT,n)
def draw(id,index,title,subtitle):
 im=Image.new('RGBA',(1920,1080),BG);d=ImageDraw.Draw(im)
 d.rectangle((448,134,1855,1013),fill=(0,0,0,0));d.rectangle((447,133,1856,1014),outline='#d5dad8',width=1)
 d.text((64,58),'DAN KOE',font=ImageFont.truetype(LATIN,39),fill=INK)
 d.text((66,110),'中文阅读站',font=f(24),fill=MUTED)
 d.line((64,222,126,222),fill=BLUE,width=4)
 y=272
 for line in title.split('\n'):
  d.text((60,y),line,font=f(49),fill=INK);y+=76
 y+=26
 for line in subtitle.split('\n'):
  d.text((64,y),line,font=f(24),fill=MUTED);y+=42
 d.text((450,70),'真实产品画面',font=f(23),fill=MUTED)
 d.text((1520,70),'dankoe.fangs.cc',font=ImageFont.truetype(LATIN,25),fill=BLUE)
 d.text((64,865),f'{index:02d} / 05',font=ImageFont.truetype(LATIN,24),fill=BLUE)
 d.text((64,923),'慢慢读。',font=f(31),fill=INK)
 d.text((64,1033),'非官方中文译站 · 个人学习用途',font=f(18),fill=MUTED)
 d.text((860,1033),'原作 © Dan Koe 及原权利人 · 原文 thedankoe.com',font=f(18),fill=MUTED)
 im.save(ROOT/'design'/f'{id}.png')
for row in [
 ('home',1,'从一个\n问题开始。','关于心智、创造\n与自主生活的长文'),
 ('topic',2,'沿着兴趣，\n找到主题。','写作与创造\n心智与学习 · 一人企业'),
 ('search',3,'想读什么，\n就搜什么。','输入一个关键词\n回到相关的文章'),
 ('brief',4,'先看导读，\n再读全文。','原文要点 · 实践问题\n也保留不同的提醒'),
 ('reading',5,'带着自己的\n判断，慢慢读。','dankoe.fangs.cc\n每篇保留原文入口')]:draw(*row)
# Original procedural underscore; no sampled music, no voice, no recorded product audio.
sr=48000;length=32;n=int(sr*length);t=np.arange(n)/sr;a=np.zeros((n,2))
chords=[[196,246.9417,293.6648,369.9944],[164.8138,220,261.6256,329.6276],[174.6141,220,293.6648,349.2282],[146.8324,196,246.9417,293.6648]]
for k,chord in enumerate(chords):
 start=k*8;local=t-start;env=np.clip(local/1.6,0,1)*np.clip((8.8-local)/2.2,0,1);valid=(local>=0)&(local<8.8);env*=valid
 for j,hz in enumerate(chord):
  tone=(np.sin(2*np.pi*hz*local)+.13*np.sin(2*np.pi*hz*2*local))*env*.025
  a[:,0]+=tone*(.8+j*.035);a[:,1]+=tone*(.9-j*.025)
 for j,hz in enumerate(chord+[chord[2]*2]):
  lt=t-(start+1+j*1.25);e=np.where(lt>=0,np.exp(-np.maximum(lt,0)/1.9)*(1-np.exp(-np.maximum(lt,0)/.035)),0)
  bell=(np.sin(2*np.pi*hz*2*lt)+.07*np.sin(2*np.pi*hz*4*lt))*e*.03
  a[:,0]+=bell*.88;a[:,1]+=bell
fade=np.minimum(np.clip(t/.7,0,1),np.clip((length-t)/2,0,1));a*=fade[:,None]
a=np.clip(a,-.7,.7)
with wave.open(str(ROOT/'design'/'original-underscore.wav'),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((a*32767).astype('<i2').tobytes())
print(json.dumps({'font':FONT,'fontSHA256':hashlib.sha256(Path(FONT).read_bytes()).hexdigest(),'audioPeak':float(abs(a).max())}))
