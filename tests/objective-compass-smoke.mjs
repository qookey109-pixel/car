import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/objective-compass',{recursive:true});
const near=(v,target,tol)=>Math.abs(v-target)<=tol;

async function start(page){
  await page.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().navigation?.visible===true);
}

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];desktop.on('pageerror',e=>errors.push(e.message));desktop.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await start(desktop);

  const initial=await desktop.evaluate(()=>window.__NEON_RACER__.snapshot().navigation);
  if(initial.kind!=='sprint'||initial.label!=='CHECKPOINT 1/4'||!near(initial.distance,24,2)||Math.abs(initial.angle)>.12)throw new Error(`Initial compass contract failed: ${JSON.stringify(initial)}`);

  const second=await desktop.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,c=g.challenges,v=g.vehicle;
    v.reset({x:0,y:1.2,z:0},0);c.update(1/60,v);api.compass.update();return api.compass.snapshot();
  });
  if(second.kind!=='sprint'||second.label!=='CHECKPOINT 2/4'||!near(second.distance,120,2)||!near(second.angle,Math.PI/2,.12))throw new Error(`Checkpoint bearing contract failed: ${JSON.stringify(second)}`);

  const stages=await desktop.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,c=g.challenges,v=g.vehicle;
    for(const [x,z] of c.current.points.slice(c.sprintIndex)){v.chassisBody.position.set(x,1.2,z);c.update(1/60,v)}
    api.compass.update();const drift=api.compass.snapshot();
    c.challengeIndex=2;c._refreshMarkers();api.compass.update();const speed=api.compass.snapshot();
    return{drift,speed};
  });
  if(stages.drift.kind!=='drift'||stages.drift.label!=='DRIFT ZONE'||!(stages.drift.distance>0))throw new Error(`Drift navigation contract failed: ${JSON.stringify(stages.drift)}`);
  if(stages.speed.kind!=='speed'||stages.speed.label!=='SPEED GATE'||!(stages.speed.distance>0))throw new Error(`Speed navigation contract failed: ${JSON.stringify(stages.speed)}`);

  const desktopBox=await desktop.locator('#objectiveCompass').boundingBox();
  if(!desktopBox||desktopBox.width<110||desktopBox.width>230||desktopBox.y>90)throw new Error(`Desktop compass layout failed: ${JSON.stringify(desktopBox)}`);
  await desktop.screenshot({path:'test-results/objective-compass/desktop.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  await desktop.close();

  const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));mobile.on('console',m=>{if(m.type()==='error')mobileErrors.push(m.text())});
  await start(mobile);
  const layout=await mobile.evaluate(()=>{
    const rect=id=>{const r=document.querySelector(id)?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null};
    const overlaps=(a,b)=>Boolean(a&&b&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y);
    const compass=rect('#objectiveCompass'),left=rect('.hud-top-left'),right=rect('.speed-panel');
    return{compass,left,right,overlapLeft:overlaps(compass,left),overlapRight:overlaps(compass,right),nav:window.__NEON_RACER__.snapshot().navigation};
  });
  if(!layout.compass||layout.overlapLeft||layout.overlapRight||layout.nav.kind!=='sprint')throw new Error(`Mobile compass layout failed: ${JSON.stringify(layout)}`);
  await mobile.screenshot({path:'test-results/objective-compass/mobile-844x390.png',animations:'disabled'});
  if(mobileErrors.length)throw new Error(mobileErrors.join('\n'));
  await mobile.close();

  fs.writeFileSync('test-results/objective-compass/contract.json',JSON.stringify({initial,second,stages,layout},null,2));
  console.log('Objective Compass PASS · desktop + 844x390 · sprint/drift/speed');
}finally{await browser.close()}
