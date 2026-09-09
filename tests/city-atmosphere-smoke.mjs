import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,a=g.cityAtmosphere;
    g._render();
    const signalBefore=Array.from(a.redLights.instanceMatrix.array.slice(0,16));
    a.setSignalPhase(1);
    const signalAfter=Array.from(a.redLights.instanceMatrix.array.slice(0,16));
    const phase1={phase:a.signalPhase,red:a.redLights.count,green:a.greenLights.count,statsPhase:g.city.stats.trafficSignalPhase,matrixChanged:signalBefore.some((v,i)=>Math.abs(v-signalAfter[i])>1e-6)};
    a.setSignalPhase(0);

    const windows=a.facadeLights?.windows;
    const facadeBefore=windows?.instanceColor?Array.from(windows.instanceColor.array):[];
    a.setFacadeLightCycle(1);
    const facadeAfter=windows?.instanceColor?Array.from(windows.instanceColor.array):[];
    const facade={
      groups:a.facadeLightGroups,
      cycle:a.facadeLightCycle,
      statsCycle:g.city.stats.facadeLightCycle,
      interval:a.facadeLightIntervalMs,
      windows:a.facadeLights?.windows?.count||0,
      signs:a.facadeLights?.signs?.count||0,
      shops:a.facadeLights?.shops?.count||0,
      colorsChanged:facadeBefore.length===facadeAfter.length&&facadeBefore.some((v,i)=>Math.abs(v-facadeAfter[i])>1e-6)
    };
    a.setFacadeLightCycle(0);
    g._render();
    return{
      stats:{...g.city.stats},
      groups:{
        poles:a?.poles?.count||0,
        heads:a?.heads?.count||0,
        red:a?.redLights?.count||0,
        green:a?.greenLights?.count||0,
        renderGroups:a?.renderGroups||0
      },
      phase1,
      facade,
      renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles}
    };
  });
  if(result.stats.trafficSignals!==100)throw new Error(`Expected 100 traffic signals: ${JSON.stringify(result)}`);
  if(result.stats.atmosphereRenderGroups!==4||result.groups.renderGroups!==4)throw new Error(`Traffic signals must stay in four instanced render groups: ${JSON.stringify(result)}`);
  if(result.groups.poles!==100||result.groups.heads!==100||result.groups.red+result.groups.green!==100)throw new Error(`Traffic signal instance counts invalid: ${JSON.stringify(result.groups)}`);
  if(result.phase1.phase!==1||result.phase1.statsPhase!==1||result.phase1.red+result.phase1.green!==100||!result.phase1.matrixChanged)throw new Error(`Traffic signal phase did not switch in-place: ${JSON.stringify(result.phase1)}`);
  if(result.facade.groups!==3||result.stats.facadeLightGroups!==3)throw new Error(`Expected three existing facade light groups: ${JSON.stringify(result.facade)}`);
  if(result.facade.windows!==result.stats.windows||result.facade.signs!==result.stats.signs||result.facade.shops!==result.stats.shopfronts)throw new Error(`Facade mesh discovery mismatch: ${JSON.stringify(result.facade)}`);
  if(result.facade.cycle!==1||result.facade.statsCycle!==1||result.facade.interval!==1800||!result.facade.colorsChanged)throw new Error(`Facade light rhythm did not update instance colors in-place: ${JSON.stringify(result.facade)}`);
  if(result.renderer.calls>60||result.renderer.triangles>110000)throw new Error(`City atmosphere exceeded LOW render budget: ${JSON.stringify(result.renderer)}`);
  await page.screenshot({path:'test-results/city-atmosphere-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`City atmosphere PASS · ${result.stats.trafficSignals} signals · phase swap PASS · facade rhythm PASS · ${result.renderer.calls} calls · ${result.renderer.triangles} tris`);
}finally{
  await browser.close();
}
