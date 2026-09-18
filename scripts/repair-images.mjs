import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url).pathname;
const file=path.join(root,'content/source/sync-report.json');
const report=JSON.parse(await fs.readFile(file,'utf8'));
const failures=[];
for(const [i,item] of report.imageFailures.entries()){
 const url=item.url;const ext=path.extname(new URL(url).pathname)||'.jpg';const name=crypto.createHash('sha256').update(url).digest('hex').slice(0,20)+ext;
 let ok=false;
 for(let attempt=0;attempt<3;attempt++){
  await new Promise(r=>setTimeout(r,attempt?15000:1500));
  try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.status===429)continue;if(!r.ok)break;if(!r.headers.get('content-type')?.startsWith('image/'))break;await fs.writeFile(path.join(root,'docs/public/images',name),Buffer.from(await r.arrayBuffer()));report.imageMap[url]='/images/'+name;ok=true;break;}catch{}
 }
 if(!ok)failures.push(item);
 if(i%10===0)console.log(JSON.stringify({checked:i+1,total:report.imageFailures.length,recovered:Object.keys(report.imageMap).length-report.downloaded}),{flush:true});
 // Keep a checkpoint separate from the source snapshot.
 await fs.writeFile(path.join(root,'content/image-repairs.json'),JSON.stringify({imageMap:report.imageMap,failures,checked:i+1,total:report.imageFailures.length},null,2));
}
console.log(JSON.stringify({images:Object.keys(report.imageMap).length,unavailable:failures.length}));
