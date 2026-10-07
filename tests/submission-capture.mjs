import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const root='test-results/submission-package';
const frames=`${root}/frames`;
fs.mkdirSync(frames,{recursive:true});
fs.mkdirSync(`${root}/video`,{recursive:true});

const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({
  viewport:{width:1440,height:810},
  recordVideo:{dir:`${root}/video-raw`,size:{width:1280,height:720}}
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.addInitScript(()=>{
  try{
    localStorage.removeItem('neon-racer-records');
    localStorage.removeItem('neon-racer-ghosts-v1');
  }catch{}
});

await page.goto(base,{waitUntil:'networkidle'});
await page.screenshot({path:`${frames}/01-title-screen.png`,animations:'disabled'});

await page.click('#startGame');
await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().state==='running');
await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().awardPresentation?.routeVisible===true);
await page.evaluate(()=>{const g=window.__NEON_RACER__.game;for(let i=0;i<45;i++)g._camera(1/60);g.cityAtmosphere.setRouteSignature('河岸東環');g.awardPresentation.routeIntro({name:'河岸東環',style:'高速長彎',focus:'HIGH SPEED'})});
await page.waitForTimeout(480);
await page.screenshot({path:`${frames}/02-route-river.png`});

await page.evaluate(()=>{const g=window.__NEON_RACER__.game;g.cityAtmosphere.setRouteSignature('霓虹西環');g.awardPresentation.routeIntro({name:'霓虹西環',style:'密集轉向',focus:'TECHNICAL'});g._render()});
await page.waitForTimeout(220);
await page.screenshot({path:`${frames}/03-route-neon.png`,animations:'disabled'});

await page.evaluate(()=>{const g=window.__NEON_RACER__.game;g.cityAtmosphere.setRouteSignature('高架折返');g.awardPresentation.routeIntro({name:'高架折返',style:'煞車節奏',focus:'BRAKE FLOW'});g._render()});
await page.waitForTimeout(220);
await page.screenshot({path:`${frames}/04-route-viaduct.png`,animations:'disabled'});

await page.evaluate(()=>{
  const g=window.__NEON_RACER__.game;
  g.cityAtmosphere.setRouteSignature('河岸東環');
  // The onboarding frame must show GO, not the preceding route-intro card.
  g.awardPresentation.hide();
  const p=g.firstRunDirector;
  p.active=true;p.completed=false;p.firstCheckpoint=false;
  p._show('launch',5000);
});
await page.waitForFunction(()=>{
  const g=window.__NEON_RACER__?.game;
  return g?.firstRunDirector?.cue?.classList?.contains('show')
    && !g?.awardPresentation?.routeCard?.classList?.contains('show')
    && !document.body.classList.contains('award-route-active');
});
await page.waitForTimeout(280);
await page.screenshot({path:`${frames}/05-first-30-seconds.png`,animations:'disabled'});

await page.keyboard.down('w');
await page.waitForTimeout(4200);
await page.keyboard.down('Shift');
await page.waitForTimeout(1800);
await page.keyboard.up('Shift');
await page.screenshot({path:`${frames}/06-speed-city.png`,animations:'disabled'});

await page.keyboard.down('d');
await page.waitForTimeout(1300);
await page.keyboard.up('d');
await page.keyboard.down('a');
await page.keyboard.down(' ');
await page.waitForTimeout(1300);
await page.keyboard.up(' ');
await page.keyboard.up('a');
await page.waitForTimeout(1400);

await page.evaluate(()=>{
  const g=window.__NEON_RACER__.game,gr=g.ghostReplay;
  g.vehicle.reset({x:0,y:1.2,z:24},0);
  g.vehicle._syncVisuals();
  gr.routeName=g.challenges.routeName;
  gr.recording=[
    {t:0,x:0,y:1.2,z:14,yaw:0},
    {t:1,x:0,y:1.2,z:6,yaw:0},
    {t:2,x:0,y:1.2,z:-2,yaw:0}
  ];
  gr.finish({routeName:g.challenges.routeName,time:3},true);
  gr.start(g.challenges.routeName);
  gr.startedAt=performance.now()-900;
  gr.update();
  g.state='paused';
  g.camera.position.set(4.8,5.2,35);
  g.camera.lookAt(0,1.15,6);
  g._render();
});
await page.waitForTimeout(120);
await page.screenshot({path:`${frames}/07-ghost-pursuit.png`,animations:'disabled'});
await page.evaluate(()=>{window.__NEON_RACER__.game.state='running'});

await page.keyboard.down('Shift');
await page.waitForTimeout(2200);
await page.keyboard.up('Shift');
await page.keyboard.down('d');
await page.waitForTimeout(1400);
await page.keyboard.up('d');
await page.waitForTimeout(2200);
await page.keyboard.down('a');
await page.waitForTimeout(1400);
await page.keyboard.up('a');
await page.keyboard.down('Shift');
await page.waitForTimeout(2300);
await page.keyboard.up('Shift');
await page.waitForTimeout(1800);
await page.keyboard.up('w');

await page.evaluate(()=>{
  const g=window.__NEON_RACER__.game;
  g.vehicle.reset({x:0,y:1.2,z:24},0);
  g.vehicle._syncVisuals();
  for(let i=0;i<75;i++)g._camera(1/60);
  g.ghostReplay?.hide();
  g.awardPresentation.finish(
    {rank:'S',routeName:g.challenges.routeName},
    {first:false,newScore:true,newTime:true,newCombo:true}
  );
});
await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().awardPresentation?.finishVisible===true);
await page.waitForTimeout(520);
await page.screenshot({path:`${frames}/08-finish-climax.png`});
await page.waitForTimeout(2400);

const render=await page.evaluate(()=>{
  const g=window.__NEON_RACER__.game;
  g.renderer.info.reset();g._render();
  return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
});
if(render.calls>60||render.triangles>110000)throw new Error(`Submission capture exceeded render budget: ${JSON.stringify(render)}`);

const video=page.video();
await context.close();
if(video)await video.saveAs(`${root}/video/gameplay-showcase.webm`);

const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const mobilePage=await mobile.newPage();
await mobilePage.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
await mobilePage.goto(base,{waitUntil:'networkidle'});
await mobilePage.click('#startGame');
await mobilePage.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().state==='running');
await mobilePage.evaluate(()=>{const p=window.__NEON_RACER__.game.firstRunDirector;p.active=true;p.completed=false;p.firstCheckpoint=false;p._show('launch',5000)});
await mobilePage.waitForFunction(()=>window.__NEON_RACER__?.game?.firstRunDirector?.cue?.classList?.contains('show'));
await mobilePage.screenshot({path:`${frames}/09-mobile-844x390.png`,animations:'disabled'});
await mobile.close();

if(errors.length)throw new Error(errors.join('\n'));
const files=fs.readdirSync(frames).sort();
if(files.length!==9)throw new Error(`Expected 9 submission frames, got ${files.length}: ${files.join(', ')}`);
if(!fs.existsSync(`${root}/video/gameplay-showcase.webm`))throw new Error('Gameplay showcase video missing');
console.log(`Submission Capture PASS · ${files.length} frames · gameplay-showcase.webm · ${render.calls} calls / ${Math.round(render.triangles)} tris`);
await browser.close();
