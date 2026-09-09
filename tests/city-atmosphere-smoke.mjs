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
    return{
      stats:{...g.city.stats},
      groups:{
        poles:a?.poles?.count||0,
        heads:a?.heads?.count||0,
        red:a?.redLights?.count||0,
        green:a?.greenLights?.count||0,
        renderGroups:a?.renderGroups||0
      },
      renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles}
    };
  });
  if(result.stats.trafficSignals!==100)throw new Error(`Expected 100 traffic signals: ${JSON.stringify(result)}`);
  if(result.stats.atmosphereRenderGroups!==4||result.groups.renderGroups!==4)throw new Error(`Traffic signals must stay in four instanced render groups: ${JSON.stringify(result)}`);
  if(result.groups.poles!==100||result.groups.heads!==100||result.groups.red+result.groups.green!==100)throw new Error(`Traffic signal instance counts invalid: ${JSON.stringify(result.groups)}`);
  if(result.renderer.calls>60||result.renderer.triangles>110000)throw new Error(`City atmosphere exceeded LOW render budget: ${JSON.stringify(result.renderer)}`);
  await page.screenshot({path:'test-results/city-atmosphere-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`City atmosphere PASS · ${result.stats.trafficSignals} signals · ${result.renderer.calls} calls · ${result.renderer.triangles} tris`);
}finally{
  await browser.close();
}
