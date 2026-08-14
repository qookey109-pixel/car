import { chromium } from 'playwright';

const BASE='http://127.0.0.1:8013/experiments/real-world-raycast-v0.7.4-sanchong-luzhou-urban-polish/?fixture=1';
const browser=await chromium.launch({headless:true});
const errors=[];
const track=page=>{page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)))};

const context=await browser.newContext({viewport:{width:1280,height:720}});
const page=await context.newPage();track(page);
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000});
await page.waitForFunction(()=>window.__URBAN_POLISH__?.snapshot().worldUrbanPolishReady===true,null,{timeout:30000});
await page.waitForFunction(()=>window.__URBAN_POLISH__.snapshot().grounded>=3,null,{timeout:10000});
await page.waitForTimeout(700);
let s=await page.evaluate(()=>window.__URBAN_POLISH__.snapshot());

if(s.visualVersion!=='LowPolySportCoupeV5')throw new Error(`wrong car ${s.visualVersion}`);
if(s.worldRiverPerformanceVersion!=='SanchongLuzhouRiverPerformanceV0722')throw new Error(`V0722 contract changed ${s.worldRiverPerformanceVersion}`);
if(s.worldUrbanIdentityVersion!=='SanchongLuzhouTaiwanUrbanIdentityV073')throw new Error(`V073 contract changed ${s.worldUrbanIdentityVersion}`);
if(s.worldUrbanPolishVersion!=='SanchongLuzhouUrbanPolishV074')throw new Error(`wrong polish version ${s.worldUrbanPolishVersion}`);
if(s.worldUrbanPolishSource!=='derived-city-v073')throw new Error(`wrong polish source ${s.worldUrbanPolishSource}`);

const c=s.worldUrbanPolishCounts||{},own=s.worldUrbanPolishOwnCounts||{},budget=s.worldUrbanPolishRenderStats?.budget||{};
for(const k of ['windows','balconies','awnings','shopfronts','signs','acUnits','rooftopTanks','arcadeColumns','busStops','facadePanels','parapets'])if(!(c[k]>0))throw new Error(`missing urban polish ${k}=${c[k]}`);
for(const k of ['facadePanels','shopfronts','canopies','arcadeColumns','horizontalSigns','lightboxes','parapets','busStops','windowMullions','arcadeBeams'])if((own[k]||0)>(budget[k]||0))throw new Error(`polish budget exceeded ${k}=${own[k]}/${budget[k]}`);
if(!(s.worldUrbanPolishDrawMeshes>0&&s.worldUrbanPolishDrawMeshes<=14))throw new Error(`polish draw mesh budget ${s.worldUrbanPolishDrawMeshes}`);
if(s.wheels!==4||s.grounded<3)throw new Error(`wheel contact ${s.grounded}/${s.wheels}`);
const title=await page.locator('#hud h1').innerText();if(!title.includes('V0.7.4'))throw new Error(`wrong HUD ${title}`);
if(!(await page.locator('#polish').isVisible()))throw new Error('polish chip missing');

await page.keyboard.down('KeyW');let reached20=false;
for(let i=0;i<40;i++){await page.waitForTimeout(125);s=await page.evaluate(()=>window.__URBAN_POLISH__.snapshot());if(s.speedKmh>=20){reached20=true;break}}
if(!reached20){await page.keyboard.up('KeyW');throw new Error(`failed acceleration ${s.speedKmh}`)}
await page.keyboard.down('KeyA');await page.keyboard.down('Space');let drifted=false;
for(let i=0;i<18;i++){await page.waitForTimeout(120);s=await page.evaluate(()=>window.__URBAN_POLISH__.snapshot());if(s.driftState==='DRIFT'){drifted=true;break}}
await page.keyboard.up('Space');await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');
if(!drifted)throw new Error(`DRIFT regression ${JSON.stringify({speed:s.speedKmh,slip:s.slipDeg,state:s.driftState})}`);
await context.close();

const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const mp=await mobile.newPage();track(mp);
await mp.goto(BASE,{waitUntil:'networkidle',timeout:60000});
await mp.waitForFunction(()=>window.__URBAN_POLISH__?.snapshot().worldUrbanPolishReady===true,null,{timeout:30000});
await mp.waitForFunction(()=>window.__URBAN_POLISH__.snapshot().grounded>=3,null,{timeout:10000});
const gas=await mp.locator('[data-action="gas"]').boundingBox(),left=await mp.locator('[data-action="left"]').boundingBox();
if(!gas||!left)throw new Error('mobile controls missing');
const cdp=await mobile.newCDPSession(mp);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:left.x+left.width/2,y:left.y+left.height/2,id:1,radiusX:8,radiusY:8,force:1},{x:gas.x+gas.width/2,y:gas.y+gas.height/2,id:2,radiusX:8,radiusY:8,force:1}]});
await mp.waitForTimeout(1200);
const ms=await mp.evaluate(()=>window.__URBAN_POLISH__.snapshot());
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
if(ms.speedKmh<=0||ms.grounded<2||!ms.worldUrbanPolishReady)throw new Error(`mobile V074 unstable ${JSON.stringify(ms)}`);
if(ms.worldUrbanPolishVersion!=='SanchongLuzhouUrbanPolishV074')throw new Error('mobile polish contract lost');
await mobile.close();

if(errors.length)throw new Error(errors.join(' | '));
console.log(JSON.stringify({desktop:s,mobile:ms,counts:c,ownCounts:own,drawMeshes:s.worldUrbanPolishDrawMeshes},null,2));
await browser.close();
