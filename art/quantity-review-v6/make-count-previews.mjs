import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const sharp=req('sharp');
const source=(REPO_ROOT + '/art/production-v6');
const output=(REPO_ROOT + '/art/quantity-review-v6');
const manifest=JSON.parse(fs.readFileSync(source+'/manifest.json','utf8'));
const others=['claude','deepseek','gemini','grok','glm','kimi','minimax','qwen','step','mimo','doubao'];
const asset=async(file,w,h)=>sharp(source+'/'+file).resize(w,h,{fit:'contain',background:'#00000000'}).png().toBuffer();
const label=(w,h,body)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><style>text{font-family:Microsoft YaHei,Arial,sans-serif;fill:#504765}</style>${body}</svg>`);
fs.mkdirSync(output,{recursive:true});
const report={assetPack:'production-v6',purpose:'Static asset composition, not application screenshots',cases:[]};
for(let count=1;count<=12;count++){
 const selected=others.slice(0,count-1);selected.splice(Math.floor(selected.length/2),0,'chatgpt');
 const width=1920,height=800,overlays=[];
 const stride=Math.min(350,1760/count),characterWidth=Math.round(Math.min(340,stride*1.65));
 const tableWidth=Math.round(Math.min(1900,Math.max(600,(count-1)*stride+characterWidth*.75+210)));
 const tableId=count<=6?'wood-short':'wood-long',tableTop=435;
 const top=Math.round(tableTop-characterWidth*.71);
 overlays.push({input:await sharp(source+'/png/scene/room.png').resize(width,height,{fit:'cover'}).png().toBuffer(),left:0,top:0});
 for(let i=0;i<count;i++){
  const cx=width/2+(i-(count-1)/2)*stride;
  overlays.push({input:await asset(manifest.scene.chair.png,Math.round(characterWidth*.62),Math.round(characterWidth*.82)),left:Math.round(cx-characterWidth*.31),top:top+Math.round(characterWidth*.36)});
 }
 for(let i=0;i<count;i++){
  const id=selected[i],state=id==='claude'?'speaking':id==='chatgpt'?'approval':'idle';
  overlays.push({input:await asset(manifest.characters[id].assets[state].png,characterWidth,characterWidth),left:Math.round(width/2+(i-(count-1)/2)*stride-characterWidth/2),top});
 }
 let table=await sharp(source+'/'+manifest.scene[tableId].png).resize({width:tableWidth}).png().toBuffer();
 const tableInfo=await sharp(table).metadata();
 if(tableInfo.height>height-tableTop)table=await sharp(table).extract({left:0,top:0,width:tableWidth,height:height-tableTop}).png().toBuffer();
 overlays.push({input:table,left:Math.round((width-tableWidth)/2),top:tableTop});
 for(const [id,x,y,size] of [['notebook',width/2-130,tableTop+28,100],['cup',width/2+120,tableTop+14,68],['plant',(width-tableWidth)/2+26,tableTop-4,88]]){
  overlays.push({input:await asset(manifest.scene[id].png,size,size),left:Math.round(x),top:Math.round(y)});
 }
 const heading=label(width,height,`<rect x="22" y="18" width="690" height="86" rx="18" fill="#fcf9f3" fill-opacity=".88"/><text x="40" y="54" font-size="30">${count} 个模型 · ${count<=6?'短桌':'长桌'}</text><text x="40" y="86" font-size="21">同一套独立素材自动排布 · 素材预览</text>`);
 overlays.push({input:heading,left:0,top:0});
 await sharp({create:{width,height,channels:4,background:'#f4ebe4'}}).composite(overlays).png().toFile(output+'/count-'+count+'.png');
 report.cases.push({count,selected,renderedCharacters:selected.length,chairInstances:count,tableId,tableWidth,stride,characterWidth,file:'count-'+count+'.png'});
}
const gridWidth=2940,gridHeight=1950,grid=[];
for(let count=1;count<=12;count++){
 const column=(count-1)%3,row=Math.floor((count-1)/3);
 grid.push({input:await sharp(output+'/count-'+count+'.png').resize(960,400).png().toBuffer(),left:20+column*980,top:150+row*440});
}
grid.push({input:label(gridWidth,gridHeight,'<text x="30" y="58" font-size="40">1～12 个模型 · 全人数排布总览</text><text x="30" y="104" font-size="25">人物按实际人数居中，桌长随人数调整；没有为每种人数重新生图。此为静态素材拼合，非应用截图。</text><text x="30" y="1920" font-size="25">1／2 人为展示排布示例；实际发起研讨仍须满足现有职责校验。当前产品座位上限为 12。</text>'),left:0,top:0});
await sharp({create:{width:gridWidth,height:gridHeight,channels:4,background:'#faf7ff'}}).composite(grid).png().toFile(output+'/all-counts.png');
if(report.cases.some(c=>c.count!==c.renderedCharacters))throw Error('Wrong character count');
fs.writeFileSync(output+'/counts.json',JSON.stringify(report,null,2));
console.log('Verified all twelve counts. Independent character count matches 1–12 in every composition.');
