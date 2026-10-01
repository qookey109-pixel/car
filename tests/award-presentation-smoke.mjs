import {testBrowser as chromium} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/award-presentation',{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  desktop.on('pageerror',e=>errors.push(e.message));
  desktop.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await desktop.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
  await desktop.goto(base,{waitUntil:'networkidle'});
  await desktop.waitForFunction(()=>window.__NEON_RACER__?.game);

  const opening=await desktop.evaluate(()=>{
    const text=document.getElementById('boot')?.innerText||'';
    const style=getComputedStyle(document.getElementById('qualityBadge'));
    return{
      title:document.title,
      manifesto:document.querySelector('.opening-manifesto')?.textContent||'',
      h1:document.querySelector('#boot h1')?.textContent||'',
      copy:document.querySelector('#boot .hero-copy')?.textContent||'',
      features:[...document.querySelectorAll('#boot .feature-row span')].map(x=>x.textContent),
      start:document.getElementById('startGame')?.textContent||'',
      text,
      qualityDisplay:style.display
    };
  });
  if(opening.h1!=='三蘆夜行'||opening.manifesto!=='AFTER RAIN · BEFORE DAWN')throw new Error(`Opening identity failed: ${JSON.stringify(opening)}`);
  if(opening.features.join('|')!=='河岸東環|霓虹西環|高架折返'||opening.start!=='進入夜行')throw new Error(`Opening route framing failed: ${JSON.stringify(opening)}`);
  if(/Raycast Vehicle|Gamepad|PB Ghost|Traffic Flow/.test(opening.text))throw new Error(`Engineering-demo language leaked into opening: ${opening.text}`);
  if(opening.qualityDisplay!=='none')throw new Error(`Quality badge should be hidden in player presentation: ${opening.qualityDisplay}`);

  await desktop.click('#startGame');
  await desktop.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await desktop.waitForTimeout(80);
  const intro=await desktop.evaluate(()=>({
    visible:document.getElementById('routeIntro')?.classList.contains('show'),
    kicker:document.getElementById('routeIntroKicker')?.textContent,
    name:document.getElementById('routeIntroName')?.textContent,
    style:document.getElementById('routeIntroStyle')?.textContent,
    calls:window.__NEON_RACER__.game.renderer.info.render.calls
  }));
  if(!intro.visible||intro.kicker!=='ROUTE 01 / 03'||intro.name!=='河岸東環'||!/高速長彎/.test(intro.style))throw new Error(`Route title card failed: ${JSON.stringify(intro)}`);
  if(intro.calls>60)throw new Error(`Presentation changed world render budget: ${intro.calls}`);
  await desktop.screenshot({path:'test-results/award-presentation/route-title-desktop.png',animations:'disabled'});

  const complete=await desktop.evaluate(()=>{
    const g=window.__NEON_RACER__.game;
    g.state='complete';
    g.hud.showComplete({
      rank:'S',score:9320,bestCombo:4.2,time:73,routeName:'河岸東環',
      records:{first:false,newScore:true,newTime:true,newCombo:false,bestScore:9320,bestTime:73,bestCombo:4.2,runs:4}
    });
    return{
      rank:document.getElementById('finalRank')?.textContent,
      route:document.getElementById('finalRoute')?.textContent,
      seal:document.getElementById('resultSeal')?.textContent,
      record:document.getElementById('finalRecord')?.textContent,
      newBest:document.getElementById('complete')?.dataset.newBest,
      rankState:document.getElementById('complete')?.dataset.rank,
      eyebrow:document.querySelector('#complete .eyebrow')?.textContent
    };
  });
  if(complete.rank!=='S'||complete.rankState!=='S'||complete.newBest!=='true')throw new Error(`Award result state failed: ${JSON.stringify(complete)}`);
  if(!/河岸東環 · S RANK/.test(complete.seal)||!/^NEW PERSONAL BEST/.test(complete.record)||complete.eyebrow!=='NIGHT RUN COMPLETE')throw new Error(`Award result hierarchy failed: ${JSON.stringify(complete)}`);
  await desktop.screenshot({path:'test-results/award-presentation/result-s-desktop.png',animations:'disabled'});
  await desktop.close();

  const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  await mobile.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
  await mobile.goto(base,{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>window.__NEON_RACER__?.game);
  const mobileOpening=await mobile.evaluate(()=>{
    const card=document.querySelector('#boot .hero-card')?.getBoundingClientRect();
    const start=document.getElementById('startGame')?.getBoundingClientRect();
    return{
      card:card&&{top:card.top,bottom:card.bottom,left:card.left,right:card.right,width:card.width,height:card.height},
      start:start&&{top:start.top,bottom:start.bottom,left:start.left,right:start.right},
      vw:innerWidth,vh:innerHeight
    };
  });
  if(!mobileOpening.card||mobileOpening.card.top<0||mobileOpening.card.bottom>mobileOpening.vh+1||mobileOpening.card.left<0||mobileOpening.card.right>mobileOpening.vw+1)throw new Error(`844x390 opening overflow: ${JSON.stringify(mobileOpening)}`);
  if(!mobileOpening.start||mobileOpening.start.top<0||mobileOpening.start.bottom>mobileOpening.vh+1)throw new Error(`844x390 start CTA not visible: ${JSON.stringify(mobileOpening)}`);

  await mobile.click('#startGame');
  await mobile.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await mobile.waitForTimeout(80);
  const mobileIntro=await mobile.evaluate(()=>{
    const box=document.getElementById('routeIntro')?.getBoundingClientRect();
    return{show:document.getElementById('routeIntro')?.classList.contains('show'),box:box&&{top:box.top,bottom:box.bottom,left:box.left,right:box.right},vw:innerWidth,vh:innerHeight};
  });
  if(!mobileIntro.show||!mobileIntro.box||mobileIntro.box.left<0||mobileIntro.box.right>mobileIntro.vw+1||mobileIntro.box.top<0||mobileIntro.box.bottom>mobileIntro.vh+1)throw new Error(`844x390 route title overflow: ${JSON.stringify(mobileIntro)}`);

  await mobile.evaluate(()=>{
    const g=window.__NEON_RACER__.game;g.state='complete';
    g.hud.showComplete({rank:'A',score:7100,bestCombo:3.2,time:86,routeName:'霓虹西環',records:{first:false,newScore:false,newTime:false,newCombo:false,bestScore:7600,bestTime:82,bestCombo:3.6,runs:5}});
  });
  const mobileResult=await mobile.evaluate(()=>{
    const card=document.querySelector('#complete .result-card')?.getBoundingClientRect();
    return{card:card&&{top:card.top,bottom:card.bottom,left:card.left,right:card.right,height:card.height},vw:innerWidth,vh:innerHeight,rank:document.getElementById('complete')?.dataset.rank};
  });
  if(mobileResult.rank!=='A'||!mobileResult.card||mobileResult.card.top<0||mobileResult.card.bottom>mobileResult.vh+1||mobileResult.card.left<0||mobileResult.card.right>mobileResult.vw+1)throw new Error(`844x390 award result overflow: ${JSON.stringify(mobileResult)}`);
  await mobile.screenshot({path:'test-results/award-presentation/result-mobile-844x390.png',animations:'disabled'});

  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Award Presentation PASS · opening identity · route title card · S/PB result ceremony · engineering labels removed · quality badge hidden · 844x390 clear · render calls <=60`);
  await mobile.close();
}finally{await browser.close()}
