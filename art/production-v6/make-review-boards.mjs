import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const sharp=req('sharp');
const root=(REPO_ROOT + '/art/production-v6');
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const ids=Object.keys(manifest.characters);
const names={chatgpt:'ChatGPT',claude:'Claude',gemini:'Gemini',grok:'Grok',deepseek:'DeepSeek',glm:'GLM',minimax:'MiniMax',kimi:'Kimi',step:'Step',mimo:'MiMo',qwen:'千问 Qwen',doubao:'豆包 Doubao'};
const labels=['待命','准备','思考','等待','已发言','待批准','执行','出错','已停止','完成庆祝','发言中','头像'];
fs.mkdirSync(root+'/review',{recursive:true});
const svg=(w,h,texts)=>Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Microsoft YaHei,Arial,sans-serif;fill:#504765}</style>${texts}</svg>`);
const text=(x,y,t,size=22)=>`<text x="${x}" y="${y}" font-size="${size}">${t}</text>`;
const img=async(file,w,h)=>sharp(root+'/'+file).resize(w,h,{fit:'contain',background:'#00000000'}).png().toBuffer();

// All 144 person assets, with clear row/column labels.
{
 const w=2400,h=2410,overlays=[],cw=182,ch=184,ox=180,oy=170;
 let titles=text(36,55,'十二模型 · 全状态素材总览',36)+text(36,100,'132 张状态图 + 12 张头像 · 此图仅用于审阅，独立透明素材见 png/ 与 webp/',22);
 labels.forEach((v,i)=>titles+=text(ox+i*cw+20,145,v,20));
 for(let row=0;row<12;row++){
  titles+=text(24,oy+row*ch+90,names[ids[row]],20);
  const entries=manifest.characters[ids[row]].assets;
  for(let col=0;col<12;col++){
   const key=col===11?'portrait':manifest.states[col];
   overlays.push({input:await img(entries[key].png,174,174),left:ox+col*cw,top:oy+row*ch});
  }
 }
 overlays.push({input:svg(w,h,titles),left:0,top:0});
 await sharp({create:{width:w,height:h,channels:4,background:'#faf7ff'}}).composite(overlays).png().toFile(root+'/review/all-states.png');
}
// A compact catalog of each model and every scene object.
{
 const w=1800,h=1850,overlays=[],cw=300;
 let titles=text(42,58,'AI 研讨室 · 完整美术资源',38)+text(42,100,'12 位模型 / 11 种状态 / 独立头像 / 8 件场景素材',23);
 for(let i=0;i<12;i++){
  const x=(i%6)*cw,y=140+Math.floor(i/6)*350;
  overlays.push({input:await img(manifest.characters[ids[i]].assets.idle.png,286,286),left:x+7,top:y});
  titles+=text(x+50,y+320,names[ids[i]],24);
 }
 overlays.push({input:await sharp(root+'/png/scene/room.png').resize(1720,573).png().toBuffer(),left:40,top:875});
 titles+=text(50,860,'独立房间背景',23);
 const objects=['wood-short','wood-long','chair','notebook','cup','folder','plant'];
 const objNames=['短桌','长桌','通用椅子','笔记本','水杯','文件夹','绿植'];
 for(let i=0;i<objects.length;i++){
  const x=16+i*254;
  overlays.push({input:await img(manifest.scene[objects[i]].png,240,260),left:x,top:1490});
  titles+=text(x+70,1790,objNames[i],23);
 }
 overlays.push({input:svg(w,h,titles),left:0,top:0});
 await sharp({create:{width:w,height:h,channels:4,background:'#faf7ff'}}).composite(overlays).png().toFile(root+'/review/overview.png');
}
// Actual isolated assets composed together. No application code or installed files touched.
const arrangements={
 3:['claude','chatgpt','deepseek'],
 6:['claude','gemini','chatgpt','deepseek','glm','grok'],
 12:['step','mimo','qwen','claude','gemini','chatgpt','deepseek','glm','kimi','grok','minimax','doubao']
};
for(const count of [3,6,12]){
 const w=1920,h=800,overlays=[];
 overlays.push({input:await sharp(root+'/png/scene/room.png').resize(w,h,{fit:'cover',position:'centre'}).png().toBuffer(),left:0,top:0});
 const charSize=count===3?340:count===6?300:248,stride=count===3?350:count===6?248:150;
 const tableWidth=count===3?1280:count===6?1680:1900,tableTop=count===3?435:420;
 const spriteTop=Math.round(tableTop-charSize*.71);
 for(let i=0;i<count;i++){
  const cx=w/2+(i-(count-1)/2)*stride;
  overlays.push({input:await img(manifest.scene.chair.png,Math.round(charSize*.62),Math.round(charSize*.82)),left:Math.round(cx-charSize*.31),top:spriteTop+Math.round(charSize*.36)});
 }
 for(let i=0;i<count;i++){
  const id=arrangements[count][i],state=id==='claude'?'speaking':id==='chatgpt'?'approval':'idle';
  const cx=w/2+(i-(count-1)/2)*stride;
  overlays.push({input:await img(manifest.characters[id].assets[state].png,charSize,charSize),left:Math.round(cx-charSize/2),top:spriteTop});
 }
 const table=await sharp(root+'/png/scene/'+(count<=6?'wood-short':'wood-long')+'.png').resize({width:tableWidth}).png().toBuffer();
 const tableInfo=await sharp(table).metadata();
 if(tableTop+tableInfo.height>h){
  overlays.push({input:await sharp(table).extract({left:0,top:0,width:tableWidth,height:h-tableTop}).png().toBuffer(),left:Math.floor((w-tableWidth)/2),top:tableTop});
 }else overlays.push({input:table,left:Math.floor((w-tableWidth)/2),top:tableTop});
 for(const [id,x,y,size] of [['notebook',w/2-250,tableTop+25,125],['cup',w/2+225,tableTop+10,78],['folder',w/2+40,tableTop+28,115],['plant',(w-tableWidth)/2+50,tableTop-5,110]]){
  overlays.push({input:await img(manifest.scene[id].png,size,size),left:Math.round(x),top:Math.round(y)});
 }
 const heading=text(35,50,`${count} 人 · 独立素材拼合预览`,28)+text(35,84,'用于检查人物、桌子与房间的画风和遮挡；不是当前应用截图',19);
 overlays.push({input:svg(w,h,heading),left:0,top:0});
 await sharp({create:{width:w,height:h,channels:4,background:'#f4ebe4'}}).composite(overlays).png().toFile(root+'/review/scene-'+count+'.png');
}
console.log('Review boards saved.');
