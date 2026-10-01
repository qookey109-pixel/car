import {testBrowser as chromium} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/award-presentation',{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.game?.awardPresentation);

  const pre=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game;
    g.renderer.info.reset();g._render();
    return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,snapshot:window.__NEON_RACER__.snapshot().awardPresentation};
  });
  if(pre.snapshot.profile!=='award-presentation-v1'||pre.snapshot.renderGroups!==0)throw new Error(`Award profile failed: ${JSON.stringify(pre.snapshot)}`);

  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const intro=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,p=g.awardPresentation;
    g.state='paused';g.renderer.info.reset();g._render();
    return{
      snapshot:p.snapshot(),
      kicker:p.root.querySelector('.award-route-kicker')?.textContent,
      title:p.root.querySelector('.award-route-title')?.textContent,
      style:p.root.querySelector('.award-route-style')?.textContent,
      line:p.root.querySelector('.award-route-line')?.textContent,
      calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles,
      completeZ:Number(getComputedStyle(document.getElementById('complete')).zIndex||0),
      presentationZ:Number(getComputedStyle(p.root).zIndex||0),
      pointer:getComputedStyle(p.root).pointerEvents,
      zIndex:Number(getComputedStyle(p.root).zIndex||0),
      audio:{routeStart:typeof g.audio.routeStart,finishStinger:typeof g.audio.finishStinger}
    };
  });
  if(!intro.snapshot.routeVisible||intro.snapshot.introCount<1||intro.title!=='河岸東環'||intro.style!=='高速長彎'||!intro.line.includes('夜色'))throw new Error(`Route intro failed: ${JSON.stringify(intro)}`);
  if(intro.pointer!=='none')throw new Error(`Presentation blocks input: ${intro.pointer}`);
  if(intro.zIndex<=50)throw new Error(`Presentation must sit above result screens: z-index ${intro.zIndex}`);
  if(intro.audio.routeStart!=='function'||intro.audio.finishStinger!=='function')throw new Error(`Award audio methods missing: ${JSON.stringify(intro.audio)}`);

  const routes=await page.evaluate(()=>{
    const p=window.__NEON_RACER__.game.awardPresentation,out=[];
    for(const item of [
      {name:'霓虹西環',style:'密集轉向',focus:'TECHNICAL'},
      {name:'高架折返',style:'煞車節奏',focus:'BRAKE FLOW'}
    ]){
      p.routeIntro(item);
      out.push({
        title:p.root.querySelector('.award-route-title').textContent,
        style:p.root.querySelector('.award-route-style').textContent,
        line:p.root.querySelector('.award-route-line').textContent
      });
    }
    return out;
  });
  if(routes[0].title!=='霓虹西環'||!routes[0].line.includes('街廓')||routes[1].title!=='高架折返'||!routes[1].line.includes('高架'))throw new Error(`Route identities failed: ${JSON.stringify(routes)}`);

  const finish=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,p=g.awardPresentation;
    document.getElementById('complete').classList.add('visible');
    p.finish({rank:'S',routeName:'河岸東環'},{first:false,newScore:true,newTime:true,newCombo:false});
    g.renderer.info.reset();g._render();
    return{
      snapshot:p.snapshot(),
      title:p.root.querySelector('.award-finish-title').textContent,
      route:p.root.querySelector('.award-finish-route').textContent,
      pb:p.root.querySelector('.award-finish-pb').textContent,
      fresh:p.root.querySelector('.award-finish-pb').dataset.fresh,
      calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles
    };
  });
  if(!finish.snapshot.finishVisible||finish.snapshot.finishCount!==1||finish.snapshot.lastRank!=='S'||!finish.snapshot.lastPB)throw new Error(`Finish state failed: ${JSON.stringify(finish.snapshot)}`);
  if(finish.title!=='NIGHT MASTERED'||!finish.route.includes('RANK S')||!finish.pb.includes('PERSONAL BEST')||finish.fresh!=='true')throw new Error(`Finish copy failed: ${JSON.stringify(finish)}`);
  if(finish.presentationZ<=finish.completeZ)throw new Error(`Finish climax hidden behind results: ${JSON.stringify({presentationZ:finish.presentationZ,completeZ:finish.completeZ})}`);
  if(finish.calls!==intro.calls||finish.triangles!==intro.triangles)throw new Error(`DOM presentation changed WebGL cost: ${JSON.stringify({intro:{calls:intro.calls,triangles:intro.triangles},finish:{calls:finish.calls,triangles:finish.triangles}})}`);

  const normal=await page.evaluate(()=>{
    const p=window.__NEON_RACER__.game.awardPresentation;
    p.finish({rank:'B',routeName:'霓虹西環'},{first:false,newScore:false,newTime:false,newCombo:false});
    return{
      title:p.root.querySelector('.award-finish-title').textContent,
      pb:p.root.querySelector('.award-finish-pb').textContent,
      fresh:p.root.querySelector('.award-finish-pb').dataset.fresh,
      snapshot:p.snapshot()
    };
  });
  if(normal.title!=='NIGHT RUN COMPLETE'||!normal.pb.includes('CHASE THE GHOST')||normal.fresh!=='false'||normal.snapshot.lastPB)throw new Error(`Non-PB finish failed: ${JSON.stringify(normal)}`);

  await page.screenshot({path:'test-results/award-presentation/award-finish-desktop.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Award Presentation PASS · route identities 3/3 · finish rank/PB states · pointer-events none · 0 WebGL draw-call delta (${finish.calls} calls)`);
}finally{await browser.close()}
