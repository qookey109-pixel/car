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
      const n=window.__NEON_RACER__,g=n.game,c=g.challenges,h=g.hud;
      g.state='paused';
      const routes=JSON.stringify(c.routes),score=c.score,combo=c.combo,staticBodies=g.city.staticBodies.length,occluders=g.city.cameraOccluders.length;
      const labels=[];
      for(const [x,z] of [[0,24],[0,120],[120,120],[0,24]]){h.updateDistrict({x,z},c.targetDistrict);labels.push(h.district)}

      c._applyRoute(0);c.challengeIndex=0;c.sprintIndex=0;
      const shared=c.navigationTarget,compassTarget=n.compass._target();
      h.navigationTargetKey=null;h.navigationDistance=null;h.navigationTrend=null;
      h.updateDistrict({x:0,z:80},c.targetDistrict,shared);
      const steady={distance:h.navigationDistance,trend:h.navigationTrend,text:h.districtTarget.textContent,state:h.districtTarget.dataset.state};
      h.updateDistrict({x:0,z:60},c.targetDistrict,shared);
      const approaching={distance:h.navigationDistance,trend:h.navigationTrend,text:h.districtTarget.textContent,state:h.districtTarget.dataset.state};
      h.updateDistrict({x:0,z:90},c.targetDistrict,shared);
      const receding={distance:h.navigationDistance,trend:h.navigationTrend,text:h.districtTarget.textContent,state:h.districtTarget.dataset.state};
      h.updateDistrict({x:0,z:8},c.targetDistrict,shared);
      const targetArrived={distance:h.navigationDistance,trend:h.navigationTrend,text:h.districtTarget.textContent,state:h.districtTarget.dataset.state};

      c.challengeIndex=1;
      const driftTarget=c.navigationTarget;
      h.navigationTargetKey=null;h.navigationDistance=null;h.navigationTrend=null;
      h.updateDistrict({x:-120,z:-200},c.targetDistrict,driftTarget);
      const driftOutside={distance:h.navigationDistance,trend:h.navigationTrend,text:h.districtTarget.textContent};
      h.updateDistrict({x:-120,z:-191},c.targetDistrict,driftTarget);
      const driftInside={distance:h.navigationDistance,trend:h.navigationTrend,text:h.districtTarget.textContent};

      const metadata=[];
      for(let i=0;i<3;i++){
        c._applyRoute(i);c.challengeIndex=0;
        const checkpoints=[];
        for(let j=0;j<4;j++){
          c.sprintIndex=j;const target=c.navigationTarget;h.update(g.vehicle,c);
          checkpoints.push({district:c.targetDistrict,kind:target.kind,radius:target.arrivalRadius,key:target.key,x:target.x,z:target.z});
        }
        c.challengeIndex=1;const drift={district:c.targetDistrict,...c.navigationTarget};
        c.challengeIndex=2;const speed={district:c.targetDistrict,...c.navigationTarget};
        metadata.push({checkpoints,drift,speed});
      }
      c.challengeIndex=3;h.update(g.vehicle,c);
      const cleared=h.districtTarget.textContent===''&&!h.districtTarget.dataset.state&&!h.districtTarget.dataset.district&&!h.districtTarget.dataset.trend&&!h.districtTarget.dataset.distance&&h.navigationDistance===null&&h.navigationTrend===null;
      const unchanged=routes===JSON.stringify(c.routes)&&score===c.score&&combo===c.combo&&staticBodies===g.city.staticBodies.length&&occluders===g.city.cameraOccluders.length;
      g.restart();h.update(g.vehicle,c);
      const snapshot=n.snapshot().district;
      return{profile:snapshot.profile,labels,shared,compassTarget,steady,approaching,receding,targetArrived,driftOutside,driftInside,metadata,cleared,unchanged,current:h.district,target:c.targetDistrict,snapshotObjective:snapshot.objective};
    });
    assert.equal(result.profile,'district-awareness-v3');
    assert.deepEqual(result.labels,['core','avenue','edge','core']);
    assert.deepEqual({kind:result.shared.kind,label:result.shared.label,x:result.shared.x,z:result.shared.z},{kind:'sprint',label:'CHECKPOINT 1/4',x:0,z:0});
    assert.equal(result.shared.arrivalRadius,9);assert.deepEqual(result.compassTarget,{kind:'sprint',label:'CHECKPOINT 1/4',x:0,z:0});
    assert.ok(Math.abs(result.steady.distance-71)<.01&&result.steady.trend==='steady'&&result.steady.state==='travel'&&result.steady.text.includes('目標 71m')&&result.steady.text.includes('穩定'),JSON.stringify(result.steady));
    assert.ok(Math.abs(result.approaching.distance-51)<.01&&result.approaching.trend==='approaching'&&result.approaching.text.includes('接近'),JSON.stringify(result.approaching));
    assert.ok(Math.abs(result.receding.distance-81)<.01&&result.receding.trend==='receding'&&result.receding.text.includes('遠離'),JSON.stringify(result.receding));
    assert.ok(result.targetArrived.distance===0&&result.targetArrived.trend==='arrived'&&result.targetArrived.state==='arrived'&&result.targetArrived.text.includes('目標 0m')&&result.targetArrived.text.includes('抵達'),JSON.stringify(result.targetArrived));
    assert.ok(Math.abs(result.driftOutside.distance-8)<.01&&result.driftOutside.text.includes('目標 8m'),JSON.stringify(result.driftOutside));
    assert.ok(result.driftInside.distance===0&&result.driftInside.trend==='arrived'&&result.driftInside.text.includes('抵達'),JSON.stringify(result.driftInside));
    for(const [i,r] of result.metadata.entries()){
      assert.deepEqual(r.checkpoints.map(x=>x.district),['core','avenue','edge','avenue']);
      assert.ok(r.checkpoints.every((x,j)=>x.kind==='sprint'&&x.radius===9&&x.key===`${i}:sprint:${j}`));
      assert.equal(r.drift.district,'edge');assert.equal(r.drift.kind,'drift');assert.equal(r.drift.arrivalRadius,72);assert.equal(r.drift.key,`${i}:drift`);
      assert.equal(r.speed.district,'avenue');assert.equal(r.speed.kind,'speed');assert.equal(r.speed.arrivalRadius,10);assert.equal(r.speed.key,`${i}:speed`);
    }
    assert.ok(result.cleared&&result.unchanged);assert.equal(result.current,'core');assert.equal(result.target,'core');
    assert.equal(result.snapshotObjective.trend,'steady');assert.ok(Math.abs(result.snapshotObjective.distance-15)<.01,JSON.stringify(result.snapshotObjective));
    await page.keyboard.press('Escape');assert.equal(await page.locator('#pause').evaluate(e=>e.classList.contains('visible')),true);
    await page.click('#resumeGame');
    const layout=await page.evaluate(()=>{
      const g=window.__NEON_RACER__.game,h=g.hud,c=g.challenges,target=document.getElementById('districtTarget');
      h.navigationTargetKey=null;h.navigationDistance=null;h.navigationTrend=null;
      h.updateDistrict({x:0,z:24},'edge',{key:'layout-worst',kind:'speed',x:160,z:160,arrivalRadius:10});
      const worstLines=Math.round(target.getBoundingClientRect().height/parseFloat(getComputedStyle(target).lineHeight));
      h.update(g.vehicle,c);
      const panel=document.querySelector('.hud-top-left').getBoundingClientRect(),speed=document.querySelector('.speed-panel').getBoundingClientRect();
      const label=document.getElementById('districtLabel');
      return{inside:panel.bottom<innerHeight/2&&panel.right<speed.left,labelFits:label.scrollWidth<=label.clientWidth,targetFits:target.scrollWidth<=target.clientWidth,worstLines};
    });
    assert.ok(layout.inside&&layout.labelFits&&layout.targetFits&&layout.worstLines===1,JSON.stringify(layout));
    await page.screenshot({path:`test-results/district-awareness-${viewport.width}x${viewport.height}.png`});
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log('District awareness v3 PASS · shared target / compact distance trend / drift edge / single-line worst-case / all 3 routes / desktop + 844×390');
}finally{await browser.close()}
