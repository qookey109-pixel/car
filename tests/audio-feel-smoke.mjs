import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/audio-feel',{recursive:true});
const finite=o=>Object.entries(o).filter(([,v])=>typeof v==='number').every(([,v])=>Number.isFinite(v));

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().audio?.initialized===true);

  const states=await page.evaluate(()=>{
    const api=window.__NEON_RACER__,g=api.game,a=g.audio,v=g.vehicle;
    a.update(0,0,false,0);const idle=a.snapshot();
    a.update(82,.72,false,0);const loaded=a.snapshot();
    const oldDrift=v.driftIntensity;v.driftIntensity=.88;a.update(92,.76,false);const drift=a.snapshot();v.driftIntensity=oldDrift;
    a.update(132,1,true,0);const nitro=a.snapshot();
    a.impact(.7);a.success();
    return{
      idle,loaded,drift,nitro,
      nodes:{limiter:Boolean(a.limiter),fundamental:Boolean(a.engineFundamental),harmonic:Boolean(a.engineHarmonic),sub:Boolean(a.engineSub),wind:Boolean(a.wind),skid:Boolean(a.skid),nitro:Boolean(a.nitroAir)},
      attached:a.vehicle===v
    };
  });

  if(!states.attached||Object.values(states.nodes).some(v=>!v))throw new Error(`Audio graph incomplete: ${JSON.stringify(states.nodes)}`);
  for(const [name,state] of Object.entries({idle:states.idle,loaded:states.loaded,drift:states.drift,nitro:states.nitro}))if(!finite(state))throw new Error(`Non-finite audio state ${name}: ${JSON.stringify(state)}`);
  if(!(states.loaded.engineHz>states.idle.engineHz+80&&states.loaded.engineGain>states.idle.engineGain))throw new Error(`Engine load response failed: ${JSON.stringify({idle:states.idle,loaded:states.loaded})}`);
  if(!(states.drift.skidGain>.04&&states.drift.drift>.8))throw new Error(`Drift/skid response failed: ${JSON.stringify(states.drift)}`);
  if(!(states.nitro.nitroGain>.05&&states.nitro.windGain>.02&&states.nitro.engineHz>states.loaded.engineHz))throw new Error(`Nitro/wind response failed: ${JSON.stringify(states.nitro)}`);
  if(!(states.idle.skidGain<.001&&states.idle.nitroGain<.001))throw new Error(`Idle noise floor too high: ${JSON.stringify(states.idle)}`);
  if(errors.length)throw new Error(errors.join('\n'));

  fs.writeFileSync('test-results/audio-feel/states.json',JSON.stringify(states,null,2));
  console.log(`Audio Feel PASS · engine ${states.idle.engineHz.toFixed(0)}→${states.loaded.engineHz.toFixed(0)} Hz · skid ${states.drift.skidGain.toFixed(3)} · nitro ${states.nitro.nitroGain.toFixed(3)}`);
  await page.close();
}finally{await browser.close()}
