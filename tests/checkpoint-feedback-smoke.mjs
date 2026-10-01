import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/checkpoint-feedback',{recursive:true});
const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running'&&window.__NEON_RACER__.snapshot().audio?.initialized===true);

  const checkpoint=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,c=g.challenges,el=document.getElementById('challengeToast');
    c.challengeIndex=0;c.sprintIndex=0;c.challengeStartedAt=performance.now();c._refreshMarkers();
    const before=g.audio.snapshot().feedback;
    c._updateSprint(c.current,{x:c.current.points[0][0],z:c.current.points[0][1]});
    const after=g.audio.snapshot().feedback,style=getComputedStyle(el);
    return{before,after,sprintIndex:c.sprintIndex,score:c.score,text:el.textContent,kind:el.dataset.feedback,index:el.dataset.checkpoint,total:el.dataset.checkpointTotal,pulse:el.classList.contains('checkpoint-hit'),border:style.borderTopColor,opacity:style.opacity};
  });

  if(checkpoint.sprintIndex!==1||!/^CHECKPOINT 1\/4\s+\+450/.test(checkpoint.text))throw new Error(`Checkpoint progression/toast failed: ${JSON.stringify(checkpoint)}`);
  if(checkpoint.kind!=='checkpoint'||checkpoint.index!=='1'||checkpoint.total!=='4'||!checkpoint.pulse)throw new Error(`Checkpoint visual feedback contract failed: ${JSON.stringify(checkpoint)}`);
  if(checkpoint.after.profile!=='checkpoint-feedback-v1'||checkpoint.after.checkpointCues!==checkpoint.before.checkpointCues+1||checkpoint.after.lastCheckpoint!==1)throw new Error(`Checkpoint audio cue failed: ${JSON.stringify(checkpoint)}`);
  if(checkpoint.after.successCues!==checkpoint.before.successCues)throw new Error(`Checkpoint incorrectly played milestone success chord: ${JSON.stringify(checkpoint)}`);
  await page.screenshot({path:'test-results/checkpoint-feedback/mobile-844x390.png'});

  const semantics=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,a=g.audio;
    const start={...a.snapshot().feedback};
    g.hud.toast('速度不足：80 / 110 km/h');a.success();const info={...a.snapshot().feedback};
    g.hud.toast('Drift Run 完成  ✓');a.success();const milestone={...a.snapshot().feedback};
    return{start,info,milestone,infoKind:document.getElementById('challengeToast').dataset.feedback};
  });
  if(semantics.info.successCues!==semantics.start.successCues||semantics.info.suppressedFallbacks<=semantics.start.suppressedFallbacks)throw new Error(`Info toast still produced success audio: ${JSON.stringify(semantics)}`);
  if(semantics.milestone.successCues!==semantics.info.successCues+1||semantics.milestone.suppressedFallbacks<=semantics.info.suppressedFallbacks)throw new Error(`Milestone semantic audio failed: ${JSON.stringify(semantics)}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Checkpoint Feedback PASS · checkpoint cue +1 · info success suppressed · milestone success +1 · 844x390 pulse`);
  await page.close();
}finally{await browser.close()}
