import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('test-results',{recursive:true});

async function runDesktop(browser){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  const gl=await page.evaluate(()=>{const c=document.querySelector('canvas');return Boolean(c&&(c.getContext('webgl2')||c.getContext('webgl')))});
  if(!gl)throw new Error('WebGL context unavailable');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2600);
  await page.keyboard.up('KeyW');
  const driving=await page.evaluate(()=>{
    const api=window.__NEON_RACER__,s=api.snapshot(),g=api.game;
    return {s,camera:g.camera.position.toArray(),fov:g.camera.fov,challenge:g.challenges.current?.id};
  });
  if(!(driving.s.speedKmh>3))throw new Error(`Vehicle did not accelerate: ${driving.s.speedKmh} km/h`);
  if(!driving.camera.every(Number.isFinite)||!Number.isFinite(driving.fov))throw new Error(`Camera became non-finite: ${JSON.stringify(driving)}`);
  if(driving.challenge!=='sprint')throw new Error(`Unexpected initial challenge ${driving.challenge}`);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='paused');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(250);
  const reset=await page.evaluate(()=>window.__NEON_RACER__.snapshot());
  if(Math.abs(reset.position.z-24)>3||Math.abs(reset.position.x)>3)throw new Error(`Reset position unexpected: ${JSON.stringify(reset.position)}`);
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  if(errors.length)throw new Error(errors.join('\n'));
  await page.close();
  return driving.s;
}

async function runMobile(browser){
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const gas=page.locator('[data-control="gas"]'),drift=page.locator('[data-control="drift"]');
  await gas.dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch',isPrimary:true});
  await drift.dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch',isPrimary:false});
  await page.waitForTimeout(350);
  const simultaneous=await page.evaluate(()=>({gas:window.__NEON_RACER__.game.input.touch.gas,drift:window.__NEON_RACER__.game.input.touch.drift}));
  if(!simultaneous.gas||!simultaneous.drift)throw new Error(`Simultaneous mobile touch failed: ${JSON.stringify(simultaneous)}`);
  await gas.dispatchEvent('pointerup',{pointerId:11,pointerType:'touch'});
  await drift.dispatchEvent('pointerup',{pointerId:12,pointerType:'touch'});
  await page.waitForTimeout(150);
  await page.screenshot({path:'test-results/mobile-844x390.png',fullPage:true});
  if(errors.length)throw new Error(errors.join('\n'));
  await page.close();
}

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const desktop=await runDesktop(browser);
  await runMobile(browser);
  console.log(`V0.8.0 browser smoke PASS · speed ${desktop.speedKmh.toFixed(1)} km/h · score ${desktop.score}`);
}finally{await browser.close()}
