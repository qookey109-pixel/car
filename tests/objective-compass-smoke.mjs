import {testBrowser as chromium} from './browser-engine.mjs';
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
  if(initial.kind!=='sprint'||initial.label!=='CHECKPOINT 1/4'||!near(initial.distance,24,2)||Math.abs(initial.angle)>.12||initial.maneuver!=='right'||initial.maneuverPhase!=='commit'||initial.maneuverLabel!=='通過後右轉')throw new Error(`Initial compass/turn intensity contract failed: ${JSON.stringify(initial)}`);

  const phases=await desktop.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,c=g.challenges,v=g.vehicle,root=document.querySelector('#objectiveCompass'),copy=document.querySelector('.objective-compass-distance');
    root.style.transition='none';copy.style.transition='none';
    const sample=()=>({...api.compass.snapshot(),copy:copy?.textContent||'',border:getComputedStyle(root).borderColor,textColor:getComputedStyle(copy).color});
    v.reset({x:0,y:1.2,z:0},0);c.update(1/60,v);api.compass.update();const far=sample();
    v.reset({x:60,y:1.2,z:0},0);api.compass.update();const prepare=sample();
    v.reset({x:94,y:1.2,z:0},0);api.compass.update();const commit=sample();
    return{far,prepare,commit};
  });
  if(phases.far.kind!=='sprint'||phases.far.label!=='CHECKPOINT 2/4'||!near(phases.far.distance,120,2)||!near(phases.far.angle,Math.PI/2,.12)||phases.far.maneuver!=='left'||phases.far.maneuverPhase!=='far'||phases.far.maneuverLabel!=='抵達後左轉'||!phases.far.copy.includes('抵達後左轉'))throw new Error(`Far turn preview failed: ${JSON.stringify(phases.far)}`);
  if(!near(phases.prepare.distance,60,2)||phases.prepare.maneuver!=='left'||phases.prepare.maneuverPhase!=='prepare'||phases.prepare.maneuverLabel!=='準備左轉'||!phases.prepare.copy.includes('準備左轉'))throw new Error(`Prepare turn preview failed: ${JSON.stringify(phases.prepare)}`);
  if(!near(phases.commit.distance,26,2)||phases.commit.maneuver!=='left'||phases.commit.maneuverPhase!=='commit'||phases.commit.maneuverLabel!=='通過後左轉'||!phases.commit.copy.includes('通過後左轉'))throw new Error(`Commit turn preview failed: ${JSON.stringify(phases.commit)}`);
  if(phases.far.border===phases.prepare.border||phases.prepare.border===phases.commit.border||phases.prepare.textColor===phases.commit.textColor)throw new Error(`Turn intensity styling did not step up: ${JSON.stringify(phases)}`);
  await desktop.screenshot({path:'test-results/objective-compass/turn-intensity-desktop.png',animations:'disabled'});

  const routeTurns=await desktop.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,c=g.challenges,v=g.vehicle,out=[];
    for(let route=0;route<c.routes.length;route++){
      c._applyRoute(route);c.challengeIndex=0;c.sprintIndex=0;c._refreshMarkers();
      v.reset({x:0,y:1.2,z:24},0);api.compass.update();
      const sequence=[api.compass.snapshot().maneuver];
      for(let i=1;i<c.current.points.length;i++){
        c.sprintIndex=i;c._refreshMarkers();api.compass.update();sequence.push(api.compass.snapshot().maneuver);
      }
      out.push({route,name:c.routeName,sequence});
    }
    c._applyRoute(0);c.challengeIndex=0;c.sprintIndex=1;c._refreshMarkers();v.reset({x:0,y:1.2,z:0},0);api.compass.update();
    return out;
  });
  const expected=[['right','left','left','finish'],['left','left','left','finish'],['straight','left','left','finish']];
  routeTurns.forEach((r,i)=>{if(JSON.stringify(r.sequence)!==JSON.stringify(expected[i]))throw new Error(`Route ${i} turn sequence failed: ${JSON.stringify(r)}`)});

  const stages=await desktop.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,c=g.challenges,v=g.vehicle;
    for(const [x,z] of c.current.points.slice(c.sprintIndex)){v.chassisBody.position.set(x,1.2,z);c.update(1/60,v)}
    api.compass.update();const drift=api.compass.snapshot();
    c.challengeIndex=2;c._refreshMarkers();api.compass.update();const speed=api.compass.snapshot();
    return{drift,speed};
  });
  if(stages.drift.kind!=='drift'||stages.drift.label!=='DRIFT ZONE'||stages.drift.maneuver!==null||stages.drift.maneuverPhase!==null||!(stages.drift.distance>0))throw new Error(`Drift navigation contract failed: ${JSON.stringify(stages.drift)}`);
  if(stages.speed.kind!=='speed'||stages.speed.label!=='SPEED GATE'||stages.speed.maneuver!==null||stages.speed.maneuverPhase!==null||!(stages.speed.distance>0))throw new Error(`Speed navigation contract failed: ${JSON.stringify(stages.speed)}`);

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
    const copy=document.querySelector('.objective-compass-distance'),root=document.querySelector('#objectiveCompass');
    return{compass,left,right,overlapLeft:overlaps(compass,left),overlapRight:overlaps(compass,right),copy:copy?.textContent||'',copyOverflow:Boolean(copy&&copy.scrollWidth>copy.clientWidth+1),phase:root?.dataset.maneuverPhase||null,nav:window.__NEON_RACER__.snapshot().navigation};
  });
  if(!layout.compass||layout.compass.width>220||layout.overlapLeft||layout.overlapRight||layout.copyOverflow||!layout.copy.includes('通過後右轉')||layout.phase!=='commit'||layout.nav.kind!=='sprint'||layout.nav.maneuver!=='right'||layout.nav.maneuverPhase!=='commit')throw new Error(`Mobile turn-intensity layout failed: ${JSON.stringify(layout)}`);
  await mobile.screenshot({path:'test-results/objective-compass/mobile-844x390.png',animations:'disabled'});
  if(mobileErrors.length)throw new Error(mobileErrors.join('\n'));
  await mobile.close();

  fs.writeFileSync('test-results/objective-compass/contract.json',JSON.stringify({initial,phases,routeTurns,stages,layout},null,2));
  console.log('Objective Compass PASS · turn intensity far/prepare/commit · right/left/straight/finish · desktop + 844x390 · sprint/drift/speed');
}finally{await browser.close()}
