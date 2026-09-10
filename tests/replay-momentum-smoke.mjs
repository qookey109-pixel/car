import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/replay-momentum',{recursive:true});
const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running'&&window.__NEON_RACER__.snapshot().audio?.initialized===true);

  const complete=async(preScore,bestCombo,elapsed,expectedRender)=>{
    await page.evaluate(({preScore,bestCombo,elapsed})=>{
      const g=window.__NEON_RACER__.game,c=g.challenges;
      c.challengeIndex=2;c._refreshMarkers();c.score=preScore;c.bestCombo=bestCombo;c.startedAt=performance.now()-elapsed*1000;
      const p=c.current.point;c._updateSpeed(c.current,{x:p.x,z:p.z},{speedKmh:120});
    },{preScore,bestCombo,elapsed});
    await page.waitForFunction(expected=>{const s=window.__NEON_RACER__.snapshot();return s.state==='complete'&&s.replay?.renderCount>=expected},expectedRender);
    return page.evaluate(()=>{
      const s=window.__NEON_RACER__.snapshot();
      return{state:s.state,routeName:s.routeName,records:s.records,replay:s.replay,rank:document.getElementById('finalRank')?.textContent||'',score:document.getElementById('finalScore')?.textContent||'',record:document.getElementById('finalRecord')?.textContent||'',recordNew:document.getElementById('finalRecord')?.classList.contains('new-best')||false,tour:document.getElementById('replayTour')?.textContent||'',target:document.getElementById('replayTarget')?.textContent||'',playAgain:document.getElementById('playAgain')?.textContent||'',pips:[...document.querySelectorAll('#replayPips i')].map(i=>({cleared:i.classList.contains('cleared'),next:i.classList.contains('next'),title:i.title}))};
    });
  };
  const replay=async expectedRoute=>{
    await page.click('#playAgain');
    await page.waitForFunction(route=>{const s=window.__NEON_RACER__.snapshot();return s.state==='running'&&s.routeName===route},expectedRoute);
  };

  const first=await complete(2750,2.2,92,1);
  if(first.routeName!=='河岸東環'||first.rank!=='B'||first.replay.profile!=='replay-momentum-v1'||first.replay.cleared!==1||first.replay.total!==3||first.replay.nextRoute!=='霓虹西環'||first.replay.nextRouteCleared!==false)throw new Error(`First replay state failed: ${JSON.stringify(first)}`);
  if(first.target!=='NEXT TARGET · NEW ROUTE · 霓虹西環'||first.playAgain!=='挑戰 霓虹西環 →'||first.tour!=='CITY TOUR · 1/3 ROUTES CLEARED')throw new Error(`First replay copy failed: ${JSON.stringify(first)}`);
  if(first.pips.length!==3||!first.pips[0].cleared||first.pips[0].next||first.pips[1].cleared||!first.pips[1].next)throw new Error(`First route pips failed: ${JSON.stringify(first.pips)}`);

  await replay('霓虹西環');
  const second=await complete(4750,3.0,86,2);
  if(second.routeName!=='霓虹西環'||second.rank!=='A'||second.replay.cleared!==2||second.replay.nextRoute!=='高架折返'||second.target!=='NEXT TARGET · NEW ROUTE · 高架折返'||second.playAgain!=='挑戰 高架折返 →')throw new Error(`Second replay state failed: ${JSON.stringify(second)}`);

  await replay('高架折返');
  const third=await complete(7250,4.0,80,3);
  if(third.routeName!=='高架折返'||third.rank!=='S'||third.replay.cleared!==3||third.replay.nextRoute!=='河岸東環'||third.replay.nextRouteCleared!==true)throw new Error(`City tour completion failed: ${JSON.stringify(third)}`);
  if(third.target!=='PB HUNT · NEW BEST SET · DEFEND S'||third.playAgain!=='挑戰 河岸東環 →'||third.tour!=='CITY TOUR · 3/3 ROUTES CLEARED'||!third.recordNew)throw new Error(`City tour completion copy failed: ${JSON.stringify(third)}`);
  if(third.pips.length!==3||third.pips.some(p=>!p.cleared)||!third.pips[0].next)throw new Error(`City tour pips failed: ${JSON.stringify(third.pips)}`);

  const layout=await page.evaluate(()=>{
    const rect=o=>{const r=o.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    const card=document.querySelector('#complete .result-card'),momentum=document.getElementById('replayMomentum'),primary=document.getElementById('playAgain'),menu=document.getElementById('completeMenu'),mobile=document.getElementById('mobileControls');
    return{card:rect(card),momentum:rect(momentum),primary:rect(primary),menu:rect(menu),mobileHidden:mobile.classList.contains('hidden'),scrollHeight:document.documentElement.scrollHeight,viewport:{w:innerWidth,h:innerHeight}};
  });
  if(layout.card.top<0||layout.card.bottom>390||layout.card.left<0||layout.card.right>844)throw new Error(`844x390 result card overflow: ${JSON.stringify(layout)}`);
  if(layout.momentum.top<layout.card.top||layout.momentum.bottom>layout.card.bottom||layout.primary.bottom>390||layout.menu.bottom>390||layout.momentum.bottom>Math.min(layout.primary.top,layout.menu.top)||!layout.mobileHidden)throw new Error(`844x390 replay layout collision: ${JSON.stringify(layout)}`);
  await page.screenshot({path:'test-results/replay-momentum/city-tour-complete-844x390.png'});

  await replay('河岸東環');
  const fourth=await complete(6850,3.5,84,4);
  if(fourth.rank!=='S'||fourth.replay.cleared!==3||fourth.replay.nextRoute!=='霓虹西環'||fourth.target!=='PB HUNT · SCORE +400 TO PB'||fourth.recordNew)throw new Error(`PB chase target failed: ${JSON.stringify(fourth)}`);
  if(fourth.records.runs!==4||fourth.records.bestScore!==9500||Number(fourth.records.bestCombo)!==4||fourth.records.routes?.['河岸東環']!==2||fourth.records.routes?.['霓虹西環']!==1||fourth.records.routes?.['高架折返']!==1)throw new Error(`Replay records persistence failed: ${JSON.stringify(fourth.records)}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Replay Momentum PASS · 3-route tour 1/3→2/3→3/3 · 河岸東環→霓虹西環→高架折返→河岸東環 · dynamic next-route CTA · S-rank PB hunt +400 · 844x390 result card clear`);
  await page.close();
}finally{await browser.close()}
