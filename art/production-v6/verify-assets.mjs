import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const sharp=req('sharp'),root=(REPO_ROOT + '/art/production-v6');
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const assets=[];
for(const [id,character] of Object.entries(manifest.characters)){
 if(Object.keys(character.assets).length!==12)throw Error(id+' must contain 11 states + portrait');
 for(const [state,asset] of Object.entries(character.assets))assets.push({id:id+'/'+state,...asset,transparent:true});
}
for(const [id,asset] of Object.entries(manifest.scene))assets.push({id,...asset});
if(assets.length!==152)throw Error('Asset count mismatch');
const report={date:'2026-10-16',logicalAssetCount:assets.length,sourceImageCount:fs.readdirSync(root+'/sources').filter(f=>f.endsWith('.png')).length,formats:{png:0,webp:0},transparentAssets:0,opaqueAssets:0,issues:[],assets:[]};
const hashes=new Set();
for(const asset of assets){
 const row={id:asset.id,files:[]};
 for(const format of ['png','webp']){
  const file=root+'/'+asset[format];
  if(!fs.existsSync(file))throw Error('Missing '+file);
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==asset.width||info.height!==asset.height)throw Error('Wrong dimensions '+file);
  let min=255,max=0,transparent=0,visible=0;
  for(let i=3;i<data.length;i+=4){min=Math.min(min,data[i]);max=Math.max(max,data[i]);if(data[i]===0)transparent++;if(data[i]>128)visible++;}
  if(asset.transparent&&!(min===0&&max===255&&transparent>100&&visible>1000))throw Error('Invalid alpha '+file);
  if(!asset.transparent&&min!==255)throw Error('Room background must be opaque');
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(format==='png'){if(hashes.has(hash))throw Error('Duplicated asset '+file);hashes.add(hash);}
  row.files.push({file:asset[format],width:info.width,height:info.height,minAlpha:min,maxAlpha:max,transparentPixels:transparent,visiblePixels:visible,sha256:hash});
  report.formats[format]++;
 }
 asset.transparent?report.transparentAssets++:report.opaqueAssets++;
 report.assets.push(row);
}
report.passed=report.issues.length===0&&report.formats.png===152&&report.formats.webp===152&&report.sourceImageCount===20;
fs.writeFileSync(root+'/validation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,logicalAssets:report.logicalAssetCount,sources:report.sourceImageCount,formats:report.formats,transparent:report.transparentAssets,opaque:report.opaqueAssets}));
if(!report.passed)process.exitCode=1;
