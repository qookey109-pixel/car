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
  await page.waitForFunction(()=>window.__NEON_RACER__?.game?.effects);
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,e=g.effects,c=g.camera;
    // Freeze physics/gameplay while leaving the rendered game/HUD visible so the screenshot
    // is real visual evidence of the injected high-speed VFX state rather than the boot menu.
    g.state='paused';
    const inactiveHidden=[];
    for(let i=0;i<e.capacity;i++)inactiveHidden.push(e.positions[i*3+1]===-999);

    const particlePosition=e.points.geometry.attributes.position;
    const idleVersionBefore=particlePosition.version;
    e.update(1/60,{speedKmh:0,nitroActive:false,isDrifting:false},c);
    const idleVersionAfter=particlePosition.version;

    c.updateMatrixWorld(true);
    const lowVehicle={speedKmh:95,nitroActive:false,isDrifting:false};
    e.update(1/60,lowVehicle,c);
    const lowOpacity=e.speedLines.material.opacity;
    const first=Array.from(e.speedLinePositions);
    const q1={x:e.speedLines.quaternion.x,y:e.speedLines.quaternion.y,z:e.speedLines.quaternion.z,w:e.speedLines.quaternion.w};
    const cq={x:c.quaternion.x,y:c.quaternion.y,z:c.quaternion.z,w:c.quaternion.w};

    // At the same speed, streak anchors must remain laterally stable while depth advances.
    e.update(.12,lowVehicle,c);
    const sameSpeedSecond=Array.from(e.speedLinePositions);
    let stableXY=true,movedZ=false;
    for(let i=0;i<e.speedLineCount;i++){
      const o=i*6;
      if(Math.abs(first[o]-sameSpeedSecond[o])>1e-6||Math.abs(first[o+1]-sameSpeedSecond[o+1])>1e-6)stableXY=false;
      if(Math.abs(first[o+2]-sameSpeedSecond[o+2])>1e-4)movedZ=true;
    }
    const spreadOf=positions=>{
      let max=0;
      for(let i=0;i<e.speedLineCount;i++){
        const o=i*6;max=Math.max(max,Math.hypot(positions[o],positions[o+1]));
      }
      return max;
    };
    const lowSpread=spreadOf(sameSpeedSecond);

    // Higher speed may deliberately widen the streak field, but it must stay deterministic.
    e.update(.12,{speedKmh:165,nitroActive:false,isDrifting:false},c);
    const highOpacity=e.speedLines.material.opacity;
    const highSpeed=Array.from(e.speedLinePositions);
    const highSpread=spreadOf(highSpeed);

    const v={x:0,y:0,z:0};
    e.burst({x:0,y:1,z:0},v,.2,0xffd36e);
    const afterOrange=e.cursor;
    e.burst({x:0,y:1,z:0},v,.2,0x69f5ff);
    const afterCyan=e.cursor;
    const colors=e.points.geometry.attributes.color.array;
    const colorAt=i=>Array.from(colors.slice(i*3,i*3+3));
    const orange=colorAt(0),cyan=colorAt(afterOrange);
    const colorDistance=Math.hypot(orange[0]-cyan[0],orange[1]-cyan[1],orange[2]-cyan[2]);

    // Label the QA-only injected state so the screenshot is self-explanatory.
    const speedEl=document.getElementById('speed'),gearEl=document.getElementById('gear');
    if(speedEl)speedEl.textContent='165';
    if(gearEl)gearEl.textContent='5';
    g._render();
    return{
      inactiveHidden:inactiveHidden.every(Boolean),
      idleBufferStable:idleVersionAfter===idleVersionBefore,
      quaternionDelta:Math.hypot(q1.x-cq.x,q1.y-cq.y,q1.z-cq.z,q1.w-cq.w),
      stableXY,movedZ,lowOpacity,highOpacity,lowSpread,highSpread,
      colorDistance,spawned:{orange:afterOrange,cyan:afterCyan-afterOrange},
      lineDrawGroups:e.speedLines.type==='LineSegments'?1:0,
      screenshotState:{gameVisible:!document.getElementById('hud')?.classList.contains('hidden'),speedText:speedEl?.textContent||null},
      renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles}
    };
  });
  if(!result.inactiveHidden)throw new Error(`Inactive particles must start hidden: ${JSON.stringify(result)}`);
  if(!result.idleBufferStable)throw new Error(`Idle particle update must not upload the position buffer: ${JSON.stringify(result)}`);
  if(result.quaternionDelta>1e-5)throw new Error(`Speed flow must follow camera quaternion: ${JSON.stringify(result)}`);
  if(!result.stableXY||!result.movedZ)throw new Error(`Same-speed streaks must flow in depth without lateral flicker: ${JSON.stringify(result)}`);
  if(!(result.highOpacity>result.lowOpacity))throw new Error(`Speed streak opacity must ramp with speed: ${JSON.stringify(result)}`);
  if(!(result.highSpread>result.lowSpread))throw new Error(`High-speed streak field should widen smoothly: ${JSON.stringify(result)}`);
  if(result.colorDistance<.2)throw new Error(`Drift and nitro particles must retain distinct per-particle colors: ${JSON.stringify(result)}`);
  if(result.lineDrawGroups!==1)throw new Error(`Speed streaks must remain one LineSegments draw group: ${JSON.stringify(result)}`);
  if(!result.screenshotState.gameVisible||result.screenshotState.speedText!=='165')throw new Error(`VFX screenshot must show the in-game high-speed state: ${JSON.stringify(result.screenshotState)}`);
  if(result.renderer.calls>60||result.renderer.triangles>110000)throw new Error(`VFX polish exceeded LOW render budget: ${JSON.stringify(result.renderer)}`);
  await page.screenshot({path:'test-results/vfx-speed-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`VFX speed PASS · camera-local · idle upload skipped · opacity ${result.lowOpacity.toFixed(3)}→${result.highOpacity.toFixed(3)} · spread ${result.lowSpread.toFixed(2)}→${result.highSpread.toFixed(2)} · particle colors distinct · ${result.renderer.calls} calls`);
}finally{
  await browser.close();
}
