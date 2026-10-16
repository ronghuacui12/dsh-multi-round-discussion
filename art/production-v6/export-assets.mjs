import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
// Asset-only export: separate generated atlas cells, preserve alpha, normalize anchors.
// Does not change application code or installed plugin resources.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const sharp=req('sharp');
const root=(REPO_ROOT + '/art/production-v6');
const specs=JSON.parse(fs.readFileSync(root+'/prompts.json','utf8'));
const states=['idle','ready','thinking','waiting','done','approval','executing','error','aborted','celebrate','speaking','portrait'];
const manifest={version:6,tool:'built-in image_gen',date:'2026-10-16',logicalAssetCount:152,formatCopies:['png','webp'],states:states.slice(0,11),characters:{},scene:{},notes:['Static pose assets; no frame-by-frame lip sync or skeletal layers.','Art generation and asset export only; not installed in application.','Native atlas 1448x1086; individual cell content about 300–380px, normalized to 512px transparent canvases.']};
for(const format of ['png','webp'])fs.mkdirSync(root+'/'+format,{recursive:true});

// Content-aware separators follow transparent gutters rather than cutting at fixed cell edges.
// Hair and shoe tips can cross the nominal grid; a low-alpha seam prevents neighbor bleed.
function separator(data,w,h,axis,nominal,radius=42){
 const length=axis==='y'?w:h, cross=axis==='y'?h:w;
 const start=Math.max(1,Math.round(nominal-radius)),end=Math.min(cross-2,Math.round(nominal+radius)),band=end-start+1;
 let prev=new Float64Array(band),cur=new Float64Array(band);
 const from=new Int16Array(length*band);
 for(let a=0;a<length;a++){
  for(let b=0;b<band;b++){
   const c=start+b,x=axis==='y'?a:c,y=axis==='y'?c:a;
   const alpha=data[(y*w+x)*4+3]/255;
   let cost=alpha*alpha*100+Math.abs(c-nominal)*.006,best=prev[b],at=b;
   if(a)for(let k=Math.max(0,b-2);k<=Math.min(band-1,b+2);k++){const value=prev[k]+Math.abs(k-b)*.05;if(value<best){best=value;at=k;}}
   cur[b]=cost+(a?best:0);from[a*band+b]=at;
  }
  [prev,cur]=[cur,prev];
 }
 let b=0;for(let k=1;k<band;k++)if(prev[k]<prev[b])b=k;
 const line=new Int32Array(length);
 for(let a=length-1;a>=0;a--){line[a]=start+b;b=from[a*band+b];}
 return line;
}
function retainLargeParts(raw,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),keep=new Uint8Array(w*h);
 for(let s=0;s<w*h;s++){
  if(seen[s]||raw[s*4+3]<35)continue;
  let head=0,tail=1;seen[s]=1;queue[0]=s;
  while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);
   for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(q>=0&&!seen[q]&&raw[q*4+3]>=35){seen[q]=1;queue[tail++]=q;}}
  if(tail>=32)for(let j=0;j<tail;j++)keep[queue[j]]=1;
 }
 const result=Buffer.from(raw);let minX=w,minY=h,maxX=0,maxY=0,count=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x;if(!raw[p*4+3])continue;
  let yes=keep[p];
  if(!yes&&raw[p*4+3]<35)for(let dy=-1;dy<=1&&!yes;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&keep[(y+dy)*w+x+dx]){yes=1;break;}
  if(!yes){result[p*4+3]=0;continue;}
  if(raw[p*4+3]>50){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;}
 }
 return {raw:result,bounds:{left:Math.max(0,minX-2),top:Math.max(0,minY-2),width:Math.min(w-1,maxX+2)-Math.max(0,minX-2)+1,height:Math.min(h-1,maxY+2)-Math.max(0,minY-2)+1},count};
}
async function saveBoth(pipeline,relative){
 for(const format of ['png','webp']){
  const dest=root+'/'+format+'/'+relative+'.'+format;fs.mkdirSync(path.dirname(dest),{recursive:true});
  await (format==='png'?pipeline.clone().png():pipeline.clone().webp({quality:94,alphaQuality:100})).toFile(dest);
 }
}
const stats=[];
for(const job of specs.characters){
 const source='sources/'+job.id+'-atlas.png';
 const {data,info}=await sharp(root+'/'+source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height;
 const xs=[separator(data,w,h,'x',w/4),separator(data,w,h,'x',w/2),separator(data,w,h,'x',w*3/4)];
 const ys=[separator(data,w,h,'y',h/3),separator(data,w,h,'y',h*2/3)];
 const tiles=[];
 for(let i=0;i<12;i++){
  const row=Math.floor(i/4),col=i%4,pixels=Buffer.alloc(data.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const c=x<xs[0][y]?0:x<xs[1][y]?1:x<xs[2][y]?2:3,r=y<ys[0][x]?0:y<ys[1][x]?1:2;
   if(c===col&&r===row){const at=(y*w+x)*4;data.copy(pixels,at,at,at+4);}
  }
  tiles.push(retainLargeParts(pixels,w,h));
 }
 const scale=Math.min(...tiles.slice(0,11).map(t=>Math.min(456/t.bounds.width,456/t.bounds.height)));
 const entries={};
 for(let i=0;i<12;i++){
  const tile=tiles[i],portrait=i===11,factor=portrait?Math.min(472/tile.bounds.width,472/tile.bounds.height):scale;
  const targetWidth=Math.round(tile.bounds.width*factor),targetHeight=Math.round(tile.bounds.height*factor);
  const left=Math.floor((512-targetWidth)/2),top=portrait?Math.floor((512-targetHeight)/2):484-targetHeight;
  const piece=await sharp(tile.raw,{raw:{width:w,height:h,channels:4}}).extract(tile.bounds).resize(targetWidth,targetHeight).png().toBuffer();
  const output=sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:piece,left,top}]);
  const name=portrait?'portraits/'+job.id:'characters/'+job.id+'/'+states[i];
  await saveBoth(output,name);
  entries[states[i]]={png:'png/'+name+'.png',webp:'webp/'+name+'.webp',width:512,height:512,anchor:portrait?[256,256]:[256,484],sourceBounds:tile.bounds,scale:factor};
 }
 manifest.characters[job.id]={name:job.id,identityReference:job.ref,source,assets:entries};
 stats.push({id:job.id,states:11,portrait:1,commonScale:scale,minVisiblePixels:Math.min(...tiles.map(t=>t.count))});
 console.log('Exported',job.id,'12 assets');
}
for(const id of ['room','wood-long','wood-short','chair','notebook','cup','folder','plant']){
 const source='sources/'+id+'.png',opaque=id==='room';
 let pipeline=sharp(root+'/'+source);
 if(!opaque)pipeline=pipeline.trim({background:'#00000000',threshold:10});
 if(opaque)pipeline=pipeline.resize({width:2172});
 else if(id.startsWith('wood-'))pipeline=pipeline.resize({width:2048});
 else pipeline=pipeline.resize(768,768,{fit:'contain',background:'#00000000'});
 const buf=await pipeline.png().toBuffer(),metadata=await sharp(buf).metadata();
 await saveBoth(sharp(buf),'scene/'+id);
 manifest.scene[id]={png:'png/scene/'+id+'.png',webp:'webp/scene/'+id+'.webp',source,width:metadata.width,height:metadata.height,transparent:!opaque};
}
const inventory=[];
for(const format of ['png','webp']){
 function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else {const buf=fs.readFileSync(p);inventory.push({file:path.relative(root,p).replaceAll('\\','/'),bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});}}}
 walk(root+'/'+format);
}
fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest,null,2));
fs.writeFileSync(root+'/export-report.json',JSON.stringify({logicalAssets:152,exportedFiles:inventory.length,characters:stats,files:inventory},null,2));
if(inventory.length!==304)throw new Error('Expected 152 PNG + 152 WebP files');
console.log('Complete: 152 logical assets, 304 format files.');
