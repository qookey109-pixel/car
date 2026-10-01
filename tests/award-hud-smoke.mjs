import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/award-hud',{recursive:true});

const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().state==='running');

  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game;
    const q=s=>document.querySelector(s);
    const rect=s=>{const r=q(s).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    g.renderer.info.reset();g._render();
    return{
      calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles,
      hud:rect('#hud'),
      objective:rect('.hud-top-left'),
      speed:rect('.speed-panel'),
      score:rect('.score-panel'),
      quality:rect('.quality-badge'),
      objectiveStyle:getComputedStyle(q('.hud-top-left')),
      qualityStyle:getComputedStyle(q('.quality-badge')),
      speedStyle:getComputedStyle(q('#speed'))
    };
  });

  if(result.objective.right>844||result.speed.right>844||result.score.left<0)throw new Error(`HUD overflow: ${JSON.stringify(result)}`);
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  if(overlap(result.objective,result.speed))throw new Error(`Objective/speed overlap: ${JSON.stringify(result)}`);
  if(Number(result.qualityStyle.opacity)>.25)throw new Error(`Quality badge not visually de-emphasized: ${result.qualityStyle.opacity}`);
  if(parseFloat(result.speedStyle.fontSize)<32)throw new Error(`Speed hierarchy too weak: ${result.speedStyle.fontSize}`);
  if(result.calls>60||result.triangles>110000)throw new Error(`HUD polish affected render budget: ${JSON.stringify({calls:result.calls,triangles:result.triangles})}`);
  await page.screenshot({path:'test-results/award-hud/award-hud-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Award HUD PASS · 844x390 hierarchy clear · quality badge opacity ${result.qualityStyle.opacity} · speed ${result.speedStyle.fontSize} · WebGL ${result.calls} calls / ${Math.round(result.triangles)} tris`);
}finally{await browser.close()}
