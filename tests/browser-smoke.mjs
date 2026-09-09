import {testBrowser as chromium} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('test-results',{recursive:true});
const shot=(page,path)=>page.screenshot({path,fullPage:false,animations:'disabled',caret:'hide'});

async function runDesktop(browser){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  const gl=await page.evaluate(()=>{const c=document.querySelector('canvas');return Boolean(c&&(c.getContext('webgl2')||c.getContext('webgl')))});
  if(!gl)throw new Error('WebGL context unavailable');
  await shot(page,'test-results/menu-desktop.png');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const initialReplay=await page.evaluate(()=>{const g=window.__NEON_RACER__.game;return{routeIndex:g.challenges.routeIndex,routeName:g.challenges.routeName,routeCount:g.challenges.routes.length,runs:g.records.runs}});
  if(initialReplay.routeIndex!==0||initialReplay.routeCount!==3||initialReplay.runs!==0)throw new Error(`Initial replay route contract failed: ${JSON.stringify(initialReplay)}`);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(120);
  const inputWired=await page.evaluate(()=>window.__NEON_RACER__.game.input.keys.has('KeyW'));
  await page.keyboard.up('KeyW');
  if(!inputWired)throw new Error('Keyboard W input did not reach Input system');

  const collisionContract=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game;
    const impact=g.audio.impact,toast=g.hud.toast;
    g.audio.impact=()=>{};g.hud.toast=()=>{};
    try{
      g.challenges.combo=3.5;g.lastCollisionAt=-1000;
      g._collision({body:g.city.groundBody,contact:{getImpactVelocityAlongNormal:()=>12}});
      const groundKeepsCombo=g.challenges.combo===3.5;
      g.lastCollisionAt=-1000;
      g._collision({body:g.city.staticBodies[0],contact:{getImpactVelocityAlongNormal:()=>9}});
      const obstacleResetsCombo=g.challenges.combo===1;
      return{groundKeepsCombo,obstacleResetsCombo,obstacleCount:g.city.staticBodies.length};
    }finally{g.audio.impact=impact;g.hud.toast=toast;g.challenges.combo=1}
  });
  if(!collisionContract.groundKeepsCombo||!collisionContract.obstacleResetsCombo)throw new Error(`Collision filtering contract failed: ${JSON.stringify(collisionContract)}`);

  const driving=await page.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,v=g.vehicle;
    g.state='paused';
    v.reset({x:0,y:1.2,z:24},0);
    const start={x:v.position.x,y:v.position.y,z:v.position.z};
    v.setInput({throttle:1,steer:0,handbrake:false,nitro:false});
    for(let i=0;i<180;i++){v.update(g.fixedDt);g.physics.step(g.fixedDt)}
    v._syncVisuals();
    v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
    const s=api.snapshot(),body=v.chassisBody;
    const wheels=v.vehicle.wheelInfos.map((w,i)=>({i,isInContact:Boolean(w.isInContact),suspensionLength:w.suspensionLength,engineForce:w.engineForce,brake:w.brake,frictionSlip:w.frictionSlip}));
    return {
      s,start,end:{x:body.position.x,y:body.position.y,z:body.position.z},
      velocity:{x:body.velocity.x,y:body.velocity.y,z:body.velocity.z,length:body.velocity.length()},
      wheels,engineForce:v.engineForce,challenge:g.challenges.current?.id,rendererName:g.quality.rendererName
    };
  });
  if(!(driving.s.speedKmh>35&&driving.s.speedKmh<125))throw new Error(`Acceleration envelope failed: ${JSON.stringify({speedKmh:driving.s.speedKmh,engineForce:driving.engineForce})}`);
  if(!(driving.end.z<driving.start.z-5))throw new Error(`Forward drive moved away from first checkpoint: ${JSON.stringify({start:driving.start,end:driving.end,velocity:driving.velocity})}`);
  if(driving.challenge!=='sprint')throw new Error(`Unexpected initial challenge ${driving.challenge}`);

  const stability=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle;
    g.state='paused';v.reset({x:0,y:1.2,z:80},0);
    const masks=g.city.staticBodies.map(b=>b.collisionFilterMask);
    g.city.staticBodies.forEach(b=>{b.collisionFilterMask=0});
    let minUpY=1,maxSpeed=0,maxRollPitchRate=0;
    const sample=()=>{
      const q=v.chassisBody.quaternion;
      const x=2*(q.x*q.y-q.w*q.z),y=1-2*(q.x*q.x+q.z*q.z),z=2*(q.y*q.z+q.w*q.x);
      minUpY=Math.min(minUpY,y);maxSpeed=Math.max(maxSpeed,v.speedKmh);
      maxRollPitchRate=Math.max(maxRollPitchRate,Math.hypot(v.chassisBody.angularVelocity.x,v.chassisBody.angularVelocity.z));
      return{x,y,z};
    };
    try{
      v.setInput({throttle:1,steer:0,handbrake:false,nitro:false});
      for(let i=0;i<90;i++){v.update(g.fixedDt);g.physics.step(g.fixedDt);sample()}
      v.setInput({throttle:.82,steer:1,handbrake:false,nitro:false});
      for(let i=0;i<210;i++){v.update(g.fixedDt);g.physics.step(g.fixedDt);sample()}
      v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
      const finalUp=sample();
      return{minUpY,finalUpY:finalUp.y,maxSpeed,maxRollPitchRate,position:{x:v.position.x,y:v.position.y,z:v.position.z}};
    }finally{g.city.staticBodies.forEach((b,i)=>{b.collisionFilterMask=masks[i]})}
  });
  if(!(stability.minUpY>.65&&stability.finalUpY>.8&&stability.maxRollPitchRate<5.5))throw new Error(`Rollover stability failed: ${JSON.stringify(stability)}`);

  const nitroReach=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle;
    g.state='paused';v.reset({x:0,y:1.2,z:150},0);
    const masks=g.city.staticBodies.map(b=>b.collisionFilterMask);g.city.staticBodies.forEach(b=>{b.collisionFilterMask=0});
    let peak=0;
    try{
      v.setInput({throttle:1,steer:0,handbrake:false,nitro:true});
      for(let i=0;i<600;i++){v.update(g.fixedDt);g.physics.step(g.fixedDt);peak=Math.max(peak,v.speedKmh)}
      v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
      return{peak,nitro:v.nitro};
    }finally{g.city.staticBodies.forEach((b,i)=>{b.collisionFilterMask=masks[i]})}
  });
  if(!(nitroReach.peak>120&&nitroReach.peak<185))throw new Error(`Nitro/Speed Trap envelope failed: ${JSON.stringify(nitroReach)}`);

  const recovery=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle;
    g.state='paused';v.reset({x:34,y:.9,z:36},0);v.vehicle.currentVehicleSpeedKmHour=0;v.chassisBody.quaternion.setFromEuler(Math.PI,0,0);v.chassisBody.velocity.setZero();v.chassisBody.angularVelocity.setZero();g.flipTimer=0;g.recoveryCooldown=0;
    const before={x:v.position.x,z:v.position.z};for(let i=0;i<100;i++)g._recovery(1/60);
    const q=v.chassisBody.quaternion,upY=1-2*(q.x*q.x+q.z*q.z);return{upY,position:{x:v.position.x,y:v.position.y,z:v.position.z},before,flipTimer:g.flipTimer,cooldown:g.recoveryCooldown};
  });
  if(!(recovery.upY>.85&&recovery.position.y>1&&Math.abs(recovery.position.x-recovery.before.x)<.5&&Math.abs(recovery.position.z-recovery.before.z)<.5))throw new Error(`Auto recovery contract failed: ${JSON.stringify(recovery)}`);

  fs.writeFileSync('test-results/physics-diagnostics.json',JSON.stringify({driving,stability,nitroReach,recovery},null,2));

  const composition=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle;
    v.reset({x:0,y:1.2,z:24},0);g.cameraYaw=0;g.cameraPitch=.13;g._lookTarget=null;g._lastSafeCamera=null;
    v.setInput({throttle:.48,steer:.08,handbrake:false,nitro:false});
    for(let i=0;i<55;i++){v.update(g.fixedDt);g.physics.step(g.fixedDt)}
    v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});v._syncVisuals();
    for(let i=0;i<30;i++)g._camera(1/60);
    g.hud.update(v,g.challenges);g._render();
    const p=v.visualRoot.position.clone().project(g.camera);
    return{ndc:[p.x,p.y,p.z],camera:g.camera.position.toArray(),fov:g.camera.fov,speed:v.speedKmh,position:{x:v.position.x,y:v.position.y,z:v.position.z}};
  });
  if(!composition.camera.every(Number.isFinite)||!Number.isFinite(composition.fov))throw new Error(`Camera became non-finite: ${JSON.stringify(composition)}`);
  if(!(Math.abs(composition.ndc[0])<.82&&Math.abs(composition.ndc[1])<.82&&composition.ndc[2]>-1&&composition.ndc[2]<1))throw new Error(`Player car not framed by driving camera: ${JSON.stringify(composition)}`);
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
    g.state='paused';const routeName=c.routeName,routeIndex=c.routeIndex;
    for(const [x,z] of c.challenges[0].points){v.chassisBody.position.set(x,1.2,z);c.update(1/60,v)}
    if(c.current?.id!=='drift')return{ok:false,at:'sprint',id:c.current?.id};
    v.chassisBody.position.set(c.current.zone.x,1.2,c.current.zone.z);v.isDrifting=true;v.driftIntensity=1;v.vehicle.currentVehicleSpeedKmHour=100;
    for(let i=0;i<60&&c.current?.id==='drift';i++)c.update(.25,v);
    if(c.current?.id!=='speed')return{ok:false,at:'drift',id:c.current?.id,drift:c._driftMission};
    v.isDrifting=false;v.driftIntensity=0;v.vehicle.currentVehicleSpeedKmHour=125;v.chassisBody.position.set(c.current.point.x,1.2,c.current.point.z);c.update(1/60,v);
    return{ok:c.completed&&g.state==='complete',completed:c.completed,state:g.state,score:c.score,rank:document.getElementById('finalRank')?.textContent,completeVisible:document.getElementById('complete')?.classList.contains('visible'),routeName,routeIndex,records:{...g.records},recordText:document.getElementById('finalRecord')?.textContent};
  });
  if(!progression.ok)throw new Error(`Progression/ending contract failed: ${JSON.stringify(progression)}`);
  if(!(progression.records.runs===1&&progression.records.bestScore>0&&progression.records.bestTime>0&&progression.recordText?.length>5))throw new Error(`Persistent record contract failed: ${JSON.stringify(progression)}`);
  await shot(page,'test-results/journey-complete.png');
  await page.click('#playAgain');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running'&&window.__NEON_RACER__.snapshot().challengeIndex===0);
  const replay=await page.evaluate(()=>{const s=window.__NEON_RACER__.snapshot();return{routeIndex:s.routeIndex,routeName:s.routeName,records:s.records,button:document.getElementById('playAgain')?.textContent}});
  if(replay.routeIndex===progression.routeIndex||replay.routeName===progression.routeName||replay.records.runs!==1)throw new Error(`Route replayability contract failed: ${JSON.stringify({before:progression,replay})}`);

  const metrics=await page.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,s=api.snapshot();
    return{snapshot:s,camera:{fov:g.camera.fov,position:g.camera.position.toArray()},quality:{requested:g.quality.requested,effective:g.quality.effective,rendererName:g.quality.rendererName,softwareRenderer:g.quality.softwareRenderer},renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles},city:g.city.stats};
  });
  fs.writeFileSync('test-results/metrics.json',JSON.stringify(metrics,null,2));
  if(metrics.city.facadeFaces!==4||metrics.city.windows<1500)throw new Error(`Four-sided facade contract failed: ${JSON.stringify(metrics.city)}`);
  if(metrics.quality.softwareRenderer&&(metrics.renderer.calls>60||metrics.renderer.triangles>110000))throw new Error(`Software render budget exceeded: ${JSON.stringify(metrics.renderer)}`);
  if(errors.length)throw new Error(errors.join('\n'));
  await page.close();
  return driving.s;
}

async function runMobile(browser){
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
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
  console.log(`V0.8.0 browser smoke PASS · 3s speed ${desktop.speedKmh.toFixed(1)} km/h · score ${desktop.score}`);
}finally{await browser.close()}
