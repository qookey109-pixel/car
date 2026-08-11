import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE='http://127.0.0.1:8011/experiments/raycast-vehicle-cannon-v0.1/';
const OUT='artifacts/raycast-vehicle-validation';
await fs.mkdir(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const consoleErrors=[];
const report={desktop:{},mobileLandscape:{},consoleErrors};

async function boot(context){
  const page=await context.newPage();
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
  page.on('pageerror',err=>consoleErrors.push(String(err)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:45000});
  await page.waitForFunction(()=>window.__RAYCAST_LAB__?.snapshot().ready===true,{timeout:15000});
  await page.waitForFunction(()=>window.__RAYCAST_LAB__.snapshot().grounded>=3,{timeout:8000});
  return page;
}

const desktop=await browser.newContext({viewport:{width:1280,height:720}});
const page=await boot(desktop);
let snap=await page.evaluate(()=>window.__RAYCAST_LAB__.snapshot());
if(snap.wheels!==4)throw new Error(`expected 4 raycast wheels, got ${snap.wheels}`);
if(snap.grounded<3)throw new Error(`vehicle did not settle on wheels: ${snap.grounded}/4`);
if(snap.chassisY<0.5||snap.chassisY>2.2)throw new Error(`unexpected chassis ride height: ${snap.chassisY}`);
report.desktop.settled=snap;

const startZ=snap.position.z;
await page.keyboard.down('KeyW');
await page.waitForTimeout(1800);
snap=await page.evaluate(()=>window.__RAYCAST_LAB__.snapshot());
if(snap.speedKmh<12)throw new Error(`raycast acceleration too weak: ${snap.speedKmh} km/h`);
if(Math.abs(snap.position.z-startZ)<1)throw new Error(`chassis did not translate enough: startZ=${startZ}, z=${snap.position.z}`);
if(snap.grounded<2)throw new Error(`too few wheels grounded while accelerating: ${snap.grounded}`);
report.desktop.acceleration=snap;

await page.keyboard.down('KeyA');
await page.waitForTimeout(900);
const turned=await page.evaluate(()=>window.__RAYCAST_LAB__.snapshot());
if(Math.abs(turned.position.x)<0.12)throw new Error(`steering produced too little lateral movement: x=${turned.position.x}`);
report.desktop.steering=turned;

await page.keyboard.down('Space');
await page.waitForTimeout(900);
const drift=await page.evaluate(()=>window.__RAYCAST_LAB__.snapshot());
if(drift.driftState!=='DRIFT')throw new Error(`drift mode did not engage: ${drift.driftState}`);
if(drift.slipDeg<1)throw new Error(`raycast drift produced too little slip: ${drift.slipDeg}°`);
if(drift.grounded<2)throw new Error(`vehicle became unstable during drift: grounded=${drift.grounded}`);
report.desktop.drift=drift;
await page.keyboard.up('Space');await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');
await page.screenshot({path:`${OUT}/desktop.png`,fullPage:true});
await desktop.close();

const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const mobilePage=await boot(mobile);
const gasBox=await mobilePage.locator('[data-action="gas"]').boundingBox();
const leftBox=await mobilePage.locator('[data-action="left"]').boundingBox();
if(!gasBox||!leftBox)throw new Error('mobile raycast controls are not visible');
const cdp=await mobile.newCDPSession(mobilePage);
const points=[
  {x:leftBox.x+leftBox.width/2,y:leftBox.y+leftBox.height/2,id:21,radiusX:8,radiusY:8,force:1},
  {x:gasBox.x+gasBox.width/2,y:gasBox.y+gasBox.height/2,id:22,radiusX:8,radiusY:8,force:1}
];
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
await mobilePage.waitForTimeout(900);
const active=await mobilePage.evaluate(()=>({
  gas:document.querySelector('[data-action="gas"]').classList.contains('active'),
  left:document.querySelector('[data-action="left"]').classList.contains('active'),
  snap:window.__RAYCAST_LAB__.snapshot()
}));
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
if(!active.gas||!active.left)throw new Error('mobile multi-touch did not keep GAS + LEFT active');
if(active.snap.speedKmh<=0)throw new Error('mobile GAS did not move RaycastVehicle');
if(active.snap.grounded<2)throw new Error(`mobile vehicle unstable: grounded=${active.snap.grounded}`);
report.mobileLandscape.multiTouch=active.snap;
await mobilePage.screenshot({path:`${OUT}/mobile-landscape.png`,fullPage:true});
await mobile.close();

if(consoleErrors.length)throw new Error(`browser console errors: ${consoleErrors.join(' | ')}`);
await fs.writeFile(`${OUT}/report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
