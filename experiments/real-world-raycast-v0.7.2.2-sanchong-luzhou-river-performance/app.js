import * as THREE from 'three';

// V0.7.2.2 is a wrapper on top of the validated V0.7.2.1 river/bridge layer.
// It changes only render cost and preview location; V53, V5 RaycastVehicle,
// V0.6 roads, V0.7 city and V0.7.1.x streetscape stay untouched.
const RIVER_VIEW={lat:25.0734,lon:121.4685};
const params=new URLSearchParams(location.search);
const viewMode=params.get('view')==='river'?'river':'city';
const fixtureMode=params.get('fixture')==='1';
if(viewMode==='river'){
  const lat=document.getElementById('lat'),lon=document.getElementById('lon');
  if(lat)lat.value=String(RIVER_VIEW.lat);
  if(lon)lon.value=String(RIVER_VIEW.lon);
}

let capturedScene=null;
const nativeAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return nativeAdd.apply(this,objects)};
await import('../real-world-raycast-v0.7.2-sanchong-luzhou-river-bridges/app.js');
THREE.Scene.prototype.add=nativeAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
const river=window.__RIVER_BRIDGES__;
if(!scene||!baseReal||!river)throw new Error('SanchongLuzhouV0722 failed to attach to V0.7.2.1 runtime');

const RENDER_RADIUS=viewMode==='river'?1750:1900;
// Live keeps the visual budget used for Safari. Fixture intentionally uses a much
// smaller deterministic budget so CI actually exercises the LOD/reordering path.
const LIVE_BUDGET={water:110,waterHighlight:55,bank:180,levee:180,bridgeDeck:96,bridgeRail:192,bridgePier:160,waterArea:10};
const FIXTURE_BUDGET={water:5,waterHighlight:4,bank:8,levee:8,bridgeDeck:3,bridgeRail:6,bridgePier:20,waterArea:1};
const BUDGET=fixtureMode?FIXTURE_BUDGET:LIVE_BUDGET;
const shared={
  water:new THREE.MeshLambertMaterial({color:0x2f91ae,emissive:0x082a35,emissiveIntensity:.12}),
  waterHighlight:new THREE.MeshBasicMaterial({color:0xa0e2ed,transparent:true,opacity:.14,depthWrite:false}),
  bank:new THREE.MeshLambertMaterial({color:0x858d86}),
  levee:new THREE.MeshLambertMaterial({color:0x718b67}),
  bridgeDeck:new THREE.MeshLambertMaterial({color:0x303234}),
  bridgeRail:new THREE.MeshLambertMaterial({color:0xbfc4c2}),
  bridgePier:new THREE.MeshLambertMaterial({color:0x858983})
};
let perfReady=false,renderStats={},renderVisible=0,renderBefore=0;
const matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();

function distXZ(p){return Math.hypot(p.x,p.z)}
function budgetInstances(mesh,maxCount,radius){
  const before=mesh.count,items=[];
  for(let i=0;i<before;i++){
    mesh.getMatrixAt(i,matrix);matrix.decompose(pos,quat,scale);
    const d=distXZ(pos);if(d<=radius)items.push({d,m:matrix.clone()});
  }
  items.sort((a,b)=>a.d-b.d);const keep=items.slice(0,maxCount);
  keep.forEach((it,i)=>mesh.setMatrixAt(i,it.m));mesh.count=keep.length;mesh.instanceMatrix.needsUpdate=true;
  return{before,after:keep.length};
}
function optimizeAreas(items,maxCount,radius){
  const ranked=items.map(mesh=>{mesh.geometry.computeBoundingSphere?.();const c=mesh.geometry.boundingSphere?.center||new THREE.Vector3();return{mesh,d:Math.hypot(c.x+mesh.position.x,c.z+mesh.position.z)}}).sort((a,b)=>a.d-b.d);
  let kept=0;ranked.forEach((it,i)=>{it.mesh.visible=i<maxCount&&it.d<=radius;if(it.mesh.visible)kept++});
  return{before:items.length,after:kept};
}
function optimizeGeo(){
  const group=scene.getObjectByName('SanchongLuzhouRiverBridgesV072');
  if(!group)return false;
  const oldMaterials=new Set(),areas=[];renderStats={};renderVisible=0;renderBefore=0;
  group.traverse(o=>{
    const role=o.userData?.geoRole;if(!role)return;
    if(role==='waterArea'){areas.push(o);if(o.material){oldMaterials.add(o.material);o.material=shared.water}o.castShadow=false;o.receiveShadow=false;return}
    if(shared[role]&&o.material){oldMaterials.add(o.material);o.material=shared[role]}
    o.castShadow=false;
    if(role==='water'||role==='waterHighlight')o.receiveShadow=false;
    if(o.isInstancedMesh&&BUDGET[role]){
      const s=budgetInstances(o,BUDGET[role],RENDER_RADIUS);renderStats[role]=s;renderBefore+=s.before;renderVisible+=s.after;
    }
  });
  if(areas.length){const s=optimizeAreas(areas,BUDGET.waterArea,RENDER_RADIUS);renderStats.waterArea=s;renderBefore+=s.before;renderVisible+=s.after}
  for(const m of oldMaterials)if(!Object.values(shared).includes(m))m.dispose?.();
  perfReady=true;
  const status=document.getElementById('geoStatus');
  if(status)status.textContent=`V0.7.2.2：河景 ${viewMode==='river'?'驗收':'市區'}／River LOD ${renderVisible}/${renderBefore} instances／半徑 ${RENDER_RADIUS}m。`;
  return true;
}

optimizeGeo();
const priorSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>({...priorSnapshot(),worldRiverPerformanceReady:perfReady,worldRiverPerformanceVersion:'SanchongLuzhouRiverPerformanceV0722',worldRiverViewMode:viewMode,worldRiverViewCenter:{...RIVER_VIEW},worldRiverRenderRadius:RENDER_RADIUS,worldRiverRenderBudgetProfile:fixtureMode?'fixture-exercise':'live-safari',worldRiverRenderBefore:renderBefore,worldRiverRenderVisible:renderVisible,worldRiverRenderStats:JSON.parse(JSON.stringify(renderStats))});
window.__RIVER_PERF__={snapshot:()=>baseReal.snapshot(),optimize:optimizeGeo,riverView:{...RIVER_VIEW}};

function goView(mode){const u=new URL(location.href);if(mode==='river')u.searchParams.set('view','river');else u.searchParams.delete('view');location.href=u.toString()}
document.getElementById('riverView')?.addEventListener('click',()=>goView('river'));
document.getElementById('cityView')?.addEventListener('click',()=>goView('city'));
// Reloads rebuild the V0.7.2.1 group. Re-apply the light render profile after the new river layer settles.
document.getElementById('loadRoads')?.addEventListener('click',()=>setTimeout(async()=>{for(let i=0;i<160;i++){if(baseReal.snapshot().worldRiverReady){optimizeGeo();break}await new Promise(r=>setTimeout(r,250))}},900));
