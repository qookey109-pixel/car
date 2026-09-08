import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('test-results',{recursive:true});
const shot=(page,path)=>page.screenshot({path,fullPage:false,animations:'disabled',caret:'hide'});

async function runDesktop(browser){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  const gl=await page.evaluate(()=>{const c=document.querySelector('canvas');return Boolean(c&&(c.getContext('webgl2')||c.getContext('webgl')))});
  if(!gl)throw new Error('WebGL context unavailable');
  await shot(page,'test-results/menu-desktop.png');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(120);
  const inputWired=await page.evaluate(()=>window.__NEON_RACER__.game.input.keys.has('KeyW'));
  await page.keyboard.up('KeyW');
  if(!inputWired)throw new Error('Keyboard W input did not reach Input system');

  const driving=await page.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,v=g.vehicle;
    g.state='paused';
    v.reset({x:0,y:1.2,z:24},0);
    const start={x:v.position.x,y:v.position.y,z:v.position.z};
    v.setInput({throttle:1,steer:0,handbrake:false,nitro:false});
    for(let i=0;i<180;i++){v.update(g.fixedDt);g.physics.step(g.fixedDt)}
    v._syncVisuals();
    v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
    for(let i=0;i<8;i++)g._camera(1/60);
    const s=api.snapshot(),body=v.chassisBody;
    const wheels=v.vehicle.wheelInfos.map((w,i)=>({i,isInContact:Boolean(w.isInContact),suspensionLength:w.suspensionLength,engineForce:w.engineForce,brake:w.brake,frictionSlip:w.frictionSlip}));
    return {
      s,start,end:{x:body.position.x,y:body.position.y,z:body.position.z},
      velocity:{x:body.velocity.x,y:body.velocity.y,z:body.velocity.z,length:body.velocity.length()},
      wheels,engineForce:v.engineForce,camera:g.camera.position.toArray(),fov:g.camera.fov,
      challenge:g.challenges.current?.id,rendererName:g.quality.rendererName
    };
  });
  fs.writeFileSync('test-results/physics-diagnostics.json',JSON.stringify(driving,null,2));
  if(!(driving.s.speedKmh>5))throw new Error(`Deterministic vehicle acceleration failed: ${JSON.stringify(driving)}`);
  if(!driving.camera.every(Number.isFinite)||!Number.isFinite(driving.fov))throw new Error(`Camera became non-finite: ${JSON.stringify(driving)}`);
  if(driving.challenge!=='sprint')throw new Error(`Unexpected initial challenge ${driving.challenge}`);
  await shot(page,'test-results/desktop-driving.png');

  await page.evaluate(()=>{window.__NEON_RACER__.game.state='running'});
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='paused');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(120);
  const reset=await page.evaluate(()=>window.__NEON_RACER__.snapshot());
  if(Math.abs(reset.position.z-24)>3||Math.abs(reset.position.x)>3)throw new Error(`Reset position unexpected: ${JSON.stringify(reset.position)}`);

  const progression=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle,c=g.challenges;
    g.state='paused';
    for(const [x,z] of c.challenges[0].points){v.chassisBody.position.set(x,1.2,z);c.update(1/60,v)}
    if(c.current?.id!=='drift')return{ok:false,at:'sprint',id:c.current?.id};
    v.chassisBody.position.set(c.current.zone.x,1.2,c.current.zone.z);v.isDrifting=true;v.driftIntensity=1;v.vehicle.currentVehicleSpeedKmHour=100;
    for(let i=0;i<60&&c.current?.id==='drift';i++)c.update(.25,v);
    if(c.current?.id!=='speed')return{ok:false,at:'drift',id:c.current?.id,drift:c._driftMission};
    v.isDrifting=false;v.driftIntensity=0;v.vehicle.currentVehicleSpeedKmHour=125;v.chassisBody.position.set(c.current.point.x,1.2,c.current.point.z);c.update(1/60,v);
    return{ok:c.completed&&g.state==='complete',completed:c.completed,state:g.state,score:c.score,rank:document.getElementById('finalRank')?.textContent,completeVisible:document.getElementById('complete')?.classList.contains('visible')};
  });
  if(!progression.ok)throw new Error(`Progression/ending contract failed: ${JSON.stringify(progression)}`);
  await shot(page,'test-results/journey-complete.png');
  await page.click('#playAgain');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running'&&window.__NEON_RACER__.snapshot().challengeIndex===0);

  const metrics=await page.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,s=api.snapshot();
    return{snapshot:s,camera:{fov:g.camera.fov,position:g.camera.position.toArray()},quality:{requested:g.quality.requested,effective:g.quality.effective,rendererName:g.quality.rendererName,softwareRenderer:g.quality.softwareRenderer},renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles},city:g.city.stats};
  });
  fs.writeFileSync('test-results/metrics.json',JSON.stringify(metrics,null,2));
  if(errors.length)throw new Error(errors.join('\n'));
  await page.close();
  return driving.s;
}

async function runMobile(browser){
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const gas=page.locator('[data-control="gas"]'),drift=page.locator('[data-control="drift"]');
  await gas.dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch',isPrimary:true});
  await drift.dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch',isPrimary:false});
  await page.waitForTimeout(200);
  const simultaneous=await page.evaluate(()=>({gas:window.__NEON_RACER__.game.input.touch.gas,drift:window.__NEON_RACER__.game.input.touch.drift}));
  if(!simultaneous.gas||!simultaneous.drift)throw new Error(`Simultaneous mobile touch failed: ${JSON.stringify(simultaneous)}`);
  await gas.dispatchEvent('pointerup',{pointerId:11,pointerType:'touch'});
  await drift.dispatchEvent('pointerup',{pointerId:12,pointerType:'touch'});
  await page.waitForTimeout(100);
  await shot(page,'test-results/mobile-844x390.png');
  if(errors.length)throw new Error(errors.join('\n'));
  await page.close();
}

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const desktop=await runDesktop(browser);
  await runMobile(browser);
  console.log(`V0.8.0 browser smoke PASS · deterministic speed ${desktop.speedKmh.toFixed(1)} km/h · score ${desktop.score}`);
}finally{await browser.close()}
