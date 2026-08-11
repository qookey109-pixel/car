import { chromium } from 'playwright';

const BASE='http://127.0.0.1:8013/experiments/real-world-raycast-v0.7.1-sanchong-luzhou-streetscape/';
const ORIGIN={lat:25.0731,lon:121.4810};
const browser=await chromium.launch({headless:true});
const errors=[];

function roadWays(){
  return[
    {type:'way',id:1,tags:{highway:'primary',lanes:'4'},geometry:[{lat:25.0647,lon:121.4810},{lat:25.0816,lon:121.4810}]},
    {type:'way',id:2,tags:{highway:'secondary',lanes:'4'},geometry:[{lat:25.0731,lon:121.4705},{lat:25.0731,lon:121.4915}]},
    {type:'way',id:3,tags:{highway:'tertiary',lanes:'2'},geometry:[{lat:25.0668,lon:121.4740},{lat:25.0796,lon:121.4882}]},
    {type:'way',id:4,tags:{highway:'residential',lanes:'2'},geometry:[{lat:25.0672,lon:121.4870},{lat:25.0790,lon:121.4754}]}
  ];
}
function buildingWays(){
  const out=[];let id=1000;
  const latStep=.00082,lonStep=.00092;
  for(let gx=-7;gx<=7;gx++)for(let gz=-6;gz<=6;gz++){
    if(Math.abs(gx)<=1||Math.abs(gz)<=1)continue;
    const lat=ORIGIN.lat+gz*latStep,lon=ORIGIN.lon+gx*lonStep,w=.00015+(Math.abs(gx)%3)*.00002,d=.00014+(Math.abs(gz)%3)*.00002;
    out.push({type:'way',id:id++,tags:{building:'residential','building:levels':String(3+(id%7))},geometry:[
      {lat:lat-d,lon:lon-w},{lat:lat-d,lon:lon+w},{lat:lat+d,lon:lon+w},{lat:lat+d,lon:lon-w},{lat:lat-d,lon:lon-w}
    ]});
  }
  return out;
}
function signalNodes(){return[
  {type:'node',id:8001,lat:25.0731,lon:121.4810,tags:{highway:'traffic_signals'}},
  {type:'node',id:8002,lat:25.0710,lon:121.4787,tags:{highway:'traffic_signals'}},
  {type:'node',id:8003,lat:25.0750,lon:121.4831,tags:{highway:'traffic_signals'}},
  {type:'node',id:8004,lat:25.0768,lon:121.4774,tags:{highway:'traffic_signals'}}
]}

const context=await browser.newContext({viewport:{width:1280,height:720}});
await context.route(/https:\/\/overpass-(api\.de|kumi\.systems)\/api\/interpreter/,async route=>{
  const body=route.request().postData()||'',params=new URLSearchParams(body),q=params.get('data')||'';
  let elements;
  if(q.includes('way["building"]')){
    await new Promise(r=>setTimeout(r,5000));
    elements=buildingWays();
  }else if(q.includes('traffic_signals'))elements=[...roadWays(),...signalNodes()];
  else elements=roadWays();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:.6,elements})});
});

const page=await context.newPage();
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__CITY_LAYER__!=null,null,{timeout:10000});
const duringSlowCity=await page.evaluate(()=>({cityReady:window.__CITY_LAYER__.snapshot().worldCityReady,streetDefined:window.__STREETSCAPE__!=null}));
if(duringSlowCity.cityReady)throw new Error('slow-city mock did not hold City pending');
if(duringSlowCity.streetDefined)throw new Error('Streetscape module started before initial City readiness');

await page.waitForFunction(()=>window.__STREETSCAPE__?.snapshot().worldStreetscapeReady===true,null,{timeout:35000});
await page.waitForFunction(()=>window.__STREETSCAPE__.snapshot().grounded>=3,null,{timeout:10000});
const s=await page.evaluate(()=>window.__STREETSCAPE__.snapshot());
const status=await page.locator('#streetStatus').textContent();
if(s.worldRoadSource!=='live'||s.worldCitySource!=='live'||s.worldStreetscapeSource!=='live')throw new Error(`live chain failed ${s.worldRoadSource}/${s.worldCitySource}/${s.worldStreetscapeSource}`);
if(s.worldCityAlignmentVersion!=='SanchongLuzhouCityAlignmentV0712')throw new Error(`wrong alignment version ${s.worldCityAlignmentVersion}`);
if(s.worldCityBuildingCount<100)throw new Error(`too few live buildings ${s.worldCityBuildingCount}`);
if(s.worldFacadeBandCount<100||s.worldRoofDetailCount<50)throw new Error(`facade missing ${s.worldFacadeBandCount}/${s.worldRoofDetailCount}`);
if(/fallback|timeout/i.test(status||''))throw new Error(`Safari readiness regressed: ${status}`);
if(s.visualVersion!=='LowPolySportCoupeV5'||s.wheels!==4||s.grounded<3)throw new Error(`V5 regression ${s.visualVersion} ${s.grounded}/${s.wheels}`);
if(errors.length)throw new Error(errors.join(' | '));
console.log(JSON.stringify({duringSlowCity,ready:s,status},null,2));
await context.close();
await browser.close();
