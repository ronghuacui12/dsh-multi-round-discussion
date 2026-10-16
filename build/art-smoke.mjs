import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {handleSettingsRoutes} from '../plugin/lib/host/settings-routes.js';
const req=createRequire(import.meta.url); const sharp=req('sharp');
const models=['chatgpt','claude','gemini','grok','deepseek','glm','minimax','kimi','step','mimo','qwen','doubao'];
const ids=[...models,...models.map(id=>'seated-'+id),'longtable','room','wood-short','wood-long'];
let checks=0,bytes=0;
for(const id of ids){let status,headers,body;const res={writeHead:(s,h)=>{status=s;headers=h;},end:b=>body=b};
 assert.equal(await handleSettingsRoutes({},res,'/art/'+id+'.webp','GET',{}),true);assert.equal(status,200);assert.equal(headers['content-type'],'image/webp');
 const meta=await sharp(body).metadata();
 if(id!=='room'){assert.equal(meta.hasAlpha,true);assert.equal((await sharp(body).stats()).channels.at(-1).min,0);}
 if(models.includes(id)){assert.equal(meta.width,320);assert.equal(meta.height,360);}
 if(id.startsWith('seated-')){assert.equal(meta.width,400);assert.equal(meta.height,400);}
 assert.ok((await sharp(body).stats()).channels.at(-1).max>0);bytes+=body.length;checks++;}
for(const path of ['/art/../roster.json','/art/%2e%2e/client.js','/art/unknown.webp','/art/chatgpt.webp/extra']){assert.equal(await handleSettingsRoutes({}, {},path,'GET',{}),false);checks++;}
assert.equal(await handleSettingsRoutes({}, {},'/art/chatgpt.webp','POST',{}),false);checks++;
console.log('PASS '+checks+' art/route checks; '+ids.length+' runtime assets; '+bytes+' bytes');
