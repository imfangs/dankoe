import {chromium} from '/Users/fangs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
const mode=process.argv[2]||'sample';
const ffprobe='/opt/homebrew/Caskroom/miniforge/base/bin/ffprobe';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,colorScheme:'light',recordVideo:{dir:root+'raw/'+mode,size:{width:1280,height:800}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const events=[];let epoch=Date.now();
async function mark(event){events.push({event,wallSincePageSeconds:(Date.now()-epoch)/1000,url:page.url(),scroll:await page.evaluate(()=>scrollY),text:(await page.locator('main').innerText()).slice(0,2200)});}
async function ready(url){await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await page.waitForTimeout(500);}
async function wheel(d){await page.mouse.move(1050,640);await page.mouse.wheel(0,d);}
const segments=[];
async function shot(id,duration,action){await mark(id+'-start');const wallStart=Date.now();await action();const elapsed=Date.now()-wallStart;await page.waitForTimeout(Math.max(0,duration*1000-elapsed));await mark(id+'-end');segments.push({id,duration,wallStart,wallEnd:Date.now()});}
if(mode==='sample'){
 await ready('https://dankoe.fangs.cc/picks');await wheel(275);await page.waitForTimeout(700);
 await shot('brief',7,async()=>{await page.waitForTimeout(850);await page.locator('.pick-brief summary').first().click();await page.waitForTimeout(800);await wheel(220);});
}else{
 await ready('https://dankoe.fangs.cc/');
 await shot('home',4,async()=>{await page.waitForTimeout(2400);await page.mouse.move(400,395,{steps:25});});
 await ready('https://dankoe.fangs.cc/letters/');
 await shot('topic',6,async()=>{await page.waitForTimeout(900);await page.getByLabel('按主题筛选',{exact:true}).selectOption('写作与创造');await page.waitForTimeout(1500);await wheel(175);});
 await ready('https://dankoe.fangs.cc/letters/');
 await shot('search',5,async()=>{await page.waitForTimeout(600);await page.getByLabel('筛选文章',{exact:true}).click();await page.getByLabel('筛选文章',{exact:true}).pressSequentially('深思',{delay:420});await page.waitForTimeout(1400);});
 await ready('https://dankoe.fangs.cc/picks');await wheel(280);await page.waitForTimeout(700);
 await shot('brief',8,async()=>{await page.waitForTimeout(700);await page.locator('.pick-brief summary').first().click();await page.waitForTimeout(1200);await wheel(230);await page.waitForTimeout(2700);await wheel(190);});
 await ready('https://dankoe.fangs.cc/letters/the-death-of-thoughtful-creation-how-to-get-ahead-of-everyone-else');
 await shot('reading',7,async()=>{await page.waitForTimeout(1500);await wheel(280);await page.waitForTimeout(2700);await wheel(220);});
}
await page.waitForTimeout(300);
const stopped=Date.now();const video=page.video();await context.close();
const source=await video.path();const target=root+'raw/'+mode+'.webm';await fs.rename(source,target);
const probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',target],{encoding:'utf8'}));
// Recorder timing is calibrated from finalized media end; each action has a 0.3 s trailing guard.
const mediaDuration=Number(probe.format.duration);for(const s of segments){s.sourceIn=Number((mediaDuration-(stopped-s.wallStart)/1000).toFixed(3));s.sourceOut=Number((s.sourceIn+s.duration).toFixed(3));}
await fs.writeFile(root+'raw/'+mode+'-capture.json',JSON.stringify({mode,url:'https://dankoe.fangs.cc/',browser:browser.version(),viewport:{width:1280,height:800},source:target,probe,mediaDuration,clockMapping:'finalized media end minus wall delta; selected boundary frames must be reviewed',events,segments,errors},null,2));
await browser.close();console.log(JSON.stringify({mode,mediaDuration,segments,errors}));
