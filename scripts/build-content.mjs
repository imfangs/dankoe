import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const write=async(p,s)=>{await fs.mkdir(path.dirname(path.join(root,p)),{recursive:true});await fs.writeFile(path.join(root,p),s)};
const exists=async p=>fs.access(path.join(root,p)).then(()=>true,()=>false);
// Cloned repositories can build the committed, already verified Markdown without the local corpus.
if(!await exists('content/articles.json')){
 if(!await exists('docs/.vitepress/theme/articles.json'))throw Error('No source corpus or generated site. Run npm run sync first.');
 console.log('Building committed translated Markdown.');process.exit(0);
}
execFileSync('python3',[path.join(root,'scripts/translate.py'),'--assemble-only'],{stdio:'ignore'});
const articles=await read('content/articles.json'), translations=await read('content/translated.json');
const translated=new Map(translations.map(t=>[t.slug,t]));
const preview=process.env.DANKOE_PREVIEW==='1';
if(!preview&&articles.length!==translations.length)throw Error(`Translation incomplete: ${translations.length}/${articles.length}; refusing a production build.`);
const sync=await read('content/source/sync-report.json');
const repairs=await exists('content/image-repairs.json')?await read('content/image-repairs.json'):{imageMap:{}};
const images={...sync.imageMap,...repairs.imageMap};
const known=new Map(articles.map(a=>[new URL(a.originalUrl).pathname.replace(/\/$/,''),`/${a.type}/${a.slug}`]));
const active=articles.filter(a=>translated.has(a.slug));
const available=new Set(active.map(a=>`/${a.type}/${a.slug}`));
const safe=s=>s.replace(/</g,'&lt;').replace(/\{\{/g,'&#123;&#123;');
const cleanUrl=url=>{try{const u=new URL(url);for(const key of [...u.searchParams.keys()])if(/signature|accesskey|expires|^x-amz-/i.test(key))u.searchParams.delete(key);return u.href;}catch{return url;}};
function prepare(text,originalUrl){
 text=text.replaceAll('[\\[查看原图\\]]','[查看原图]');
 text=text.replace(/\[(?:查看原图|View original image)\]\(([^\s)]+)\)/g,(_,url)=>images[url]?`![](${images[url]})`:'DANKOE_IMAGE_UNAVAILABLE');
 text=text.replace(/(!?\[[^\]]*\]\()([^\s)]+)([^)]*\))/g,(all,start,url,end)=>{
  if(url.startsWith('http')){
   const u=new URL(url),local=u.hostname==='thedankoe.com'?known.get(u.pathname.replace(/\/$/,'')):null;
   if(local&&available.has(local)&&!start.startsWith('!'))return start+local+end;
   return start+cleanUrl(url)+end;
  }return all;
 });
 // Underscore emphasis has intraword semantics unsuitable for Chinese; keep URLs/code intact.
 text=text.split(/(`[^`]*`|!?\[[^\]]*\]\([^)]*\))/g).map((part,i)=>i%2?part:part.replace(/(?<![\\\w])_([^_\n]+)_(?!\w)|(?<=[\u4e00-\u9fff])_([^_\n]+)_/g,(_,a,b)=>`*${a||b}*`)).join('');
 text=text.split('\n').map(line=>line.trim()==='>'?'>':(/\S {2,}$/.test(line)?line.trimEnd()+'\\':line.trimEnd())).join('\n');
 return safe(text.replaceAll('DANKOE_IMAGE_UNAVAILABLE',`[原站图片暂不可用，查看原文](${originalUrl})`));
}
function topic(a){const s=a.title.toLowerCase();if(/business|money|rich|income|million|niche|marketing|sell|sales|profit|career|\bearn|product|monetiz/.test(s))return '一人企业';if(/writing|creat|content|youtube|social media|brand|audience|internet/.test(s))return '写作与创造';if(/focus|learn|intelligen|think|mind|knowledge|brain|read|study|mental/.test(s))return '心智与学习';return '自主生活';}
const strip=s=>s.replace(/!?\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[#*_>`~]/g,'').replace(/\s+/g,' ').trim();
const index=[];
const overrides=await read('scripts/editorial-overrides.json');
for(const a of active){
 const t=translated.get(a.slug);if(t.sourceHash!==a.hash)throw Error('Stale translation '+a.slug);
 if(t.blocks.length!==a.blocks.length)throw Error('Misaligned blocks '+a.slug);
 const override=overrides[a.slug]||{};
 const edit=text=>(override.replacements||[]).reduce((out,[from,to])=>out.replaceAll(from,to),text);
 const title=override.title||t.blocks[0].text,body=t.blocks.slice(1).map(b=>prepare(edit(b.text),a.originalUrl)).join('\n\n');
 const minutes=Math.max(1,Math.ceil((body.match(/[\u4e00-\u9fff]/g)||[]).length/400));
 const metadata={title,originalTitle:a.title,date:a.date,originalUrl:a.originalUrl,minutes,sourceHash:a.hash,translation:'AI-assisted, block-aligned; not official',head:[['link',{rel:'canonical',href:a.originalUrl}]]};
 const fm=Object.entries(metadata).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n');
 const original=a.blocks.slice(1).map(b=>prepare(b.text,a.originalUrl)).join('\n\n');
 await write(`docs/${a.type}/${a.slug}.md`,`---\n${fm}\n---\n\n# ${safe(title)}\n\n<ArticleMeta />\n\n${body}\n\n---\n\n[查看英文存档](/en/${a.type}/${a.slug}) · [返回全部文章](/letters/)\n`);
 await write(`docs/en/${a.type}/${a.slug}.md`,`---\ntitle: ${JSON.stringify(a.title)}\nsearch: false\nsidebar: false\n---\n\n# ${safe(a.title)}\n\nDan Koe · ${a.date} · [原文](${a.originalUrl}) · [返回中文译文](/${a.type}/${a.slug})\n\n${original}\n`);
 const paragraphs=t.blocks.slice(1).filter(b=>!/^([#!>*-]|\d+\.)/.test(b.text)&&b.text.length>2);
 const excerpt=edit(strip(paragraphs.slice(0,2).map(b=>b.text).join(' ')).slice(0,150));
 index.push({slug:a.slug,title,titleEn:a.title,date:a.date,url:`/${a.type}/${a.slug}`,topic:topic(a),excerpt,minutes});
}
await write('docs/.vitepress/theme/articles.json',JSON.stringify(index,null,2)+'\n');
const years=[...new Set(index.map(a=>a.date.slice(0,4)))];
await write('docs/.vitepress/sidebar.json',JSON.stringify([{text:'阅读导航',items:[{text:'全部文章',link:'/letters/'},{text:'关于本站',link:'/about'}]},...years.map(y=>({text:y+' 年',collapsed:true,items:index.filter(a=>a.date.startsWith(y)).map(a=>({text:a.title,link:a.url}))}))],null,2)+'\n');
await write('docs/index.md',`---\nlayout: doc\nsidebar: false\naside: false\ntitle: 首页\n---\n\n<div class="reading-intro">\n<p class="kicker">DAN KOE · 中文阅读</p>\n<h1>少工作，多赚钱，<br>享受生活。</h1>\n<p class="lead">关于心智、互联网和未来的长文。<br>探索人的潜能，重新设计生活，创造属于自己的事业。</p>\n<div class="intro-links"><a href="/letters/">浏览全部 ${index.length} 篇文章 →</a><a href="/about">了解这个译站</a></div>\n</div>\n\n<div class="section-heading"><h2>从这里开始阅读</h2><a href="/letters/">全部文章 →</a></div>\n\n<ArticleList :limit="8" />\n`);
await write('docs/letters/index.md',`---\ntitle: 全部文章\nsidebar: false\naside: false\n---\n\n# 全部文章\n\n${index.length} 篇长文，关于一人企业、写作与创造、心智与学习，以及自主生活。\n\n<ArticleList />\n`);
await write('docs/blog/index.md','---\ntitle: Blog\nsidebar: false\n---\n\n# Blog\n\n'+index.filter(a=>a.url.startsWith('/blog/')).map(a=>`- [${a.title}](${a.url})`).join('\n')+'\n');
await write('docs/about.md',`---\ntitle: 关于本站\nsidebar: false\n---\n\n# 关于本站\n\n这是 **Dan Koe 公开文章的非官方中文译站**，由方帅整理，用于个人学习与阅读。\n\n原作者是 Dan Koe。本站与 Dan Koe 及其产品没有官方关联。译文由 AI 辅助完成，已检查段落对应、标题层级和链接完整性，但并不等于逐篇人工审校。遇到歧义，请以每篇文章附带的英文原文为准。\n\n## 收录范围\n\n本次于 2026 年 9 月 18 日核对原站公开目录，收录 **189 篇 Letters 和 1 篇 Blog，共 190 篇文章**。原站文章日期为 ${articles.at(-1).date} 至 ${articles[0].date}。英文原文同时保存为可阅读的存档。\n\n原站当前将最新订阅导向 [The Koe Letters](https://letters.thedankoe.com/)。该独立订阅站的新内容、付费文章、课程及外部资源不在本次镜像范围内。原站测试页面、客服表单和营销活动页面也不作为文章收录。本站不收集邮箱，不提供付费课程副本。\n\n## 官方资源\n\n- [Dan Koe 官网](https://thedankoe.com/)\n- [The Koe Letters · 官方订阅](https://letters.thedankoe.com/)\n- [Future Proof · 官方付费内容](https://thedankoe.substack.com/)\n- [Eden · AI 画布与资料库](https://eden.so/)\n- [Purpose & Profit · 官方书籍页面](https://thedankoe.com/purpose/)\n- [The Art of Focus · 官方书籍页面](https://theartoffocusbook.com/)\n\n## 翻译与图片\n\n尽量保留原文的论证、例子、语气、标题、列表和链接。站内已有译文的交叉引用会指向中文页面，文中的作者主张仍代表作者观点。主题分类由本站整理，仅帮助浏览。\n\n可正常获取的配图保存在本站，图中文字保留原样。部分原站图片链接已经失效，无法恢复时保留原文入口，不生成替代图冒充原图。\n\n## 版权与反馈\n\n原文及配图版权归 Dan Koe 与相应权利人所有，本站不声称获得官方翻译授权。每篇均标注原作者和原文地址，不设广告、不做搜索引擎推广。\n\n如发现译文问题或需要处理内容权利问题，可通过 [项目 Issues](https://github.com/imfangs/dankoe/issues) 联系维护者。\n`);
await write('docs/public/robots.txt','User-agent: *\nDisallow: /\n');
await write('docs/public/CNAME','dankoe.fangs.cc\n');await write('docs/public/.nojekyll','');
const report={builtAt:new Date().toISOString(),articles:index.length,expected:articles.length,complete:index.length===articles.length,sourceDateRange:[articles.at(-1).date,articles[0].date],alignedBlocks:active.reduce((n,a)=>n+a.blocks.length,0),localImages:Object.keys(images).length,upstreamImageUrls:sync.images};
await write('docs/public/content-status.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
