import {chromium} from '/Users/fangs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url).pathname;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:'light'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const data={browser:browser.version(),pages:[],errors};
for(const url of ['https://hi.fangs.cc/projects/dankoe/','https://dankoe.fangs.cc/','https://dankoe.fangs.cc/letters/','https://dankoe.fangs.cc/picks']){
 const res=await page.goto(url,{waitUntil:'networkidle'}); await page.evaluate(()=>document.fonts.ready);
 data.pages.push({url:page.url(),status:res.status(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,12500),inputs:await page.locator('input,select').evaluateAll(xs=>xs.map(x=>({tag:x.tagName,label:x.getAttribute('aria-label'),placeholder:x.getAttribute('placeholder'),options:x.options?[...x.options].map(o=>o.textContent):[]}))),links:await page.locator('main a').evaluateAll(xs=>xs.slice(0,25).map(x=>({text:x.textContent,href:x.getAttribute('href')})))});
 if(url.endsWith('picks')) await page.screenshot({path:root+'evidence/recon-picks.png'});
}
await fs.writeFile(root+'evidence/product-recon.json',JSON.stringify(data,null,2));
await context.close();await browser.close();console.log(JSON.stringify(data,null,2));
