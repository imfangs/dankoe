import {chromium} from '/Users/fangs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;const mode=process.argv[2]||'sample';const probePath='/opt/homebrew/Caskroom/miniforge/base/bin/ffprobe';
const browser=await chromium.launch({headless:true});const segments=[];const errors=[];
const plans=mode==='sample'?[['brief',7,'https://dankoe.fangs.cc/picks']]:[['home',4,'https://dankoe.fangs.cc/'],['topic',6,'https://dankoe.fangs.cc/letters/'],['search',5,'https://dankoe.fangs.cc/letters/'],['brief',8,'https://dankoe.fangs.cc/picks'],['reading',7,'https://dankoe.fangs.cc/letters/the-death-of-thoughtful-creation-how-to-get-ahead-of-everyone-else']];
for(const [id,duration,url] of plans){
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,colorScheme:'light',recordVideo:{dir:root+'raw/'+mode+'-scenes',size:{width:1280,height:800}}});const page=await context.newPage();const shotErrors=[];page.on('pageerror',e=>shotErrors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await page.waitForTimeout(650);
 async function wheel(d){await page.mouse.move(770,650);await page.mouse.wheel(0,d);}
 if(id==='brief'){await wheel(280);await page.waitForTimeout(700)}
 const start={url:page.url(),scroll:await page.evaluate(()=>scrollY),text:(await page.locator('main').innerText()).slice(0,1400)};const ts=Date.now();
 if(id==='home'){await page.waitForTimeout(2300);await page.mouse.move(400,395,{steps:25})}
 if(id==='topic'){await page.waitForTimeout(900);await page.getByLabel('按主题筛选',{exact:true}).selectOption('写作与创造');await page.waitForTimeout(1500);await wheel(175)}
 if(id==='search'){await page.waitForTimeout(600);await page.getByLabel('筛选文章',{exact:true}).click();await page.getByLabel('筛选文章',{exact:true}).pressSequentially('深思',{delay:420});await page.waitForTimeout(1400)}
 if(id==='brief'){await page.waitForTimeout(700);await page.locator('.pick-brief summary').first().click();await page.waitForTimeout(1200);await wheel(230);await page.waitForTimeout(2700);await wheel(190)}
 if(id==='reading'){await page.waitForTimeout(1500);await wheel(210);await page.waitForTimeout(2700);await wheel(170)}
 await page.waitForTimeout(Math.max(0,duration*1000-(Date.now()-ts)));
 const end={url:page.url(),scroll:await page.evaluate(()=>scrollY),text:(await page.locator('main').innerText()).slice(0,2200)};
 // A trailing hold guards final decode frames; no subsequent navigation can enter this scene.
 await page.waitForTimeout(500);const video=page.video();await context.close();
 const source=root+'raw/'+mode+'-'+id+'.webm';await fs.rename(await video.path(),source);const probe=JSON.parse(execFileSync(probePath,['-v','error','-show_streams','-show_format','-of','json',source],{encoding:'utf8'}));const mediaDuration=Number(probe.format.duration);
 const sourceOut=Number((mediaDuration-.2).toFixed(3));const sourceIn=Number((sourceOut-duration).toFixed(3));
 segments.push({id,duration,source,sourceIn,sourceOut,mediaDuration,probe,start,end,errors:shotErrors});errors.push(...shotErrors);console.log(JSON.stringify({id,sourceIn,sourceOut,mediaDuration,errors:shotErrors}));
}
await fs.writeFile(root+'raw/'+mode+'-capture.json',JSON.stringify({mode,url:'https://dankoe.fangs.cc/',browser:browser.version(),viewport:{width:1280,height:800},clockMapping:'Independent recording for every scene, trim using its finalized media duration. Each clip contains only its own page; 0.5s capture tail, output ends 0.2s before media end. Verify actual cut boundary frames.',segments,errors},null,2));await browser.close();
