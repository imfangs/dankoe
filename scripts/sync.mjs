import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';
import TurndownService from 'turndown';
const root = new URL('../', import.meta.url).pathname;
const sourceDir=path.join(root,'content/source');
const td=new TurndownService({headingStyle:'atx',bulletListMarker:'-',codeBlockStyle:'fenced'});
td.addRule('video',{filter:'iframe',replacement:(_,n)=>n.getAttribute('src')?`\n\n[观看原文视频](${n.getAttribute('src')})\n\n`:''});
td.addRule('strike',{filter:['s','del'],replacement:c=>`~~${c}~~`});
const json=async(p,d)=>fs.writeFile(p,JSON.stringify(d,null,2)+'\n');
async function fetchData(url){const r=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw Error(`${r.status} ${url}`);return r;}
if(!process.argv.includes('--cached')){
 for(const type of ['letters','posts']){
  const r=await fetchData(`https://thedankoe.com/wp-json/wp/v2/${type}?per_page=100&page=1`);
  const total=Number(r.headers.get('x-wp-totalpages'));
  for(const old of await fs.readdir(sourceDir)){const m=old.match(new RegExp('^'+type+'-(\\d+)\\.json$'));if(m&&Number(m[1])>total)await fs.unlink(path.join(sourceDir,old));}
  await json(path.join(sourceDir,`${type}-1.json`),await r.json());
  for(let page=2;page<=total;page++)await json(path.join(sourceDir,`${type}-${page}.json`),await(await fetchData(`https://thedankoe.com/wp-json/wp/v2/${type}?per_page=100&page=${page}`)).json());
 }
}
let raw=[];
for(const name of (await fs.readdir(sourceDir)).filter(n=>/^(letters|posts)-\d+\.json$/.test(n)))raw.push(...JSON.parse(await fs.readFile(path.join(sourceDir,name),'utf8')));
const imageMap={},imageFailures=[];
await fs.mkdir(path.join(root,'docs/public/images'),{recursive:true});
const imageUrls=new Set();
for(const p of raw){const $=load(p.content.rendered);$('img').each((_,el)=>{const u=$(el).attr('data-src')||$(el).attr('src');if(u&&/^https?:/.test(u))imageUrls.add(u)});}
const queue=[...imageUrls];
await Promise.all(Array.from({length:2},async()=>{while(queue.length){const url=queue.shift();try{const ext=path.extname(new URL(url).pathname).toLowerCase()||'.jpg';const name=crypto.createHash('sha256').update(url).digest('hex').slice(0,20)+ext;const file=path.join(root,'docs/public/images',name);try{await fs.access(file)}catch{await new Promise(r=>setTimeout(r,750));const r=await fetchData(url);if(!r.headers.get('content-type')?.startsWith('image/'))throw Error('Not image');await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));}imageMap[url]='/images/'+name;}catch(e){imageFailures.push({url,error:String(e)});}}}));
const articles=raw.map(p=>{
 const $=load(p.content.rendered);$('script,style,form,button,input').remove();
 $('img').each((_,el)=>{const n=$(el),u=n.attr('data-src')||n.attr('src');if(imageMap[u])n.attr('src',imageMap[u]);else n.replaceWith($('<a>').attr('href',u||p.link).text('[查看原图]'));n.removeAttr('srcset').removeAttr('sizes');});
 $('a').each((_,el)=>{const n=$(el),href=n.attr('href');if(href){try{n.attr('href',new URL(href,p.link).href)}catch{n.removeAttr('href')}}});
 const title=load(p.title.rendered).text();
 const markdown=td.turndown($.html()).replace(/\u00a0/g,' ').trim();
 const hash=crypto.createHash('sha256').update(title+'\n'+markdown).digest('hex');
 const blocks=[{id:'title',text:title},...markdown.split(/\n{2,}/).filter(Boolean).map((text,i)=>({id:String(i),text}))];
 return {id:p.id,slug:p.slug,type:p.type==='post'?'blog':'letters',title,date:p.date.slice(0,10),modified:p.modified,originalUrl:p.link,hash,blocks};
}).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
if(new Set(articles.map(a=>a.slug)).size!==articles.length)throw Error('Duplicate slugs');
await json(path.join(root,'content/articles.json'),articles);
await json(path.join(root,'content/source/sync-report.json'),{syncedAt:new Date().toISOString(),count:articles.length,letters:articles.filter(a=>a.type==='letters').length,blog:articles.filter(a=>a.type==='blog').length,images:imageUrls.size,downloaded:Object.keys(imageMap).length,imageFailures,imageMap});
console.log(JSON.stringify({articles:articles.length,blocks:articles.reduce((s,a)=>s+a.blocks.length,0),chars:articles.reduce((s,a)=>s+a.blocks.reduce((n,b)=>n+b.text.length,0),0),images:imageUrls.size,failures:imageFailures.length}));
