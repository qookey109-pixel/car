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
    const g=window.__NEON_RACER__.game,t=g.ambientTraffic,mesh=t.mesh,gr=g.ghostReplay;
    g.state='paused';
    const beforeBodies=g.physics.bodies.length;
    const beforeOccluders=g.city.cameraOccluders.length;
    const readMatrix=i=>{mesh.getMatrixAt(i,t.dummy.matrix);const e=t.dummy.matrix.elements;return{x:e[12],y:e[13],z:e[14]}};

    t.elapsed=0;t.update(0,true);
    const p0=readMatrix(0);
    t.update(1);
    const p1=readMatrix(0);
    const moved=Math.hypot(p1.x-p0.x,p1.z-p0.z);

    const pose=t._pose(t.records[0]);
    g.vehicle.chassisBody.position.set(pose.x,1.2,pose.z);
    g.vehicle._syncVisuals();
    t.update(0);
    const excluded=readMatrix(0);

    g.vehicle.reset({x:0,y:1.2,z:24},0);
    g._camera(1/60);
    const oldBloom=g.bloomPass.enabled;
    g.bloomPass.enabled=false;
    gr.mesh.position.set(0,1.4,8);gr.mesh.visible=true;
    mesh.visible=false;
    g.renderer.info.reset();g._render();
    const without={calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
    mesh.visible=true;
    t.update(0);
    g.renderer.info.reset();g._render();
    const withTraffic={calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
    gr.mesh.visible=false;g.bloomPass.enabled=oldBloom;

    return{
      snapshot:t.snapshot(),
      mesh:{count:mesh.count,name:mesh.name,dynamic:mesh.instanceMatrix.usage},
      moved,
      p0,p1,excluded,
      physics:{before:beforeBodies,after:g.physics.bodies.length},
      occluders:{before:beforeOccluders,after:g.city.cameraOccluders.length,contains:g.city.cameraOccluders.includes(mesh)},
      render:{without,withTraffic}
    };
  });

  if(result.snapshot.profile!=='ambient-traffic-v1'||result.snapshot.cars!==18||result.snapshot.renderGroups!==1||result.snapshot.physicsBodies!==0)throw new Error(`Ambient traffic contract failed: ${JSON.stringify(result.snapshot)}`);
  if(result.mesh.count!==18||result.mesh.name!=='AmbientTrafficBatch')throw new Error(`Ambient traffic batch failed: ${JSON.stringify(result.mesh)}`);
  if(!(result.moved>6&&result.moved<15))throw new Error(`Ambient traffic did not advance deterministically: ${JSON.stringify({moved:result.moved,p0:result.p0,p1:result.p1})}`);
  if(result.excluded.y>-8)throw new Error(`Near-player exclusion failed: ${JSON.stringify(result.excluded)}`);
  if(result.physics.after!==result.physics.before)throw new Error(`Ambient traffic mutated physics body count: ${JSON.stringify(result.physics)}`);
  if(result.occluders.after!==result.occluders.before||result.occluders.contains)throw new Error(`Ambient traffic mutated camera occluders: ${JSON.stringify(result.occluders)}`);
  const deltaCalls=result.render.withTraffic.calls-result.render.without.calls;
  if(deltaCalls!==1||result.render.withTraffic.calls>60||result.render.withTraffic.triangles>110000)throw new Error(`Ambient traffic render budget failed: ${JSON.stringify(result.render)}`);

  await page.screenshot({path:'test-results/ambient-traffic/ambient-traffic-desktop.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Ambient Traffic PASS · 18 cars · 1 InstancedMesh · moved ${result.moved.toFixed(1)}m/s · exclusion y ${result.excluded.y.toFixed(1)} · combined Ghost+Traffic ${result.render.withTraffic.calls} calls / ${Math.round(result.render.withTraffic.triangles)} tris`);
}finally{await browser.close()}
