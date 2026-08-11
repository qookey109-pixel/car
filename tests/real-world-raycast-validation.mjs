import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE='http://127.0.0.1:8011/experiments/real-world-raycast-v0.5/?fixture=1';
const OUT='artifacts/real-world-raycast-validation';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],report={desktop:{},mobileLandscape:{},consoleErrors:errors};

async function boot(context){
  const page=await context.newPage();
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  page.on('pageerror',err=>errors.push(String(err)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:45000});
  await page.waitForFunction(()=>window.__REAL_WORLD_RAYCAST__?.snapshot().ready===true,null,{timeout:15000});
  await page.waitForFunction(()=>window.__REAL_WORLD_RAYCAST__.snapshot().grounded>=3,null,{timeout:10000});
  return page;
}

const desktop=await browser.newContext({viewport:{width:1280,height:720}});
const page=await boot(desktop);
let s=await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.snapshot());
if(s.source!=='fixture')throw new Error(`expected fixture source, got ${s.source}`);
if(s.segments<10)throw new Error(`too few road segments: ${s.segments}`);
if(s.visualVersion!=='LowPolySportCoupeV5')throw new Error(`expected V5 car, got ${s.visualVersion}`);
if(s.wheels!==4||s.grounded<3)throw new Error(`Raycast wheels not grounded: ${s.grounded}/${s.wheels}`);
if(s.surface!=='road')throw new Error(`spawn must start on road, got ${s.surface}`);
report.desktop.boot=s;

await page.keyboard.down('KeyW');
const accelSamples=[];
let reached18=false;
for(let i=0;i<32;i++){
  await page.waitForTimeout(125);
  s=await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.snapshot());
  if(i%4===0)accelSamples.push(s);
  if(s.speedKmh>=18){reached18=true;break}
}
if(!reached18)throw new Error(`failed to reach 18 km/h: ${JSON.stringify({final:s,samples:accelSamples})}`);
if(s.surface!=='road')throw new Error(`acceleration left road unexpectedly: ${s.surface}`);
if(s.grounded<3)throw new Error(`lost wheel contact on OSM road: ${s.grounded}`);
report.desktop.acceleration={...s,samples:accelSamples};

await page.keyboard.down('KeyA');
await page.waitForTimeout(900);
const turned=await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.snapshot());
if(Math.abs(turned.position.x)<.12)throw new Error(`steering lateral movement too small: x=${turned.position.x}`);
report.desktop.steering=turned;

await page.keyboard.down('Space');
await page.waitForFunction(()=>window.__REAL_WORLD_RAYCAST__.snapshot().driftState==='DRIFT',null,{timeout:2000});
const drift=await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.snapshot());
if(drift.grounded<2)throw new Error(`drift unstable: grounded=${drift.grounded}`);
report.desktop.drift=drift;
await page.keyboard.up('Space');await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');

await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.teleport(150,150));
await page.waitForFunction(()=>window.__REAL_WORLD_RAYCAST__.snapshot().surface==='offroad',null,{timeout:1500});
const offroad=await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.snapshot());
report.desktop.offroad=offroad;
await page.evaluate(()=>window.__REAL_WORLD_RAYCAST__.spawn());
await page.waitForFunction(()=>window.__REAL_WORLD_RAYCAST__.snapshot().surface==='road',null,{timeout:1500});
await page.screenshot({path:`${OUT}/desktop.png`,fullPage:true});
await desktop.close();

const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const mp=await boot(mobile);
const gasBox=await mp.locator('[data-action="gas"]').boundingBox();
const leftBox=await mp.locator('[data-action="left"]').boundingBox();
if(!gasBox||!leftBox)throw new Error('mobile controls missing');
const cdp=await mobile.newCDPSession(mp);
const points=[
  {x:leftBox.x+leftBox.width/2,y:leftBox.y+leftBox.height/2,id:31,radiusX:8,radiusY:8,force:1},
  {x:gasBox.x+gasBox.width/2,y:gasBox.y+gasBox.height/2,id:32,radiusX:8,radiusY:8,force:1}
];
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
await mp.waitForTimeout(1000);
const active=await mp.evaluate(()=>({left:document.querySelector('[data-action="left"]').classList.contains('active'),gas:document.querySelector('[data-action="gas"]').classList.contains('active'),snap:window.__REAL_WORLD_RAYCAST__.snapshot()}));
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
if(!active.left||!active.gas)throw new Error('mobile GAS + LEFT multi-touch failed');
if(active.snap.speedKmh<=0||active.snap.grounded<2)throw new Error(`mobile Raycast unstable: ${JSON.stringify(active.snap)}`);
if(active.snap.segments<10)throw new Error('mobile road fixture missing');
report.mobileLandscape.multiTouch=active.snap;
await mp.screenshot({path:`${OUT}/mobile-landscape.png`,fullPage:true});
await mobile.close();

if(errors.length)throw new Error(`browser console errors: ${errors.join(' | ')}`);
await fs.writeFile(`${OUT}/report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
