import fs from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
const root=new URL('../',import.meta.url).pathname,dist=path.join(root,'docs/.vitepress/dist');
const status=JSON.parse(await fs.readFile(path.join(dist,'content-status.json'),'utf8'));
const index=JSON.parse(await fs.readFile(path.join(root,'docs/.vitepress/theme/articles.json'),'utf8'));
const picks=JSON.parse(await fs.readFile(path.join(root,'docs/.vitepress/theme/reading-picks.json'),'utf8'));
const errors=[];let images=0,links=0;
const exists=async p=>fs.access(p).then(()=>true,()=>false);
if(new Set(picks.map(p=>p.slug)).size!==picks.length)errors.push('Duplicate curated article');
for(const [i,pick] of picks.entries()){
 if(!index.some(a=>a.slug===pick.slug))errors.push('Unknown curated article '+pick.slug);
 if(pick.rank!==i+1||pick.points?.length!==3||!pick.why||!pick.question||!pick.caveat)errors.push('Incomplete reading brief '+pick.slug);
}
if(await exists(path.join(dist,'picks.html'))){
 const $=load(await fs.readFile(path.join(dist,'picks.html'),'utf8'));
 if($('.article-row').length!==picks.length||$('.pick-brief').length!==picks.length)errors.push('Curated page missing articles or briefs');
 for(const pick of picks)if(!$('[id="pick-'+pick.slug+'"]').length)errors.push('Missing curated anchor '+pick.slug);
}else errors.push('Missing curated page');
for(const a of index){
 const file=path.join(dist,a.url+'.html');
 if(!await exists(file)){errors.push('Missing article '+a.url);continue;}
 const html=await fs.readFile(file,'utf8'),$=load(html);
 if(!$('h1').text().includes(a.title))errors.push('Wrong h1 '+a.url);
 for(const heading of $('.vp-doc h1,.vp-doc h2,.vp-doc h3').toArray()){
  const text=$(heading).text();
  if(/[A-Za-z]{3,}/.test(text)&&!/[\u4e00-\u9fff]/.test(text))errors.push('Untranslated heading '+a.url+': '+text);
 }
 if(!$('meta[name="robots"]').attr('content')?.includes('noindex'))errors.push('Missing robots '+a.url);
 if(!$('a[href^="https://thedankoe.com/"]').length)errors.push('Missing source '+a.url);
 if(/AWSAccessKeyId|[?&](?:Signature|X-Amz-Signature)=|<script[^>]*src=["']https?:/.test(html))errors.push('Unexpected private URL or external script '+a.url);
 for(const el of $('.vp-doc img').toArray()){
  const url=$(el).attr('src');images++;
  if(!url?.startsWith('/')||!await exists(path.join(dist,url)))errors.push('Missing or external image '+url);
 }
 for(const el of $('.vp-doc a').toArray()){
  const href=$(el).attr('href');if(!href?.startsWith('/')||href.startsWith('//'))continue;links++;
  const local=decodeURIComponent(href.split(/[?#]/)[0]);
  if(!await exists(path.join(dist,local))&&!await exists(path.join(dist,local+'.html'))&&!await exists(path.join(dist,local,'index.html')))errors.push('Dead internal link '+href+' in '+a.url);
 }
}
const report={checkedAt:new Date().toISOString(),articles:index.length,expected:status.expected,complete:status.complete,curatedArticles:picks.length,imagesChecked:images,internalLinksChecked:links,errors};
await fs.mkdir(path.join(root,'verification'),{recursive:true});await fs.writeFile(path.join(root,'verification/content-check.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(errors.length||!status.complete)process.exit(1);
