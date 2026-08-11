import * as THREE from 'three';

// V0.7.2 river / bridges layer. Visual + geographic only:
// V53, V5 RaycastVehicle and V0.6 road physics remain untouched.
let capturedScene=null;
const originalSceneAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return originalSceneAdd.apply(this,objects)};
await import('../real-world-raycast-v0.7.1-sanchong-luzhou-streetscape/app.js');
THREE.Scene.prototype.add=originalSceneAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
if(!scene||!baseReal)throw new Error('SanchongLuzhouV072 failed to attach to V0.7.1.2 runtime');

const GEO_RADIUS=2100,REQUEST_TIMEOUT=16000,MAX_WATER_WAYS=160,MAX_BRIDGE_WAYS=120;
const geoGroup=new THREE.Group();geoGroup.name='SanchongLuzhouRiverBridgesV072';scene.add(geoGroup);
const el={river:document.getElementById('river'),riverSource:document.getElementById('riverSource'),bridge:document.getElementById('bridge'),geoStatus:document.getElementById('geoStatus'),lat:document.getElementById('lat'),lon:document.getElementById('lon')};
let mapOrigin={lat:25.0731,lon:121.4810},geoReady=false,geoSource='--',waterWayCount=0,waterSurfaceCount=0,waterRibbonCount=0,bankCount=0,bridgeWayCount=0,bridgeDeckCount=0,bridgePierCount=0;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function llToLocal(lat,lon){const latRad=mapOrigin.lat*Math.PI/180;return{x:(lon-mapOrigin.lon)*111320*Math.cos(latRad),z:-(lat-mapOrigin.lat)*111320}}
function roadWidth(tags={}){const t=tags.highway||'',lanes=clamp(parseInt(tags.lanes,10)||(['motorway','trunk','primary','secondary'].includes(t)?4:2),1,10);const laneW=['motorway','trunk','primary','secondary'].includes(t)?3.35:3.05;return Math.max(5.6,lanes*laneW)}
function disposeObject(o){o.traverse?.(c=>{c.geometry?.dispose?.();if(Array.isArray(c.material))c.material.forEach(m=>m?.dispose?.());else c.material?.dispose?.()})}
function clearGeo(){for(const o of [...geoGroup.children]){geoGroup.remove(o);disposeObject(o)}waterWayCount=waterSurfaceCount=waterRibbonCount=bankCount=bridgeWayCount=bridgeDeckCount=bridgePierCount=0}
function bboxForRadius(lat,lon,radius){const dLat=radius/111320,dLon=radius/(111320*Math.cos(lat*Math.PI/180));return{south:lat-dLat,west:lon-dLon,north:lat+dLat,east:lon+dLon}}
async function postOverpass(url,q,timeoutMs){const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),timeoutMs);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(q)}`,signal:ac.signal});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return await r.json()}finally{clearTimeout(timer)}}
async function fetchGeo(lat,lon){
  const b=bboxForRadius(lat,lon,GEO_RADIUS),box=`${b.south.toFixed(6)},${b.west.toFixed(6)},${b.north.toFixed(6)},${b.east.toFixed(6)}`;
  const q=`[out:json][timeout:24];(way["natural"="water"](${box});way["waterway"~"^(river|canal|stream|riverbank|drain)$"](${box});way["highway"]["bridge"](${box}););out geom tags;`;
  const eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr;
  for(const url of eps){try{return await postOverpass(url,q,REQUEST_TIMEOUT)}catch(e){lastErr=e}}
  throw lastErr||new Error('Overpass river/bridge query unavailable');
}
function fixtureGeo(){
  return{elements:[
    {type:'way',id:720001,tags:{waterway:'river',name:'淡水河 fixture'},geometry:[{lat:25.0615,lon:121.4654},{lat:25.0670,lon:121.4658},{lat:25.0730,lon:121.4654},{lat:25.0790,lon:121.4647},{lat:25.0852,lon:121.4640}]},
    {type:'way',id:720002,tags:{waterway:'canal',name:'二重疏洪道 fixture'},geometry:[{lat:25.0610,lon:121.4732},{lat:25.0652,lon:121.4710},{lat:25.0695,lon:121.4688},{lat:25.0740,lon:121.4675}]},
    {type:'way',id:720010,tags:{highway:'primary',bridge:'yes',lanes:'4',name:'三蘆跨河橋 fixture'},geometry:[{lat:25.0734,lon:121.4618},{lat:25.0734,lon:121.4685},{lat:25.0734,lon:121.4750}]},
    {type:'way',id:720011,tags:{highway:'secondary',bridge:'yes',lanes:'4',name:'疏洪橋 fixture'},geometry:[{lat:25.0660,lon:121.4680},{lat:25.0660,lon:121.4745}]}
  ]};
}
function waterWidth(tags={}){const t=tags.waterway||'',name=String(tags.name||'');if(/淡水河|Tamsui/i.test(name))return 115;if(t==='river')return 72;if(t==='canal'||t==='riverbank')return 34;if(t==='drain')return 12;return 8}
function segmentData(way){const pts=(way.geometry||[]).map(p=>llToLocal(p.lat,p.lon));const out=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<2)continue;out.push({ax:a.x,az:a.z,bx:b.x,bz:b.z,mx:(a.x+b.x)/2,mz:(a.z+b.z)/2,dx,dz,len,angle:Math.atan2(dx,dz),tags:way.tags||{}})}return out}
function buildWater(ways){
  const waterMat=new THREE.MeshStandardMaterial({color:0x3f8eaa,roughness:.28,metalness:.04,transparent:true,opacity:.82});
  const bankMat=new THREE.MeshStandardMaterial({color:0x7c9271,roughness:1});
  const ribbonItems=[],bankItems=[];
  for(const way of ways.slice(0,MAX_WATER_WAYS)){
    const width=waterWidth(way.tags);for(const s of segmentData(way)){ribbonItems.push({...s,width});for(const side of [-1,1])bankItems.push({...s,width:5.5,offset:(width*.5+4.0)*side})}
  }
  if(ribbonItems.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),waterMat,ribbonItems.length);mesh.userData.geoRole='water';const d=new THREE.Object3D();ribbonItems.forEach((s,i)=>{d.position.set(s.mx,-.12,s.mz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.025,s.len+.9);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;geoGroup.add(mesh);waterRibbonCount=ribbonItems.length;waterSurfaceCount+=ribbonItems.length}
  if(bankItems.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bankMat,bankItems.length);mesh.userData.geoRole='bank';const d=new THREE.Object3D();bankItems.forEach((s,i)=>{const ox=Math.cos(s.angle)*s.offset,oz=-Math.sin(s.angle)*s.offset;d.position.set(s.mx+ox,-.04,s.mz+oz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.05,s.len+.6);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;geoGroup.add(mesh);bankCount=bankItems.length}
  waterWayCount=ways.length;
}
function buildBridges(ways){
  const segments=[];for(const way of ways.slice(0,MAX_BRIDGE_WAYS)){for(const s of segmentData(way))segments.push({...s,width:roadWidth(way.tags)})}
  bridgeWayCount=ways.length;if(!segments.length)return;
  const deckMat=new THREE.MeshStandardMaterial({color:0x55595b,roughness:.82,metalness:.10});const railMat=new THREE.MeshStandardMaterial({color:0xd0d2cf,roughness:.5,metalness:.42});const pierMat=new THREE.MeshStandardMaterial({color:0x8d8b83,roughness:.95});
  const deck=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),deckMat,segments.length),rail=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),railMat,segments.length*2);deck.userData.geoRole='bridgeDeck';rail.userData.geoRole='bridgeRail';const d=new THREE.Object3D();let ri=0;
  const pierItems=[];
  segments.forEach((s,i)=>{d.position.set(s.mx,.055,s.mz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.11,s.len+.35);d.updateMatrix();deck.setMatrixAt(i,d.matrix);for(const side of [-1,1]){const edge=s.width*.5+.17,ox=Math.cos(s.angle)*edge*side,oz=-Math.sin(s.angle)*edge*side;d.position.set(s.mx+ox,.39,s.mz+oz);d.rotation.set(0,s.angle,0);d.scale.set(.14,.58,s.len+.2);d.updateMatrix();rail.setMatrixAt(ri++,d.matrix)}const steps=Math.max(1,Math.floor(s.len/52));for(let n=1;n<=steps;n++){const t=n/(steps+1);pierItems.push({x:s.ax+s.dx*t,z:s.az+s.dz*t,angle:s.angle,width:s.width})}});
  deck.instanceMatrix.needsUpdate=true;rail.instanceMatrix.needsUpdate=true;deck.castShadow=rail.castShadow=true;deck.receiveShadow=true;geoGroup.add(deck,rail);bridgeDeckCount=segments.length;
  if(pierItems.length){const piers=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pierMat,pierItems.length);piers.userData.geoRole='bridgePier';pierItems.forEach((p,i)=>{d.position.set(p.x,-.08,p.z);d.rotation.set(0,p.angle,0);d.scale.set(Math.min(1.7,p.width*.15),1.0,1.7);d.updateMatrix();piers.setMatrixAt(i,d.matrix)});piers.instanceMatrix.needsUpdate=true;piers.castShadow=true;geoGroup.add(piers);bridgePierCount=pierItems.length}
}
function parseGeo(data){const waters=[],bridges=[];for(const e of data.elements||[]){if(e.type!=='way'||!(e.geometry||[]).length)continue;if(e.tags?.highway&&e.tags?.bridge&&e.tags.bridge!=='no')bridges.push(e);else if(e.tags?.natural==='water'||e.tags?.waterway)waters.push(e)}return{waters,bridges}}
function renderStatus(){el.river.textContent=`水域 ${waterWayCount}`;el.river.className=`chip ${geoReady?'good':'warn'}`;el.riverSource.textContent=`河川 ${geoSource}`;el.bridge.textContent=`橋 ${bridgeWayCount}`;el.geoStatus.textContent=`V0.7.2：水域 way ${waterWayCount}／水面段 ${waterSurfaceCount}／河岸 ${bankCount}；橋 way ${bridgeWayCount}／橋面段 ${bridgeDeckCount}／橋墩 ${bridgePierCount}。`}
async function waitBase(timeout=130000){const start=performance.now();while(performance.now()-start<timeout){const s=baseReal.snapshot();if(s.worldReady&&s.worldCityReady&&s.worldStreetscapeReady)return s;await new Promise(r=>setTimeout(r,150))}throw new Error('V0.7.1.2 base world readiness timeout')}
async function loadGeo(){geoReady=false;el.river.textContent='水域等待城市';el.river.className='chip warn';clearGeo();const fixture=new URLSearchParams(location.search).get('fixture')==='1';try{const s=await waitBase();mapOrigin=s.worldCityOrigin||{lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};const data=fixture?fixtureGeo():await fetchGeo(mapOrigin.lat,mapOrigin.lon);const parsed=parseGeo(data);if(!parsed.waters.length&&!parsed.bridges.length)throw new Error('No river/bridge OSM features returned');buildWater(parsed.waters);buildBridges(parsed.bridges);geoSource=fixture?'fixture':'live';geoReady=true;renderStatus()}catch(err){const s=baseReal.snapshot();mapOrigin=s.worldCityOrigin||{lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};const parsed=parseGeo(fixtureGeo());buildWater(parsed.waters);buildBridges(parsed.bridges);geoSource='fallback';geoReady=true;renderStatus();el.geoStatus.textContent+=` fallback: ${err.message}`;console.warn(err)}}

const baseSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>{const s=baseSnapshot();return{...s,worldRiverReady:geoReady,worldRiverSource:geoSource,worldWaterWayCount:waterWayCount,worldWaterSurfaceCount:waterSurfaceCount,worldWaterRibbonCount:waterRibbonCount,worldRiverBankCount:bankCount,worldBridgeWayCount:bridgeWayCount,worldBridgeDeckCount:bridgeDeckCount,worldBridgePierCount:bridgePierCount,worldRiverOrigin:{...mapOrigin},worldRiverVersion:'SanchongLuzhouRiverBridgesV072'}};
window.__RIVER_BRIDGES__={snapshot:()=>baseReal.snapshot(),reload:loadGeo};
document.getElementById('loadRoads').addEventListener('click',()=>setTimeout(loadGeo,500));
await loadGeo();
