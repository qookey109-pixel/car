import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/submission-visual',{recursive:true});

const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.9.2');

  const menu=await page.evaluate(()=>{
    const chips=[...document.querySelectorAll('#boot .route-signatures span')].map(e=>e.textContent.trim());
    return{
      title:document.title,
      eyebrow:document.querySelector('#boot .eyebrow')?.textContent||'',
      chips,
      featureText:document.querySelector('#boot .feature-row')?.textContent||'',
      note:document.querySelector('#boot .tiny-note')?.textContent||''
    };
  });
  if(!menu.title.includes('Submission Candidate')||!menu.eyebrow.includes('SANLU NIGHT RUN'))throw new Error(`Submission identity missing: ${JSON.stringify(menu)}`);
  if(menu.chips.length!==3||!menu.chips[0].includes('FLOW')||!menu.chips[1].includes('PRECISION')||!menu.chips[2].includes('RHYTHM'))throw new Error(`Route signatures missing: ${JSON.stringify(menu.chips)}`);
  if(/Raycast|Gamepad|Traffic Flow|PB Ghost/i.test(menu.featureText))throw new Error(`Engineering labels remain on menu: ${menu.featureText}`);
  if(menu.note!=='鍵盤 · 觸控 · 手把皆可遊玩')throw new Error(`Menu input note not editorialized: ${menu.note}`);
  await page.screenshot({path:'test-results/submission-visual/menu-844x390.png',animations:'disabled'});

  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().state==='running');
  await page.waitForFunction(()=>document.body.classList.contains('award-route-active'));
  await page.waitForTimeout(380);

  const intro=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game;
    const cs=s=>getComputedStyle(document.querySelector(s));
    g.renderer.info.reset();g._render();
    return{
      award:g.awardPresentation.snapshot(),
      objectiveOpacity:Number(cs('.hud-top-left').opacity),
      speedOpacity:Number(cs('.speed-panel').opacity),
      compassOpacity:Number(cs('.objective-compass').opacity),
      controlsOpacity:Number(cs('#mobileControls').opacity),
      gasPointer:cs('[data-control="gas"]').pointerEvents,
      scoreDisplay:cs('.score-panel').display,
      qualityDisplay:cs('#qualityBadge').display,
      calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles
    };
  });
  if(intro.award.profile!=='award-presentation-v2'||!intro.award.routeFocus)throw new Error(`Cinematic focus state missing: ${JSON.stringify(intro.award)}`);
  if(intro.objectiveOpacity>.05||intro.speedOpacity>.05||intro.compassOpacity>.05)throw new Error(`HUD not cleared during route intro: ${JSON.stringify(intro)}`);
  if(intro.controlsOpacity>.25)throw new Error(`Mobile controls too visually heavy during intro: ${intro.controlsOpacity}`);
  if(intro.gasPointer==='none')throw new Error('Cinematic focus blocked GAS input');
  if(intro.scoreDisplay!=='none'||intro.qualityDisplay!=='none')throw new Error(`Secondary telemetry visible on compact mobile: ${JSON.stringify({score:intro.scoreDisplay,quality:intro.qualityDisplay})}`);
  if(intro.calls>60||intro.triangles>110000)throw new Error(`Cinematic layer affected WebGL budget: ${JSON.stringify(intro)}`);
  await page.screenshot({path:'test-results/submission-visual/route-intro-844x390.png',animations:'disabled'});

  await page.waitForFunction(()=>!document.body.classList.contains('award-route-active'),null,{timeout:5000});
  await page.waitForTimeout(320);
  const restored=await page.evaluate(()=>({
    objective:Number(getComputedStyle(document.querySelector('.hud-top-left')).opacity),
    speed:Number(getComputedStyle(document.querySelector('.speed-panel')).opacity),
    controls:Number(getComputedStyle(document.querySelector('#mobileControls')).opacity)
  }));
  if(restored.objective<.95||restored.speed<.95||restored.controls<.95)throw new Error(`HUD did not restore after intro: ${JSON.stringify(restored)}`);

  const finish=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game;
    const summary={rank:'A',score:12345,bestCombo:3.2,time:68,routeName:'河岸東環',records:{first:true,newScore:true,newTime:true,newCombo:true,bestScore:12345,bestTime:68,bestCombo:3.2,runs:1}};
    g.awardPresentation.finish(summary,{first:true,newScore:true,newTime:true,newCombo:true});
    g.hud.showComplete(summary);
    const card=document.querySelector('#complete .result-card');
    const item=document.querySelector('#complete .result-grid div');
    const rank=document.querySelector('#finalRank');
    const cr=card.getBoundingClientRect();
    g.renderer.info.reset();g._render();
    return{
      finishFocus:document.body.classList.contains('award-finish-active'),
      finishHudOpacity:Number(getComputedStyle(document.querySelector('.hud-top-left')).opacity),
      finishCompassOpacity:Number(getComputedStyle(document.querySelector('.objective-compass')).opacity),
      cardBorder:getComputedStyle(card).borderTopWidth,
      itemBg:getComputedStyle(item).backgroundColor,
      rankSize:parseFloat(getComputedStyle(rank).fontSize),
      card:{left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom},
      calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles
    };
  });
  if(!finish.finishFocus)throw new Error('Finish cinematic focus missing');
  if(finish.finishHudOpacity>.05||finish.finishCompassOpacity>.05)throw new Error(`HUD not cleared during finish cinematic: ${JSON.stringify(finish)}`);
  if(finish.cardBorder!=='0px')throw new Error(`Result card still reads as dashboard panel: ${finish.cardBorder}`);
  if(!/rgba\(0, 0, 0, 0\)|transparent/.test(finish.itemBg))throw new Error(`Result stat cells still boxed: ${finish.itemBg}`);
  if(finish.rankSize<68)throw new Error(`Result rank hierarchy too weak: ${finish.rankSize}`);
  if(finish.card.left<0||finish.card.right>844||finish.card.top<0||finish.card.bottom>390)throw new Error(`Result composition overflow: ${JSON.stringify(finish.card)}`);
  if(finish.calls>60||finish.triangles>110000)throw new Error(`Submission finish affected WebGL budget: ${JSON.stringify(finish)}`);
  await page.screenshot({path:'test-results/submission-visual/finish-844x390.png',animations:'disabled'});

  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Submission Visual PASS · editorial menu · cinematic HUD focus · compact telemetry removed · poster result · WebGL ${finish.calls} calls / ${Math.round(finish.triangles)} tris`);
}finally{await browser.close()}
