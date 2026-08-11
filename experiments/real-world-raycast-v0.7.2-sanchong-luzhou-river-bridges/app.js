import * as THREE from 'three';

// V0.7.2 river / bridges layer, visually refined in V0.7.2.1.
// V53, V5 RaycastVehicle and V0.6 road physics remain untouched.
let capturedScene=null;
const originalSceneAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return originalSceneAdd.apply(this,objects)};
await import('../real-world-raycast-v0.7.1-sanchong-luzhou-streetscape/app.js');
THREE.Scene.prototype.add=originalSceneAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
if(!scene||!baseReal)throw new Error('SanchongLuzhouV072 failed to attach to V0.7.1.2 runtime');

const GEO_RADIUS=2100,REQUEST_TIMEOUT=16000,MAX_WATER_WAYS=160,MAX_BRIDGE_WAYS=120,MAX_WATER_AREAS=40;
const geoGroup=new THREE.Group();geoGroup.name='SanchongLuzhouRiverBridgesV072';scene.add(geoGroup);
const el={river:document.getElementById('river'),riverSource:document.getElementById('riverSource'),bridge:document.getElementById('bridge'),geoStatus:document.getElementById('geoStatus'),lat:document.getElementById('lat'),lon:document.getElementById('lon')};
let mapOrigin={lat:25.0731,lon:121.4810},geoReady=false,geoSource='--',waterWayCount=0,waterSurfaceCount=0,waterRibbonCount=0,waterAreaCount=0,waterHighlightCount=0,bankCount=0,leveeCount=0,bridgeWayCount=0,rawBridgeWayCount=0,bridgeDeckCount=0,bridgePierCount=0;
let waterSegments=[],waterPolygons=[];

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function llToLocal(lat,lon){const latRad=mapOrigin.lat*Math.PI/180;return{x:(lon-mapOrigin.lon)*111320*Math.cos(latRad),z:-(lat-mapOrigin.lat)*111320}}
function roadWidth(tags={}){const t=tags.highway||'',lanes=clamp(parseInt(tags.lanes,10)||(['motorway','trunk','primary','secondary'].includes(t)?4:2),1,10);const laneW=['motorway','trunk','primary','secondary'].includes(t)?3.35:3.05;return Math.max(5.6,lanes*laneW)}
function disposeObject(o){o.traverse?.(c=>{c.geometry?.dispose?.();if(Array.isArray(c.material))c.material.forEach(m=>m?.dispose?.());else c.material?.dispose?.()})}
function clearGeo(){for(const o of [...geoGroup.children]){geoGroup.remove(o);disposeObject(o)}waterWayCount=waterSurfaceCount=waterRibbonCount=waterAreaCount=waterHighlightCount=bankCount=leveeCount=bridgeWayCount=rawBridgeWayCount=bridgeDeckCount=bridgePierCount=0;waterSegments=[];waterPolygons=[]}
function bboxForRadius(lat,lon,radius){const dLat=radius/111320,dLon=radius/(111320*Math.cos(lat*Math.PI/180));return{south:lat-dLat,west:lon-dLon,north:lat+dLat,east:lon+dLon}}
async function postOverpass(url,q,timeoutMs){const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),timeoutMs);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(q)}`,signal:ac.signal});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return await r.json()}finally{clearTimeout(timer)}}
async function fetchGeo(lat,lon){
  const b=bboxForRadius(lat,lon,GEO_RADIUS),box=`${b.south.toFixed(6)},${b.west.toFixed(6)},${b.north.toFixed(6)},${b.east.toFixed(6)}`;
  const q=`[out:json][timeout:24];(way["natural"="water"](${box});way["waterway"~"^(river|canal|stream|riverbank|drain)$"](${box});way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"]["bridge"](${box}););out geom tags;`;
  const eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr;
  for(const url of eps){try{return await postOverpass(url,q,REQUEST_TIMEOUT)}catch(e){lastErr=e}}
  throw lastErr||new Error('Overpass river/bridge query unavailable');
}
function fixtureGeo(){
  return{elements:[
    {type:'way',id:720001,tags:{waterway:'river',name:'淡水河 fixture'},geometry:[{lat:25.0615,lon:121.4654},{lat:25.0670,lon:121.4658},{lat:25.0730,lon:121.4654},{lat:25.0790,lon:121.4647},{lat:25.0852,lon:121.4640}]},
    {type:'way',id:720002,tags:{waterway:'canal',name:'二重疏洪道 fixture'},geometry:[{lat:25.0610,lon:121.4732},{lat:25.0652,lon:121.4710},{lat:25.0695,lon:121.4688},{lat:25.0740,lon:121.4675}]},
    {type:'way',id:720003,tags:{natural:'water',name:'河濱水面 fixture'},geometry:[{lat:25.0698,lon:121.4633},{lat:25.0724,lon:121.4632},{lat:25.0724,lon:121.4661},{lat:25.0698,lon:121.4661},{lat:25.0698,lon:121.4633}]},
    {type:'way',id:720010,tags:{highway:'primary',bridge:'yes',lanes:'4',name:'三蘆跨河橋 fixture'},geometry:[{lat:25.0734,lon:121.4618},{lat:25.0734,lon:121.4685},{lat:25.0734,lon:121.4750}]},
    {type:'way',id:720011,tags:{highway:'secondary',bridge:'yes',lanes:'4',name:'疏洪橋 fixture'},geometry:[{lat:25.0660,lon:121.4680},{lat:25.0660,lon:121.4745}]},
    {type:'way',id:720012,tags:{highway:'tertiary',bridge:'yes',lanes:'2',name:'非跨水橋 fixture'},geometry:[{lat:25.0800,lon:121.4860},{lat:25.0810,lon:121.4900}]}
  ]};
}
function waterWidth(tags={}){const t=tags.waterway||'',name=String(tags.name||'');if(/淡水河|Tamsui/i.test(name))return 125;if(t==='river')return 78;if(t==='canal'||t==='riverbank')return 38;if(t==='drain')return 13;return 9}
function segmentData(way){const pts=(way.geometry||[]).map(p=>llToLocal(p.lat,p.lon));const out=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<2)continue;out.push({ax:a.x,az:a.z,bx:b.x,bz:b.z,mx:(a.x+b.x)/2,mz:(a.z+b.z)/2,dx,dz,len,angle:Math.atan2(dx,dz),tags:way.tags||{}})}return out}
function isClosedWaterArea(way){const g=way.geometry||[];if(way.tags?.natural!=='water'||g.length<4)return false;const a=g[0],b=g[g.length-1];return Math.hypot(a.lat-b.lat,a.lon-b.lon)<.000002}
function polygonForWay(way){return(way.geometry||[]).slice(0,-1).map(p=>llToLocal(p.lat,p.lon))}
function pointInPolygon(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i].x,zi=poly[i].z,xj=poly[j].x,zj=poly[j].z;const hit=((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi||1e-9)+xi);if(hit)inside=!inside}return inside}
function pointSegmentDistance(px,pz,s){const l2=s.dx*s.dx+s.dz*s.dz||1,t=clamp(((px-s.ax)*s.dx+(pz-s.az)*s.dz)/l2,0,1),x=s.ax+s.dx*t,z=s.az+s.dz*t;return Math.hypot(px-x,pz-z)}
function bridgeTouchesWater(s){
  const steps=Math.max(8,Math.ceil(s.len/55));
  for(let i=0;i<=steps;i++){const t=i/steps,x=s.ax+s.dx*t,z=s.az+s.dz*t;if(waterPolygons.some(poly=>pointInPolygon(x,z,poly)))return true;for(const w of waterSegments){if(Math.abs(x-w.mx)>w.len*.6+w.width+80||Math.abs(z-w.mz)>w.len*.6+w.width+80)continue;if(pointSegmentDistance(x,z,w)<w.width*.5+18)return true}}
  return false;
}
function buildWaterArea(way,waterMat){
  const poly=polygonForWay(way);if(poly.length<3)return false;const shape=new THREE.Shape();shape.moveTo(poly[0].x,-poly[0].z);for(let i=1;i<poly.length;i++)shape.lineTo(poly[i].x,-poly[i].z);shape.closePath();const geom=new THREE.ShapeGeometry(shape);geom.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geom,waterMat);mesh.position.y=.028;mesh.userData.geoRole='waterArea';mesh.receiveShadow=true;geoGroup.add(mesh);waterPolygons.push(poly);waterAreaCount++;waterSurfaceCount++;return true;
}
function buildWater(ways){
  const waterMat=new THREE.MeshStandardMaterial({color:0x2c88aa,roughness:.20,metalness:.08,emissive:0x0b3340,emissiveIntensity:.18});
  const highlightMat=new THREE.MeshStandardMaterial({color:0x88d4e3,roughness:.18,metalness:.04,transparent:true,opacity:.30,depthWrite:false});
  const bankMat=new THREE.MeshStandardMaterial({color:0x888f87,roughness:.98});
  const leveeMat=new THREE.MeshStandardMaterial({color:0x718b67,roughness:1});
  const ribbonItems=[],highlightItems=[],bankItems=[],leveeItems=[];
  let areaBuilt=0;
  for(const way of ways.slice(0,MAX_WATER_WAYS)){
    if(areaBuilt<MAX_WATER_AREAS&&isClosedWaterArea(way)){if(buildWaterArea(way,waterMat))areaBuilt++;continue}
    const width=waterWidth(way.tags);for(const s of segmentData(way)){const item={...s,width};ribbonItems.push(item);waterSegments.push(item);highlightItems.push({...s,width:Math.max(2.5,width*.34)});for(const side of [-1,1]){bankItems.push({...s,width:5.2,offset:(width*.5+3.6)*side});leveeItems.push({...s,width:13,offset:(width*.5+12.4)*side})}}
  }
  if(ribbonItems.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),waterMat,ribbonItems.length);mesh.userData.geoRole='water';const d=new THREE.Object3D();ribbonItems.forEach((s,i)=>{d.position.set(s.mx,.028,s.mz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.035,s.len+1.0);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;geoGroup.add(mesh);waterRibbonCount=ribbonItems.length;waterSurfaceCount+=ribbonItems.length}
  if(highlightItems.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),highlightMat,highlightItems.length);mesh.userData.geoRole='waterHighlight';const d=new THREE.Object3D();highlightItems.forEach((s,i)=>{d.position.set(s.mx,.056,s.mz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.008,s.len+.5);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;geoGroup.add(mesh);waterHighlightCount=highlightItems.length}
  if(bankItems.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bankMat,bankItems.length);mesh.userData.geoRole='bank';const d=new THREE.Object3D();bankItems.forEach((s,i)=>{const ox=Math.cos(s.angle)*s.offset,oz=-Math.sin(s.angle)*s.offset;d.position.set(s.mx+ox,.045,s.mz+oz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.10,s.len+.8);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;geoGroup.add(mesh);bankCount=bankItems.length}
  if(leveeItems.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),leveeMat,leveeItems.length);mesh.userData.geoRole='levee';const d=new THREE.Object3D();leveeItems.forEach((s,i)=>{const ox=Math.cos(s.angle)*s.offset,oz=-Math.sin(s.angle)*s.offset;d.position.set(s.mx+ox,.025,s.mz+oz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.05,s.len+.8);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;geoGroup.add(mesh);leveeCount=leveeItems.length}
  waterWayCount=ways.length;
}
function buildBridges(ways){
  rawBridgeWayCount=ways.length;const segments=[],keptWays=new Set();
  for(const way of ways.slice(0,MAX_BRIDGE_WAYS)){for(const s of segmentData(way)){const item={...s,width:roadWidth(way.tags),wayId:way.id};if(bridgeTouchesWater(item)){segments.push(item);keptWays.add(way.id)}}}
  bridgeWayCount=keptWays.size;if(!segments.length)return;
  const deckMat=new THREE.MeshStandardMaterial({color:0x303234,roughness:.90,metalness:.04});const railMat=new THREE.MeshStandardMaterial({color:0xc3c6c2,roughness:.74,metalness:.16});const pierMat=new THREE.MeshStandardMaterial({color:0x858983,roughness:.96});
  const deck=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),deckMat,segments.length),rail=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),railMat,segments.length*2);deck.userData.geoRole='bridgeDeck';rail.userData.geoRole='bridgeRail';const d=new THREE.Object3D();let ri=0;const pierItems=[];
  segments.forEach((s,i)=>{d.position.set(s.mx,.078,s.mz);d.rotation.set(0,s.angle,0);d.scale.set(s.width,.12,s.len+.38);d.updateMatrix();deck.setMatrixAt(i,d.matrix);for(const side of [-1,1]){const edge=s.width*.5+.16,ox=Math.cos(s.angle)*edge*side,oz=-Math.sin(s.angle)*edge*side;d.position.set(s.mx+ox,.48,s.mz+oz);d.rotation.set(0,s.angle,0);d.scale.set(.16,.76,s.len+.22);d.updateMatrix();rail.setMatrixAt(ri++,d.matrix)}const steps=Math.max(1,Math.floor(s.len/54));for(let n=1;n<=steps;n++){const t=n/(steps+1);pierItems.push({x:s.ax+s.dx*t,z:s.az+s.dz*t,angle:s.angle,width:s.width})}});
  deck.instanceMatrix.needsUpdate=true;rail.instanceMatrix.needsUpdate=true;deck.castShadow=rail.castShadow=true;deck.receiveShadow=true;geoGroup.add(deck,rail);bridgeDeckCount=segments.length;
  if(pierItems.length){const piers=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pierMat,pierItems.length);piers.userData.geoRole='bridgePier';pierItems.forEach((p,i)=>{d.position.set(p.x,-.18,p.z);d.rotation.set(0,p.angle,0);d.scale.set(Math.min(1.8,p.width*.16),1.35,1.8);d.updateMatrix();piers.setMatrixAt(i,d.matrix)});piers.instanceMatrix.needsUpdate=true;piers.castShadow=true;geoGroup.add(piers);bridgePierCount=pierItems.length}
}
function parseGeo(data){const waters=[],bridges=[];for(const e of data.elements||[]){if(e.type!=='way'||!(e.geometry||[]).length)continue;if(e.tags?.highway&&e.tags?.bridge&&e.tags.bridge!=='no')bridges.push(e);else if(e.tags?.natural==='water'||e.tags?.waterway)waters.push(e)}return{waters,bridges}}
function renderStatus(){el.river.textContent=`水域 ${waterWayCount}`;el.river.className=`chip ${geoReady?'good':'warn'}`;el.riverSource.textContent=`河川 ${geoSource}`;el.bridge.textContent=`河橋 ${bridgeWayCount}/${rawBridgeWayCount}`;el.geoStatus.textContent=`V0.7.2.1：水域 way ${waterWayCount}／水面 ${waterSurfaceCount}（面 ${waterAreaCount}＋帶 ${waterRibbonCount}）／河岸 ${bankCount}／堤防 ${leveeCount}；河橋 ${bridgeWayCount}/${rawBridgeWayCount} way／橋面段 ${bridgeDeckCount}／橋墩 ${bridgePierCount}。`}
async function waitBase(timeout=130000){const start=performance.now();while(performance.now()-start<timeout){const s=baseReal.snapshot();if(s.worldReady&&s.worldCityReady&&s.worldStreetscapeReady)return s;await new Promise(r=>setTimeout(r,150))}throw new Error('V0.7.1.2 base world readiness timeout')}
async function loadGeo(){geoReady=false;el.river.textContent='水域等待城市';el.river.className='chip warn';clearGeo();const fixture=new URLSearchParams(location.search).get('fixture')==='1';try{const s=await waitBase();mapOrigin=s.worldCityOrigin||{lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};const data=fixture?fixtureGeo():await fetchGeo(mapOrigin.lat,mapOrigin.lon);const parsed=parseGeo(data);if(!parsed.waters.length&&!parsed.bridges.length)throw new Error('No river/bridge OSM features returned');buildWater(parsed.waters);buildBridges(parsed.bridges);geoSource=fixture?'fixture':'live';geoReady=true;renderStatus()}catch(err){const s=baseReal.snapshot();mapOrigin=s.worldCityOrigin||{lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};const parsed=parseGeo(fixtureGeo());buildWater(parsed.waters);buildBridges(parsed.bridges);geoSource='fallback';geoReady=true;renderStatus();el.geoStatus.textContent+=` fallback: ${err.message}`;console.warn(err)}}

const baseSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>{const s=baseSnapshot();return{...s,worldRiverReady:geoReady,worldRiverSource:geoSource,worldWaterWayCount:waterWayCount,worldWaterSurfaceCount:waterSurfaceCount,worldWaterRibbonCount:waterRibbonCount,worldWaterAreaCount:waterAreaCount,worldWaterHighlightCount:waterHighlightCount,worldRiverBankCount:bankCount,worldRiverLeveeCount:leveeCount,worldBridgeWayCount:bridgeWayCount,worldBridgeRawWayCount:rawBridgeWayCount,worldBridgeDeckCount:bridgeDeckCount,worldBridgePierCount:bridgePierCount,worldRiverOrigin:{...mapOrigin},worldRiverVersion:'SanchongLuzhouRiverBridgesV072',worldRiverVisualVersion:'SanchongLuzhouRiverBridgeVisualV0721'}};
window.__RIVER_BRIDGES__={snapshot:()=>baseReal.snapshot(),reload:loadGeo};
document.getElementById('loadRoads').addEventListener('click',()=>setTimeout(loadGeo,500));
await loadGeo();
