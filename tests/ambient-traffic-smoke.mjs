import {testBrowser as chromium} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/ambient-traffic',{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.game?.ambientTraffic);
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');

  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,t=g.ambientTraffic,mesh=t.mesh,gr=g.ghostReplay,atmo=g.cityAtmosphere;
    g.state='paused';
    const beforeBodies=g.physics.bodies.length;
    const beforeOccluders=g.city.cameraOccluders.length;
    const readMatrix=(target,i)=>{target.getMatrixAt(i,t.dummy.matrix);const e=t.dummy.matrix.elements;return{x:e[12],y:e[13],z:e[14]}};
    const readTailColor=record=>{
      const c=t.lightColor.clone();
      t.tailLights.getColorAt(record.id*2,c);
      return c.getHex();
    };

    const leader=t.records[0],follower=t.records[1];
    if(leader.laneKey!==follower.laneKey)throw new Error('Expected first traffic pair to share lane');

    leader.position=leader.phase;leader.velocity=leader.speed;
    follower.position=follower.phase;follower.velocity=follower.speed;
    t.update(0,true);
    const p0=readMatrix(mesh,0);
    for(let i=0;i<10;i++)t.update(.1);
    const p1=readMatrix(mesh,0);
    const moved=Math.hypot(p1.x-p0.x,p1.z-p0.z);

    const crossing=0;
    const phase0Green=atmo.isSignalGreen(leader.vertical,leader.road,crossing,0);
    const redPhase=phase0Green?1:0,greenPhase=redPhase^1;
    atmo.setSignalPhase(redPhase);
    leader.position=crossing-leader.direction*14;
    follower.position=leader.position-follower.direction*12;
    leader.velocity=leader.speed;
    follower.velocity=follower.speed;
    for(let i=0;i<100;i++)t.update(.1);
    const redGap=t._leaderGap(follower);
    const redTailColor=readTailColor(follower);
    const red={
      leaderPosition:leader.position,
      followerPosition:follower.position,
      leaderVelocity:leader.velocity,
      followerVelocity:follower.velocity,
      leaderStopped:leader.stopped,
      followerStopped:follower.stopped,
      followerQueued:follower.queued,
      stoppedCount:t.stoppedCount,
      queuedCount:t.queuedCount,
      brakingCount:t.brakingCount,
      gap:redGap,
      tailColor:redTailColor
    };

    atmo.setSignalPhase(greenPhase);
    for(let i=0;i<40;i++)t.update(.1);
    const greenGap=t._leaderGap(follower);
    const greenTailColor=readTailColor(follower);
    const green={
      leaderVelocity:leader.velocity,
      followerVelocity:follower.velocity,
      leaderStopped:leader.stopped,
      followerStopped:follower.stopped,
      followerQueued:follower.queued,
      gap:greenGap,
      tailColor:greenTailColor
    };

    const pose=t._pose(leader);
    g.vehicle.chassisBody.position.set(pose.x,1.2,pose.z);
    g.vehicle._syncVisuals();
    t.update(0);
    const excluded=readMatrix(mesh,leader.id);
    const excludedHead=readMatrix(t.headLights,leader.id*2);
    const excludedTail=readMatrix(t.tailLights,leader.id*2);

    g.vehicle.reset({x:0,y:1.2,z:24},0);
    g._camera(1/60);
    const oldBloom=g.bloomPass.enabled;
    g.bloomPass.enabled=false;
    gr.mesh.position.set(0,1.4,8);gr.mesh.visible=true;
    mesh.visible=false;t.headLights.visible=false;t.tailLights.visible=false;
    g.renderer.info.reset();g._render();
    const without={calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
    mesh.visible=true;t.headLights.visible=true;t.tailLights.visible=true;
    t.update(0);
    g.renderer.info.reset();g._render();
    const withTraffic={calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
    gr.mesh.visible=false;g.bloomPass.enabled=oldBloom;

    return{
      snapshot:t.snapshot(),
      mesh:{count:mesh.count,name:mesh.name,headCount:t.headLights.count,tailCount:t.tailLights.count,headName:t.headLights.name,tailName:t.tailLights.name},
      moved,p0,p1,
      signal:{redPhase,greenPhase,red,green},
      excluded,excludedHead,excludedTail,
      physics:{before:beforeBodies,after:g.physics.bodies.length},
      occluders:{before:beforeOccluders,after:g.city.cameraOccluders.length,contains:[mesh,t.headLights,t.tailLights].some(m=>g.city.cameraOccluders.includes(m))},
      render:{without,withTraffic}
    };
  });

  const s=result.snapshot;
  if(s.profile!=='ambient-traffic-v3'||s.cars!==18||s.lanes!==9||s.renderGroups!==3||s.lightGroups!==2||!s.signalAware||!s.carFollowing||s.physicsBodies!==0||Math.abs(s.safeGap-7.5)>.01)throw new Error(`Ambient traffic V3 contract failed: ${JSON.stringify(s)}`);
  if(result.mesh.count!==18||result.mesh.name!=='AmbientTrafficBatch'||result.mesh.headCount!==36||result.mesh.tailCount!==36)throw new Error(`Ambient traffic/light batches failed: ${JSON.stringify(result.mesh)}`);
  if(!(result.moved>7.5&&result.moved<10))throw new Error(`Ambient traffic did not advance deterministically: ${JSON.stringify({moved:result.moved,p0:result.p0,p1:result.p1})}`);

  const red=result.signal.red,green=result.signal.green;
  if(!(red.leaderVelocity<.65&&red.followerVelocity<.65&&red.leaderStopped&&red.followerStopped&&red.followerQueued&&red.queuedCount>=1))throw new Error(`Red-light queue failed: ${JSON.stringify(red)}`);
  if(!(red.gap>=s.safeGap-.6&&red.gap<=s.safeGap+2.2))throw new Error(`Queue spacing failed: ${JSON.stringify({gap:red.gap,safeGap:s.safeGap})}`);
  if(red.tailColor!==0xff4055)throw new Error(`Brake-light bright state failed: ${red.tailColor.toString(16)}`);
  if(!(green.leaderVelocity>4&&green.followerVelocity>2&&!green.leaderStopped&&!green.followerStopped&&green.gap>=s.safeGap-.6))throw new Error(`Green queue release failed: ${JSON.stringify(green)}`);
  if(green.tailColor!==0x7a1c2b)throw new Error(`Brake-light release state failed: ${green.tailColor.toString(16)}`);

  if(result.excluded.y>-8||result.excludedHead.y>-8||result.excludedTail.y>-8)throw new Error(`Near-player exclusion failed: ${JSON.stringify({body:result.excluded,head:result.excludedHead,tail:result.excludedTail})}`);
  if(result.physics.after!==result.physics.before)throw new Error(`Ambient traffic mutated physics body count: ${JSON.stringify(result.physics)}`);
  if(result.occluders.after!==result.occluders.before||result.occluders.contains)throw new Error(`Ambient traffic mutated camera occluders: ${JSON.stringify(result.occluders)}`);

  const deltaCalls=result.render.withTraffic.calls-result.render.without.calls;
  if(deltaCalls!==3||result.render.withTraffic.calls>60||result.render.withTraffic.triangles>110000)throw new Error(`Traffic flow render budget failed: ${JSON.stringify(result.render)}`);

  await page.screenshot({path:'test-results/ambient-traffic/ambient-traffic-v3-desktop.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Ambient Traffic V3 PASS · 9 lanes / 18 cars · queue gap ${red.gap.toFixed(2)}m · red ${red.followerVelocity.toFixed(2)}m/s · green ${green.followerVelocity.toFixed(2)}m/s · brake lights dynamic · Ghost+Traffic ${result.render.withTraffic.calls} calls / ${Math.round(result.render.withTraffic.triangles)} tris`);
}finally{await browser.close()}
