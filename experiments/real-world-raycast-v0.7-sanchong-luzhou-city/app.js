import * as THREE from 'three';

// V0.7 city layer, alignment-hardened in descendant V0.7.1.1.
// Road / V5 physics stay owned by V0.6.
let capturedScene=null;
const originalSceneAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return originalSceneAdd.apply(this,objects)};
await import('../real-world-raycast-v0.6-sanchong-luzhou/app.js');
THREE.Scene.prototype.add=originalSceneAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
if(!scene||!baseReal)throw new Error('SanchongLuzhouV07 failed to attach to V0.6 runtime');

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CITY_RADIUS=1400,SECONDARY_RADIUS=1050,MAX_BUILDINGS=2600,SHADOW_RADIUS=430;
const ROAD_READY_TIMEOUT=70000,REQUEST_TIMEOUT=14000;
const cityGroup=new THREE.Group();cityGroup.name='SanchongLuzhouCityLayerV07';scene.add(cityGroup);
const el={city:document.getElementById('city'),citySource:document.getElementById('citySource'),cityStatus:document.getElementById('cityStatus'),lat:document.getElementById('lat'),lon:document.getElementById('lon')};
let mapOrigin={lat:25.0731,lon:121.4810},cityReady=false,citySource='--',cityBuildings=0,cityRawBuildings=0,cityQueryRadius=CITY_RADIUS;

