import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const sharp=req('sharp');
const root=(REPO_ROOT + '/art/production-v6');
const sources=JSON.parse(fs.readFileSync(root+'/generated-sources.json','utf8').replace(/^\uFEFF/,''));
fs.mkdirSync(root+'/sources',{recursive:true});
for(const [id,source] of Object.entries(sources)){
 const dest=root+'/sources/'+id+(Object.keys(sources).indexOf(id)<12?'-atlas':'')+'.png';
 if(!fs.existsSync(dest)){if(!fs.existsSync(source))throw new Error('Selected source missing: '+dest);fs.copyFileSync(source,dest);}
 const {data,info}=await sharp(dest).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height,n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n),parts=[];
 for(let s=0;s<n;s++){
  if(seen[s]||data[s*4+3]<128)continue;
  let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0;
  queue[0]=s;seen[s]=1;
  while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(q>=0&&!seen[q]&&data[q*4+3]>=128){seen[q]=1;queue[tail++]=q;}}
  if(tail>3000)parts.push({area:tail,x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1});
 }
 console.log(id,info.width+'x'+info.height,JSON.stringify(parts));
}
