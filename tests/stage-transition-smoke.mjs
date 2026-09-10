import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/stage-transition',{recursive:true});
const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const overlaps=(a,b)=>a&&b&&!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running'&&window.__NEON_RACER__.snapshot().audio?.initialized===true);

  const first=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,c=g.challenges,a=g.audio,toast=document.getElementById('challengeToast'),panel=document.querySelector('.hud-top-left'),speed=document.querySelector('.speed-panel'),compass=document.querySelector('.objective-compass'),score=document.querySelector('.score-panel'),mobile=document.querySelector('.mobile-controls');
    c.challengeIndex=0;c.sprintIndex=3;c.challengeStartedAt=performance.now();c._refreshMarkers();
    const before={...a.snapshot().feedback},point=c.current.points[3];
    c._updateSprint(c.current,{x:point[0],z:point[1]});
    const rect=o=>{if(!o)return null;const r=o.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    const style=getComputedStyle(toast);
    return{before,after:{...a.snapshot().feedback},challengeIndex:c.challengeIndex,current:c.current?.id,text:toast.textContent,kind:toast.dataset.feedback,phase:toast.dataset.phase,next:toast.dataset.nextStage,toastClass:toast.classList.contains('stage-transition'),panelClass:panel.classList.contains('stage-transition'),stage:g.stageTransition.snapshot(),toastRect:rect(toast),panelRect:rect(panel),speedRect:rect(speed),compassRect:rect(compass),scoreRect:rect(score),mobileRect:rect(mobile),shortHeightMedia:matchMedia('(max-height:480px)').matches,landscapeMedia:matchMedia('(orientation:landscape)').matches,computedTop:style.top,transitionProperty:style.transitionProperty};
  });
  if(first.challengeIndex!==1||first.current!=='drift'||first.text!=='TIME ATTACK ✓ → DRIFT RUN')throw new Error(`Time Attack handoff failed: ${JSON.stringify(first)}`);
  if(first.kind!=='milestone'||first.phase!=='transition'||first.next!=='drift'||!first.toastClass||!first.panelClass)throw new Error(`Time Attack transition styling failed: ${JSON.stringify(first)}`);
  if(first.stage.profile!=='stage-transition-v1'||first.stage.count!==1||first.stage.lastFrom!=='TIME ATTACK'||first.stage.lastTo!=='DRIFT RUN')throw new Error(`Stage transition state failed: ${JSON.stringify(first.stage)}`);
  if(first.after.successCues!==first.before.successCues+1)throw new Error(`Time Attack success cue count changed: ${JSON.stringify({before:first.before,after:first.after})}`);
  if(!first.shortHeightMedia||first.transitionProperty.split(',').map(s=>s.trim()).includes('top'))throw new Error(`Transition positioning contract failed: ${JSON.stringify({shortHeightMedia:first.shortHeightMedia,landscapeMedia:first.landscapeMedia,computedTop:first.computedTop,transitionProperty:first.transitionProperty})}`);
  const blocked={panel:first.panelRect,speed:first.speedRect,compass:first.compassRect,score:first.scoreRect,mobile:first.mobileRect};
  if(first.toastRect.left<0||first.toastRect.right>844||Object.entries(blocked).some(([,r])=>overlaps(first.toastRect,r)))throw new Error(`844x390 transition layout overlap: ${JSON.stringify({toast:first.toastRect,...blocked,computedTop:first.computedTop})}`);
  if(first.toastRect.top<first.panelRect.bottom+8)throw new Error(`Transition vertical clearance too small: ${JSON.stringify({toast:first.toastRect,panel:first.panelRect,computedTop:first.computedTop})}`);
  await page.waitForFunction(()=>document.getElementById('objectiveTitle')?.textContent.includes('Drift Run'));
  await page.screenshot({path:'test-results/stage-transition/time-to-drift-844x390.png'});

  const second=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,c=g.challenges,a=g.audio,toast=document.getElementById('challengeToast');
    const before={...a.snapshot().feedback};c._driftMission=c.current.target;
    c._updateDrift(c.current,{x:c.current.zone.x,z:c.current.zone.z},{isDrifting:false,speedKmh:0,driftIntensity:0},.016);
    return{before,after:{...a.snapshot().feedback},challengeIndex:c.challengeIndex,current:c.current?.id,text:toast.textContent,phase:toast.dataset.phase,next:toast.dataset.nextStage,stage:g.stageTransition.snapshot()};
  });
  if(second.challengeIndex!==2||second.current!=='speed'||second.text!=='DRIFT RUN ✓ → SPEED TRAP'||second.phase!=='transition'||second.next!=='speed')throw new Error(`Drift handoff failed: ${JSON.stringify(second)}`);
  if(second.stage.count!==2||second.stage.lastFrom!=='DRIFT RUN'||second.stage.lastTo!=='SPEED TRAP')throw new Error(`Second transition state failed: ${JSON.stringify(second.stage)}`);
  if(second.after.successCues!==second.before.successCues+1)throw new Error(`Drift success cue count changed: ${JSON.stringify({before:second.before,after:second.after})}`);
  await page.waitForFunction(()=>document.getElementById('objectiveTitle')?.textContent.includes('Speed Trap'));

  const finish=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,c=g.challenges,toast=document.getElementById('challengeToast'),before=g.stageTransition.snapshot(),p=c.current.point;
    c._updateSpeed(c.current,{x:p.x,z:p.z},{speedKmh:120});
    return{completed:c.completed,state:g.state,before,after:g.stageTransition.snapshot(),text:toast.textContent,phase:toast.dataset.phase||null,transitionClass:toast.classList.contains('stage-transition')};
  });
  if(!finish.completed||finish.state!=='complete'||finish.after.count!==finish.before.count||finish.phase!==null||finish.transitionClass)throw new Error(`Final Speed Trap should not create a next-stage transition: ${JSON.stringify(finish)}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Stage Transition PASS · TIME ATTACK → DRIFT RUN → SPEED TRAP · first-frame top ${first.computedTop} · single success cue each · final clear has no false next stage · 844x390 HUD corridor clear`);
  await page.close();
}finally{await browser.close()}