function llToLocal(lat,lon){const latRad=mapOrigin.lat*Math.PI/180;return{x:(lon-mapOrigin.lon)*111320*Math.cos(latRad),z:-(lat-mapOrigin.lat)*111320}}
function numberFromTag(v){if(v==null)return NaN;const m=String(v).replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN}
function hashString(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function buildingHeight(tags={},id='0'){
  const tagged=numberFromTag(tags.height);if(Number.isFinite(tagged)&&tagged>2)return clamp(tagged,3.2,72);
  const levels=numberFromTag(tags['building:levels']);if(Number.isFinite(levels)&&levels>0)return clamp(levels*3.05,3.2,72);
  const type=String(tags.building||'').toLowerCase(),seed=hashString(`${id}:${type}`);
  if(['apartments','residential','commercial','office','retail'].includes(type))return 13+(seed%8)*2.15;
  if(['industrial','warehouse'].includes(type))return 7+(seed%4)*1.6;
  if(['house','detached','semidetached_house','terrace'].includes(type))return 6.5+(seed%3)*1.6;
  return 9+(seed%7)*1.8;
}
function footprintBox(way){
  const pts=(way.geometry||[]).map(p=>llToLocal(p.lat,p.lon));if(pts.length<3)return null;
  let best=0,ux=0,uz=1;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l>best){best=l;ux=dx/l;uz=dz/l}}
  if(best<1)return null;const vx=uz,vz=-ux;let minU=Infinity,maxU=-Infinity,minV=Infinity,maxV=-Infinity;
  for(const p of pts){const pu=p.x*ux+p.z*uz,pv=p.x*vx+p.z*vz;minU=Math.min(minU,pu);maxU=Math.max(maxU,pu);minV=Math.min(minV,pv);maxV=Math.max(maxV,pv)}
  const depth=maxU-minU,width=maxV-minV,area=width*depth;
  if(width<2.4||depth<2.4||area<12||area>12000||Math.max(width,depth)>130)return null;
  const midU=(minU+maxU)/2,midV=(minV+maxV)/2,cx=ux*midU+vx*midV,cz=uz*midU+vz*midV;
  const dist=Math.hypot(cx,cz);if(dist>CITY_RADIUS*1.04)return null;
  return{id:way.id??`${cx}:${cz}`,cx,cz,width:width*.84,depth:depth*.84,height:buildingHeight(way.tags,way.id),angle:Math.atan2(ux,uz),tags:way.tags||{},dist};
}
function fixtureBuildings(){
  const out=[];let id=1;for(let gx=-7;gx<=7;gx++)for(let gz=-6;gz<=6;gz++){
    if(Math.abs(gx)<=1||Math.abs(gz)<=1)continue;
    const laneGap=(Math.abs(gx)%4===0?7:0),cx=gx*32+(gz%2)*4+Math.sign(gx)*laneGap,cz=gz*31;
    const seed=hashString(`${gx}:${gz}`),width=17+(seed%8),depth=16+((seed>>>3)%9),height=10+((seed>>>7)%9)*2.4;
    out.push({id:id++,cx,cz,width,depth,height,angle:(seed%5-2)*.025,tags:{building:'residential'},dist:Math.hypot(cx,cz)});
  }return out;
}
function parseBuildings(data){
  const raw=[],seen=new Set();
  for(const e of data.elements||[]){if(e.type!=='way'||!e.tags?.building||e.tags.building==='no'||seen.has(e.id))continue;seen.add(e.id);const b=footprintBox(e);if(b)raw.push(b)}
  cityRawBuildings=raw.length;raw.sort((a,b)=>a.dist-b.dist||b.width*b.depth-a.width*a.depth);return raw.slice(0,MAX_BUILDINGS);
}
function disposeObject(o){o.traverse?.(c=>{c.geometry?.dispose?.();if(Array.isArray(c.material))c.material.forEach(m=>m?.dispose?.());else c.material?.dispose?.()})}
function clearCity(){for(const o of [...cityGroup.children]){cityGroup.remove(o);disposeObject(o)}cityBuildings=0}
function place(dummy,mesh,i,b){dummy.position.set(b.cx,b.height*.5,b.cz);dummy.rotation.set(0,b.angle,0);dummy.scale.set(b.width,b.height,b.depth);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
function buildCity(entries){
  clearCity();if(!entries.length)throw new Error('No Sanchong/Luzhou building footprints');
  const palettes=[0xb8b2a5,0xc6b39f,0xa9b2b8,0xb8a7a0,0xd0c3ae,0xaeb6b3];
  const materials=palettes.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.88,metalness:.02}));
  const padMat=new THREE.MeshStandardMaterial({color:0xbfc1bb,roughness:1});
  const groups=new Map();
  for(const b of entries){const p=hashString(String(b.id))%palettes.length,near=b.dist<SHADOW_RADIUS,key=`${near?'n':'f'}:${p}`;if(!groups.has(key))groups.set(key,{near,material:materials[p],items:[]});groups.get(key).items.push(b)}
  const dummy=new THREE.Object3D();
  for(const g of groups.values()){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),g.material,g.items.length);mesh.castShadow=g.near;mesh.receiveShadow=true;mesh.userData.cityRole='building';
    g.items.forEach((b,i)=>place(dummy,mesh,i,b));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere?.();cityGroup.add(mesh);
  }
  const pads=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),padMat,entries.length);pads.userData.cityRole='pad';
  entries.forEach((b,i)=>{dummy.position.set(b.cx,.012,b.cz);dummy.rotation.set(0,b.angle,0);dummy.scale.set(b.width*1.04,.035,b.depth*1.04);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix)});
  pads.instanceMatrix.needsUpdate=true;pads.receiveShadow=true;pads.computeBoundingSphere?.();cityGroup.add(pads);
  cityBuildings=entries.length;
}
function bboxForRadius(lat,lon,radius){
  const dLat=radius/111320,dLon=radius/(111320*Math.cos(lat*Math.PI/180));
  return{south:lat-dLat,west:lon-dLon,north:lat+dLat,east:lon+dLon};
}
async function postOverpass(url,q,timeoutMs){
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),timeoutMs);
  try{
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(q)}`,signal:ac.signal});
    if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return await r.json();
  }finally{clearTimeout(timer)}
}
async function fetchBuildingsAtRadius(lat,lon,radius){
  const b=bboxForRadius(lat,lon,radius);
  const q=`[out:json][timeout:20];way["building"](${b.south.toFixed(6)},${b.west.toFixed(6)},${b.north.toFixed(6)},${b.east.toFixed(6)});out geom tags;`;
  const eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr;
  for(const url of eps){try{return{data:await postOverpass(url,q,REQUEST_TIMEOUT),radius}}catch(e){lastErr=e}}
  throw lastErr||new Error('Overpass building bbox query unavailable');
}
async function fetchBuildings(lat,lon){
  let lastErr;
  for(const radius of [CITY_RADIUS,SECONDARY_RADIUS]){try{return await fetchBuildingsAtRadius(lat,lon,radius)}catch(e){lastErr=e}}
  throw lastErr||new Error('Overpass building query unavailable');
}
async function waitRoads(timeout=ROAD_READY_TIMEOUT){
  const start=performance.now();
  while(performance.now()-start<timeout){if(baseReal.snapshot().worldReady)return;await new Promise(r=>setTimeout(r,120))}
  throw new Error('V0.6 road layer readiness timeout');
}
function renderCityStatus(){
  el.city.textContent=`建築 ${cityBuildings}`;el.city.className=`chip ${cityReady?'good':'warn'}`;el.citySource.textContent=`城市 ${citySource}`;
  el.cityStatus.textContent=`City Layer：${cityBuildings} 棟建築（OSM footprint／高度推估；query ${cityQueryRadius}m；道路完成後才載入；無全域灰底）。`;
}
async function loadCity(){
  const fixture=new URLSearchParams(location.search).get('fixture')==='1';cityReady=false;el.city.textContent='建築等待道路';el.city.className='chip warn';clearCity();
  try{
    await waitRoads();
    mapOrigin={lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};
    let entries;
    if(fixture){entries=fixtureBuildings();cityRawBuildings=entries.length;cityQueryRadius=CITY_RADIUS;citySource='fixture'}
    else{const result=await fetchBuildings(mapOrigin.lat,mapOrigin.lon);cityQueryRadius=result.radius;entries=parseBuildings(result.data);citySource='live'}
    buildCity(entries);cityReady=true;renderCityStatus();
  }catch(err){
    mapOrigin={lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};
    const entries=fixtureBuildings();cityRawBuildings=entries.length;cityQueryRadius=0;buildCity(entries);citySource='fallback';cityReady=true;renderCityStatus();
    el.cityStatus.textContent=`City Layer：live 建築載入失敗，已切 deterministic fallback（${err.message}）。`;console.warn(err);
  }
}

const baseSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>({...baseSnapshot(),worldCityReady:cityReady,worldCitySource:citySource,worldCityBuildingCount:cityBuildings,worldCityRawBuildingCount:cityRawBuildings,worldCityRadius:CITY_RADIUS,worldCityQueryRadius:cityQueryRadius,worldCityOrigin:{lat:mapOrigin.lat,lon:mapOrigin.lon},worldCityUrbanBlanket:false,worldCityVersion:'SanchongLuzhouCityV07',worldCityAlignmentVersion:'SanchongLuzhouCityAlignmentV0711'});
window.__CITY_LAYER__={snapshot:()=>baseReal.snapshot(),reload:loadCity};
document.getElementById('loadRoads').addEventListener('click',()=>setTimeout(loadCity,100));
loadCity();
