import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/first-30-seconds',{recursive:true});

const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{localStorage.removeItem('neon-racer-records')});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().state==='running');

  const armed=await page.evaluate(()=>window.__NEON_RACER__.snapshot().firstRun);
  if(armed.profile!=='first-30-seconds-v1'||!armed.active||armed.stage!=='armed'||!armed.seenThisSession)throw new Error(`First-run arm failed: ${JSON.stringify(armed)}`);

  await page.waitForFunction(()=>window.__NEON_RACER__?.game?.firstRunDirector?.cue?.classList?.contains('show'),null,{timeout:6500});
  const launch=await page.evaluate(()=>{
    const p=window.__NEON_RACER__.game.firstRunDirector, cue=p.cue, mobile=document.getElementById('mobileControls');
    const rect=o=>{const r=o.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    return{
      snapshot:p.snapshot(),
      title:cue.querySelector('.first-run-title').textContent,
      line:cue.querySelector('.first-run-line').textContent,
      visible:cue.classList.contains('show'),
      pointer:getComputedStyle(p.root).pointerEvents,
      cue:rect(cue),
      mobile:rect(mobile)
    };
  });
  if(!launch.visible||launch.snapshot.stage!=='launch'||launch.title!=='GO'||!launch.line.includes('GAS')||launch.pointer!=='none')throw new Error(`Launch cue failed: ${JSON.stringify(launch)}`);
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  if(overlaps(launch.cue,launch.mobile))throw new Error(`First-run cue overlaps mobile controls: ${JSON.stringify(launch)}`);

  const speed=await page.evaluate(()=>{
    const p=window.__NEON_RACER__.game.firstRunDirector;
    p.startedAt=performance.now()-5000;p.stage='launch';p.update(42,0,0);
    return{snapshot:p.snapshot(),title:p.cue.querySelector('.first-run-title').textContent,line:p.cue.querySelector('.first-run-line').textContent};
  });
  if(speed.snapshot.stage!=='speed'||speed.title!=='KEEP IT CLEAN'||!speed.line.includes('N₂O'))throw new Error(`Speed cue failed: ${JSON.stringify(speed)}`);

  const checkpoint=await page.evaluate(()=>{
    const p=window.__NEON_RACER__.game.firstRunDirector;
    dispatchEvent(new CustomEvent('neon-racer-feedback',{detail:{kind:'checkpoint',source:'first-30-seconds-acceptance'}}));
    return{snapshot:p.snapshot(),title:p.cue.querySelector('.first-run-title').textContent,line:p.cue.querySelector('.first-run-line').textContent,visible:p.cue.classList.contains('show')};
  });
  if(!checkpoint.snapshot.firstCheckpoint||checkpoint.snapshot.stage!=='checkpoint'||checkpoint.title!=='CLEAN'||!checkpoint.visible)throw new Error(`Checkpoint onboarding finish failed: ${JSON.stringify(checkpoint)}`);
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().firstRun?.stage==='done',null,{timeout:3500});
  const done=await page.evaluate(()=>window.__NEON_RACER__.snapshot().firstRun);
  if(done.active||!done.completed||done.stage!=='done')throw new Error(`First-run completion failed: ${JSON.stringify(done)}`);

  const replay=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,p=g.firstRunDirector;
    p.begin({firstRun:true});
    return p.snapshot();
  });
  if(replay.active||replay.stage!=='returning')throw new Error(`Once-per-session suppression failed: ${JSON.stringify(replay)}`);

  const render=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game;g.renderer.info.reset();g._render();
    return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
  });
  if(render.calls>60||render.triangles>110000)throw new Error(`First-run DOM layer affected render budget: ${JSON.stringify(render)}`);

  await page.screenshot({path:'test-results/first-30-seconds/first-run-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`First 30 Seconds PASS · first-run only · GO → N₂O hint → checkpoint CLEAN · mobile corridor clear · 0 WebGL group cost (${render.calls} calls)`);
}finally{await browser.close()}
