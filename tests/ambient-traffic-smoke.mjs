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

    const probe=t.records[0];
    probe.position=probe.phase;probe.velocity=probe.speed;
    t.update(0,true);
    const p0=readMatrix(mesh,0);
    for(let i=0;i<10;i++)t.update(.1);
    const p1=readMatrix(mesh,0);
    const moved=Math.hypot(p1.x-p0.x,p1.z-p0.z);

    const crossing=0;
    probe.position=crossing-probe.direction*28;
    probe.velocity=probe.speed;
    atmo.setSignalPhase(0);
    const redBefore=atmo.isSignalGreen(probe.vertical,probe.road,crossing);
    for(let i=0;i<80;i++)t.update(.1);
    const red={position:probe.position,velocity:probe.velocity,stopped:probe.stopped,stoppedCount:t.stoppedCount};
    atmo.setSignalPhase(1);
    const greenAfter=atmo.isSignalGreen(probe.vertical,probe.road,crossing);
    for(let i=0;i<20;i++)t.update(.1);
    const green={position:probe.position,velocity:probe.velocity,stopped:probe.stopped};

    const pose=t._pose(probe);
    g.vehicle.chassisBody.position.set(pose.x,1.2,pose.z);
    g.vehicle._syncVisuals();
    t.update(0);
    const excluded=readMatrix(mesh,0);
    const excludedHead=readMatrix(t.headLights,0);
    const excludedTail=readMatrix(t.tailLights,0);

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
      signal:{redBefore,greenAfter,red,green},
      excluded,excludedHead,excludedTail,
      physics:{before:beforeBodies,after:g.physics.bodies.length},
      occluders:{before:beforeOccluders,after:g.city.cameraOccluders.length,contains:[mesh,t.headLights,t.tailLights].some(m=>g.city.cameraOccluders.includes(m))},
      render:{without,withTraffic}
    };
  });

  if(result.snapshot.profile!=='ambient-traffic-v2'||result.snapshot.cars!==18||result.snapshot.renderGroups!==3||result.snapshot.lightGroups!==2||!result.snapshot.signalAware||result.snapshot.physicsBodies!==0)throw new Error(`Ambient traffic V2 contract failed: ${JSON.stringify(result.snapshot)}`);
  if(result.mesh.count!==18||result.mesh.name!=='AmbientTrafficBatch'||result.mesh.headCount!==36||result.mesh.tailCount!==36)throw new Error(`Ambient traffic/light batches failed: ${JSON.stringify(result.mesh)}`);
  if(!(result.moved>7.5&&result.moved<10))throw new Error(`Ambient traffic did not advance deterministically: ${JSON.stringify({moved:result.moved,p0:result.p0,p1:result.p1})}`);
  if(result.signal.redBefore!==false||result.signal.greenAfter!==true)throw new Error(`Signal authority mapping failed: ${JSON.stringify(result.signal)}`);
  if(!(result.signal.red.velocity<.65&&result.signal.red.stopped&&result.signal.red.stoppedCount>=1))throw new Error(`Red-light stop failed: ${JSON.stringify(result.signal.red)}`);
  if(!(result.signal.green.velocity>4&&!result.signal.green.stopped))throw new Error(`Green-light resume failed: ${JSON.stringify(result.signal.green)}`);
  if(result.excluded.y>-8||result.excludedHead.y>-8||result.excludedTail.y>-8)throw new Error(`Near-player exclusion failed: ${JSON.stringify({body:result.excluded,head:result.excludedHead,tail:result.excludedTail})}`);
  if(result.physics.after!==result.physics.before)throw new Error(`Ambient traffic mutated physics body count: ${JSON.stringify(result.physics)}`);
  if(result.occluders.after!==result.occluders.before||result.occluders.contains)throw new Error(`Ambient traffic mutated camera occluders: ${JSON.stringify(result.occluders)}`);
  const deltaCalls=result.render.withTraffic.calls-result.render.without.calls;
  if(deltaCalls!==3||result.render.withTraffic.calls>60||result.render.withTraffic.triangles>110000)throw new Error(`Traffic+lights render budget failed: ${JSON.stringify(result.render)}`);

  await page.screenshot({path:'test-results/ambient-traffic/ambient-traffic-v2-desktop.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Ambient Traffic V2 PASS · 18 signal-aware cars · red stop ${result.signal.red.velocity.toFixed(2)}m/s · green resume ${result.signal.green.velocity.toFixed(2)}m/s · 3 render groups · Ghost+Traffic+Lights ${result.render.withTraffic.calls} calls / ${Math.round(result.render.withTraffic.triangles)} tris`);
}finally{await browser.close()}
