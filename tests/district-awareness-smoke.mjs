import assert from 'node:assert/strict';
import fs from 'node:fs';
import {testBrowser} from './browser-engine.mjs';
import {districtFor,observedDistrict} from '../src/world/DistrictMap.js';

assert.equal(districtFor(72,-72),'core');
assert.equal(districtFor(32,180),'avenue');
assert.equal(districtFor(120,-120),'edge');
for(const [x,z,previous,expected] of [[74,0,'core','core'],[77,0,'core','avenue'],[70,0,'avenue','avenue'],[67,0,'avenue','core'],[34,120,'avenue','avenue'],[37,120,'avenue','edge'],[30,120,'edge','edge'],[27,120,'edge','avenue'],[120,120,'core','edge'],[0,24,'edge','core']])assert.equal(observedDistrict(x,z,previous),expected);

fs.mkdirSync('test-results',{recursive:true});
const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
  for(const viewport of [{width:1440,height:900},{width:844,height:390}]){
    const page=await browser.newPage({viewport,isMobile:viewport.width===844,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    await page.click('#startGame');await page.waitForFunction(()=>window.__NEON_RACER__?.game.state==='running');
    const result=await page.evaluate(()=>{
      const g=window.__NEON_RACER__.game,c=g.challenges,h=g.hud;
      g.state='paused';
      const routes=JSON.stringify(c.routes),score=c.score,combo=c.combo,staticBodies=g.city.staticBodies.length,occluders=g.city.cameraOccluders.length;
      const labels=[];
      for(const [x,z] of [[0,24],[0,120],[120,120],[0,24]]){h.updateDistrict({x,z},c.targetDistrict);labels.push(h.district)}
      const metadata=[];
      for(let i=0;i<3;i++){
        c._applyRoute(i);c.challengeIndex=0;
        const checkpoints=[];
        for(let j=0;j<4;j++){c.sprintIndex=j;h.update(g.vehicle,c);checkpoints.push(c.targetDistrict)}
        c.challengeIndex=1;const drift=c.targetDistrict;
        c.challengeIndex=2;const speed=c.targetDistrict;
        metadata.push({checkpoints,drift,speed});
      }
      c.challengeIndex=3;h.update(g.vehicle,c);const cleared=h.districtTarget.textContent==='';
      const unchanged=routes===JSON.stringify(c.routes)&&score===c.score&&combo===c.combo&&staticBodies===g.city.staticBodies.length&&occluders===g.city.cameraOccluders.length;
      g.restart();h.update(g.vehicle,c);
      return{labels,metadata,cleared,unchanged,current:h.district,target:c.targetDistrict};
    });
    assert.deepEqual(result.labels,['core','avenue','edge','core']);
    for(const r of result.metadata)assert.deepEqual(r,{checkpoints:['core','avenue','edge','avenue'],drift:'edge',speed:'avenue'});
    assert.ok(result.cleared&&result.unchanged);assert.equal(result.current,'core');assert.equal(result.target,'core');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#pause').evaluate(e=>e.classList.contains('visible')),true);
    await page.click('#resumeGame');
    const layout=await page.evaluate(()=>{
      const panel=document.querySelector('.hud-top-left').getBoundingClientRect(),speed=document.querySelector('.speed-panel').getBoundingClientRect();
      const label=document.getElementById('districtLabel'),target=document.getElementById('districtTarget');
      return{inside:panel.bottom<innerHeight/2&&panel.right<speed.left,labelFits:label.scrollWidth<=label.clientWidth,targetFits:target.scrollWidth<=target.clientWidth};
    });
    assert.ok(layout.inside&&layout.labelFits&&layout.targetFits,JSON.stringify(layout));
    await page.screenshot({path:`test-results/district-awareness-${viewport.width}x${viewport.height}.png`});
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log('District awareness PASS · boundaries / hysteresis / all 3 routes / completion / restart / pause-resume / desktop + 844×390');
}finally{await browser.close()}
