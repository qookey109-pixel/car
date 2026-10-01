import {testBrowser as chromium} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/ghost-replay',{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{
    try{
      localStorage.removeItem('neon-racer-records');
      localStorage.removeItem('neon-racer-ghosts-v1');
    }catch{}
  });
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.game?.ghostReplay);
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');

  const empty=await page.evaluate(()=>window.__NEON_RACER__.snapshot().ghost);
  if(empty.profile!=='ghost-replay-v1'||empty.available||empty.visible||empty.storedRoutes!==0)throw new Error(`Empty ghost migration failed: ${JSON.stringify(empty)}`);

  const seeded=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,gr=g.ghostReplay;
    const bodiesBefore=g.physics.bodies.length;
    gr.routeName='河岸東環';
    gr.recording=[
      {t:0,x:0,y:1.2,z:24,yaw:0},
      {t:1,x:0,y:1.2,z:10,yaw:0},
      {t:2,x:0,y:1.2,z:0,yaw:0}
    ];
    gr.finish({routeName:'河岸東環',time:3},true);
    const saved=JSON.parse(localStorage.getItem('neon-racer-ghosts-v1')||'{}');
    gr.hide();g._render();
    const callsWithoutGhost=g.renderer.info.render.calls;
    gr.start('河岸東環');
    gr.startedAt=performance.now()-1000;
    g.vehicle.chassisBody.position.set(0,1.2,10);
    g.vehicle._syncVisuals();
    gr.update();
    g._render();
    const callsWithGhost=g.renderer.info.render.calls;
    const snap=gr.snapshot();
    const deltaEl=document.getElementById('ghostDelta');
    return{
      bodiesBefore,bodiesAfter:g.physics.bodies.length,
      saved,
      callsWithoutGhost,callsWithGhost,
      snap,
      mesh:{visible:gr.mesh.visible,position:gr.mesh.position.toArray(),rotationY:gr.mesh.rotation.y},
      deltaText:deltaEl?.textContent||'',
      deltaHidden:deltaEl?.classList.contains('hidden')??true
    };
  });

  const route=seeded.saved.routes?.['河岸東環'];
  if(!route||route.duration!==3||route.samples.length<4)throw new Error(`Ghost PB persistence failed: ${JSON.stringify(seeded.saved)}`);
  if(seeded.bodiesAfter!==seeded.bodiesBefore)throw new Error(`Ghost added physics bodies: ${JSON.stringify({before:seeded.bodiesBefore,after:seeded.bodiesAfter})}`);
  if(!seeded.snap.available||!seeded.snap.visible||seeded.snap.ghostSamples<4||seeded.snap.storedRoutes!==1)throw new Error(`Ghost activation failed: ${JSON.stringify(seeded.snap)}`);
  if(!seeded.mesh.position.every(Number.isFinite)||!Number.isFinite(seeded.mesh.rotationY))throw new Error(`Ghost transform invalid: ${JSON.stringify(seeded.mesh)}`);
  if(seeded.deltaHidden||!seeded.deltaText.startsWith('GHOST · '))throw new Error(`Ghost HUD delta missing: ${JSON.stringify({text:seeded.deltaText,hidden:seeded.deltaHidden})}`);
  if(seeded.callsWithGhost>60||seeded.callsWithGhost>seeded.callsWithoutGhost+2)throw new Error(`Ghost render budget exceeded: ${JSON.stringify({without:seeded.callsWithoutGhost,with:seeded.callsWithGhost})}`);

  const protection=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,gr=g.ghostReplay;
    const before=JSON.parse(localStorage.getItem('neon-racer-ghosts-v1')).routes['河岸東環'];
    gr.routeName='河岸東環';
    gr.recording=[{t:0,x:0,y:1.2,z:24,yaw:0},{t:4,x:20,y:1.2,z:0,yaw:.5}];
    gr.finish({routeName:'河岸東環',time:4},false);
    const after=JSON.parse(localStorage.getItem('neon-racer-ghosts-v1')).routes['河岸東環'];
    gr.start('霓虹西環');
    const mismatch=gr.snapshot();
    const hidden=document.getElementById('ghostDelta')?.classList.contains('hidden')??false;
    return{before,after,mismatch,hidden};
  });

  if(protection.after.duration!==protection.before.duration||protection.after.samples.length!==protection.before.samples.length)throw new Error(`Non-PB run overwrote ghost: ${JSON.stringify(protection)}`);
  if(protection.mismatch.available||protection.mismatch.visible||!protection.hidden)throw new Error(`Route-specific ghost isolation failed: ${JSON.stringify(protection)}`);

  await page.screenshot({path:'test-results/ghost-replay/ghost-delta-desktop.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Ghost Replay PASS · route-isolated PB persistence · live delta HUD · 0 physics bodies · render calls ${seeded.callsWithoutGhost}→${seeded.callsWithGhost}`);
}finally{await browser.close()}
