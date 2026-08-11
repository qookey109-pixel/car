import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE='http://127.0.0.1:8011/experiments/real-world-road-v0.4-arcade-ai-tuned/?test=1';
const OUT='artifacts/arcade-validation';
await fs.mkdir(OUT,{recursive:true});

function fixture(){
  const lat0=25.033964,lon0=121.564468,meters=70,latStep=meters/111320,lonStep=meters/(111320*Math.cos(lat0*Math.PI/180));
  const elements=[];let nodeId=1,wayId=1000;const ids=[];
  for(let z=-2;z<=2;z++){
    const row=[];
    for(let x=-2;x<=2;x++){
      const tags={};
      if(x===0&&z===0)tags.highway='traffic_signals';
      if(x===1&&z===0)tags.highway='stop';
      if(x===-1&&z===0)tags.highway='give_way';
      const id=nodeId++;row.push(id);elements.push({type:'node',id,lat:lat0-z*latStep,lon:lon0+x*lonStep,tags});
    }
    ids.push(row);
  }
  for(let z=0;z<5;z++)elements.push({type:'way',id:wayId++,nodes:ids[z],tags:{highway:'residential',lanes:'8',maxspeed:z%2?'50':'60',oneway:z===1?'yes':'no'}});
  for(let x=0;x<5;x++)elements.push({type:'way',id:wayId++,nodes:ids.map(r=>r[x]),tags:{highway:'residential',lanes:'8',maxspeed:x%2?'40':'50',oneway:x===3?'yes':'no'}});
  return {elements};
}

const browser=await chromium.launch({headless:true});
const consoleErrors=[];
const report={desktop:{},mobileLandscape:{},consoleErrors};

async function boot(context){
  await context.addInitScript(data=>{window.__ARCADE_TEST_OSM__=data},fixture());
  const page=await context.newPage();
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
  page.on('pageerror',err=>consoleErrors.push(String(err)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:45000});
  await page.waitForFunction(()=>window.__ARCADE_LAB__?.snapshot().ready===true,{timeout:15000});
  return page;
}

const desktop=await browser.newContext({viewport:{width:1280,height:720}});
const page=await boot(desktop);
let snap=await page.evaluate(()=>window.__ARCADE_LAB__.snapshot());
if(snap.aiCount!==12)throw new Error(`desktop AI expected 12, got ${snap.aiCount}`);
if(snap.ruleSigns<6)throw new Error(`expected visual rule signs, got ${snap.ruleSigns}`);
report.desktop.boot=snap;

await page.keyboard.down('KeyW');
await page.waitForTimeout(1200);
snap=await page.evaluate(()=>window.__ARCADE_LAB__.snapshot());
if(snap.speedKmh<20)throw new Error(`acceleration too weak: ${snap.speedKmh} km/h`);
report.desktop.acceleration=snap;

await page.keyboard.down('KeyA');
await page.keyboard.down('Space');
await page.waitForTimeout(650);
snap=await page.evaluate(()=>window.__ARCADE_LAB__.snapshot());
if(snap.driftState!=='drift')throw new Error(`drift did not engage: ${snap.driftState}`);
if(snap.driftCharge<=0)throw new Error('drift charge did not increase');
report.desktop.drift=snap;
await page.waitForTimeout(950);
const charged=await page.evaluate(()=>window.__ARCADE_LAB__.snapshot());
if(charged.driftCharge<0.03&&charged.nitroTokens<1)throw new Error(`drift charge too slow: ${charged.driftCharge}`);
report.desktop.charge=charged;
await page.keyboard.up('Space');await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');

await page.evaluate(()=>window.__ARCADE_LAB__.awardNitroForTest());
const beforeNitro=await page.evaluate(()=>window.__ARCADE_LAB__.snapshot());
await page.keyboard.down('ShiftLeft');await page.waitForTimeout(120);const nitro=await page.evaluate(()=>window.__ARCADE_LAB__.snapshot());await page.keyboard.up('ShiftLeft');
if(!nitro.nitroActive)throw new Error('nitro did not activate');
if(nitro.nitroTokens>=beforeNitro.nitroTokens)throw new Error('nitro token was not consumed');
report.desktop.nitro=nitro;
await page.screenshot({path:`${OUT}/desktop.png`,fullPage:true});
await desktop.close();

const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const mobilePage=await boot(mobile);
snap=await mobilePage.evaluate(()=>window.__ARCADE_LAB__.snapshot());
if(snap.aiCount!==12)throw new Error(`844x390 stress test expected 12 AI, got ${snap.aiCount}`);
const gasBox=await mobilePage.locator('[data-action="gas"]').boundingBox();
const leftBox=await mobilePage.locator('[data-action="left"]').boundingBox();
if(!gasBox||!leftBox)throw new Error('mobile controls are not visible');
const cdp=await mobile.newCDPSession(mobilePage);
const points=[
  {x:leftBox.x+leftBox.width/2,y:leftBox.y+leftBox.height/2,id:11,radiusX:8,radiusY:8,force:1},
  {x:gasBox.x+gasBox.width/2,y:gasBox.y+gasBox.height/2,id:12,radiusX:8,radiusY:8,force:1}
];
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
await mobilePage.waitForTimeout(650);
const active=await mobilePage.evaluate(()=>({gas:document.querySelector('[data-action="gas"]').classList.contains('active'),left:document.querySelector('[data-action="left"]').classList.contains('active'),snap:window.__ARCADE_LAB__.snapshot()}));
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
if(!active.gas||!active.left)throw new Error('real mobile multi-touch controls did not stay active together');
if(active.snap.speedKmh<=0)throw new Error('mobile gas did not move vehicle');
report.mobileLandscape.multiTouch=active.snap;
await mobilePage.screenshot({path:`${OUT}/mobile-landscape.png`,fullPage:true});
await mobile.close();

if(consoleErrors.length)throw new Error(`browser console errors: ${consoleErrors.join(' | ')}`);
await fs.writeFile(`${OUT}/report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
