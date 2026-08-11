import { chromium } from 'playwright';

const BASE='http://127.0.0.1:8012/experiments/real-world-raycast-v0.7.1-sanchong-luzhou-streetscape/';
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
  const latStep=0.00125,lonStep=0.00145;
  for(let gx=-6;gx<=6;gx++)for(let gz=-5;gz<=5;gz++){
    if(Math.abs(gx)<=1||Math.abs(gz)<=1)continue;
    const lat=ORIGIN.lat+gz*latStep,lon=ORIGIN.lon+gx*lonStep,w=.00018+(Math.abs(gx)%3)*.000025,d=.00016+(Math.abs(gz)%3)*.000025;
    out.push({type:'way',id:id++,tags:{building:'residential','building:levels':String(3+(id%7))},geometry:[
      {lat:lat-d,lon:lon-w},{lat:lat-d,lon:lon+w},{lat:lat+d,lon:lon+w},{lat:lat+d,lon:lon-w},{lat:lat-d,lon:lon-w}
    ]});
  }
  for(const [lat,lon] of [[ORIGIN.lat,ORIGIN.lon],[ORIGIN.lat+.0012,ORIGIN.lon],[ORIGIN.lat,ORIGIN.lon+.0014],[ORIGIN.lat-.0013,ORIGIN.lon]]){
    const w=.00020,d=.00018;
    out.push({type:'way',id:id++,tags:{building:'commercial','building:levels':'6'},geometry:[
      {lat:lat-d,lon:lon-w},{lat:lat-d,lon:lon+w},{lat:lat+d,lon:lon+w},{lat:lat+d,lon:lon-w},{lat:lat-d,lon:lon-w}
    ]});
  }
  return out;
}
function signalNodes(){
  return[
    {type:'node',id:8001,lat:25.0731,lon:121.4810,tags:{highway:'traffic_signals'}},
    {type:'node',id:8002,lat:25.0710,lon:121.4787,tags:{highway:'traffic_signals'}},
    {type:'node',id:8003,lat:25.0750,lon:121.4831,tags:{highway:'traffic_signals'}},
    {type:'node',id:8004,lat:25.0768,lon:121.4774,tags:{highway:'traffic_signals'}}
  ];
}
async function installOverpassMock(context){
  await context.route(/https:\/\/overpass-(api\.de|kumi\.systems)\/api\/interpreter/,async route=>{
    const body=route.request().postData()||'',params=new URLSearchParams(body),q=params.get('data')||'';
    let elements;
    if(q.includes('way["building"]'))elements=buildingWays();
    else if(q.includes('traffic_signals'))elements=[...roadWays(),...signalNodes()];
    else elements=roadWays();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:0.6,elements})});
  });
}
async function boot(context,url=BASE){
  const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url,{waitUntil:'networkidle',timeout:45000});
  await page.waitForFunction(()=>window.__STREETSCAPE__?.snapshot().worldAlignmentReady===true,null,{timeout:30000});
  await page.waitForFunction(()=>window.__STREETSCAPE__.snapshot().grounded>=3,null,{timeout:10000});
  return page;
}

const liveContext=await browser.newContext({viewport:{width:1280,height:720}});
await installOverpassMock(liveContext);
const live=await boot(liveContext);
let s=await live.evaluate(()=>window.__STREETSCAPE__.snapshot());
if(s.worldRoadSource!=='live')throw new Error(`road not live ${s.worldRoadSource}`);
if(s.worldCitySource!=='live')throw new Error(`city not live ${s.worldCitySource}`);
if(s.worldStreetscapeSource!=='live')throw new Error(`street not live ${s.worldStreetscapeSource}`);
if(!s.worldCityOrigin||Math.abs(s.worldCityOrigin.lat-ORIGIN.lat)>.00001||Math.abs(s.worldCityOrigin.lon-ORIGIN.lon)>.00001)throw new Error(`origin mismatch ${JSON.stringify(s.worldCityOrigin)}`);
if(s.worldCityUrbanBlanket!==false)throw new Error('blanket city slab regression');
if(s.worldCityBuildingCount<100)throw new Error(`too few live buildings ${s.worldCityBuildingCount}`);
if(s.worldFacadeBandCount<100||s.worldRoofDetailCount<50)throw new Error(`facade not attached ${s.worldFacadeBandCount}/${s.worldRoofDetailCount}`);
if(s.worldCityRoadClearanceRemoved<1)throw new Error(`road clearance did not remove conflicts ${s.worldCityRoadClearanceRemoved}`);
if(s.worldCityVisibleBuildingCount>=s.worldCityBuildingCount)throw new Error('visible building count did not reflect road clearance');
if(s.wheels!==4||s.grounded<3||s.visualVersion!=='LowPolySportCoupeV5')throw new Error(`vehicle regression ${s.visualVersion} ${s.grounded}/${s.wheels}`);
await live.keyboard.down('KeyW');
let reached18=false;
for(let i=0;i<36;i++){await live.waitForTimeout(125);s=await live.evaluate(()=>window.__STREETSCAPE__.snapshot());if(s.speedKmh>=18){reached18=true;break}}
if(!reached18)throw new Error(`live acceleration failed ${s.speedKmh}`);
await liveContext.close();

const mobileContext=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const mobile=await boot(mobileContext,`${BASE}?fixture=1`);
const gas=await mobile.locator('[data-action="gas"]').boundingBox(),left=await mobile.locator('[data-action="left"]').boundingBox();
if(!gas||!left)throw new Error('mobile controls missing');
const cdp=await mobileContext.newCDPSession(mobile);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
  {x:left.x+left.width/2,y:left.y+left.height/2,id:1,radiusX:8,radiusY:8,force:1},
  {x:gas.x+gas.width/2,y:gas.y+gas.height/2,id:2,radiusX:8,radiusY:8,force:1}
]});
await mobile.waitForTimeout(1100);
const ms=await mobile.evaluate(()=>window.__STREETSCAPE__.snapshot());
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
if(ms.worldRoadSource!=='fixture'||ms.worldCitySource!=='fixture'||ms.worldStreetscapeSource!=='fixture')throw new Error(`fixture lineage mismatch ${ms.worldRoadSource}/${ms.worldCitySource}/${ms.worldStreetscapeSource}`);
if(!ms.worldAlignmentReady||ms.worldFacadeBandCount<100)throw new Error(`mobile alignment/facade missing ${JSON.stringify(ms)}`);
if(ms.speedKmh<=0||ms.grounded<2)throw new Error(`mobile unstable ${ms.speedKmh} ${ms.grounded}`);
await mobileContext.close();

if(errors.length)throw new Error(errors.join(' | '));
console.log(JSON.stringify({mockedLive:s,mobile:ms},null,2));
await browser.close();
