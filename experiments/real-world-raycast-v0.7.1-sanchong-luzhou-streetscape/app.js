import * as THREE from 'three';

// V0.7.1 is visual-only. It layers streetscape detail on the validated V0.7 city world.
let capturedScene=null;
const originalSceneAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return originalSceneAdd.apply(this,objects)};
await import('../real-world-raycast-v0.7-sanchong-luzhou-city/app.js');
THREE.Scene.prototype.add=originalSceneAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
if(!scene||!baseReal)throw new Error('SanchongLuzhouV071 failed to attach to V0.7 runtime');

const STREET_RADIUS=950,MAX_SIDEWALKS=1800,MAX_LIGHTS=420,MAX_TREES=320,MAX_SIGNALS=120;
const streetGroup=new THREE.Group();streetGroup.name='SanchongLuzhouStreetscapeV071';scene.add(streetGroup);
const el={street:document.getElementById('street'),streetSource:document.getElementById('streetSource'),streetStatus:document.getElementById('streetStatus'),lat:document.getElementById('lat'),lon:document.getElementById('lon')};
let mapOrigin={lat:25.0731,lon:121.4810},streetReady=false,streetSource='--',sidewalkCount=0,lightCount=0,treeCount=0,signalCount=0,facadeCount=0,roofCount=0;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function llToLocal(lat,lon){const latRad=mapOrigin.lat*Math.PI/180;return{x:(lon-mapOrigin.lon)*111320*Math.cos(latRad),z:-(lat-mapOrigin.lat)*111320}}
function roadWidth(tags={}){const t=tags.highway||'',lanes=clamp(parseInt(tags.lanes,10)||(['primary','secondary'].includes(t)?4:2),1,8);const laneW=['primary','secondary'].includes(t)?3.3:3.0;const min=({primary:10.5,secondary:9,tertiary:7,residential:5.8,unclassified:5.4,living_street:4.8}[t]||5.4);return Math.max(min,lanes*laneW)}
function disposeObject(o){o.traverse?.(c=>{c.geometry?.dispose?.();if(Array.isArray(c.material))c.material.forEach(m=>m?.dispose?.());else c.material?.dispose?.()})}
function clearStreet(){for(const o of [...streetGroup.children]){streetGroup.remove(o);disposeObject(o)}sidewalkCount=lightCount=treeCount=signalCount=facadeCount=roofCount=0}

function fixtureStreetData(){
  const ways=[
    {tags:{highway:'primary',lanes:'4'},geometry:[{lat:25.0647,lon:121.4810},{lat:25.0816,lon:121.4810}]},
    {tags:{highway:'secondary',lanes:'4'},geometry:[{lat:25.0731,lon:121.4705},{lat:25.0731,lon:121.4915}]},
    {tags:{highway:'tertiary',lanes:'2'},geometry:[{lat:25.0668,lon:121.4740},{lat:25.0796,lon:121.4882}]},
    {tags:{highway:'residential',lanes:'2'},geometry:[{lat:25.0672,lon:121.4870},{lat:25.0790,lon:121.4754}]}
  ];
  const signals=[
    {lat:25.0731,lon:121.4810},{lat:25.0710,lon:121.4787},{lat:25.0750,lon:121.4831},{lat:25.0768,lon:121.4774}
  ];
  return{ways,signals};
}
async function fetchStreetData(lat,lon){
  const q=`[out:json][timeout:30];(way(around:${STREET_RADIUS},${lat},${lon})[highway~\"^(primary|secondary|tertiary|residential|unclassified|living_street)$\"];node(around:${STREET_RADIUS},${lat},${lon})[highway=traffic_signals];);out geom tags;`,eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr;
  for(const url of eps){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(q)}`});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);const data=await r.json();return{ways:(data.elements||[]).filter(e=>e.type==='way'&&e.geometry),signals:(data.elements||[]).filter(e=>e.type==='node'&&e.tags?.highway==='traffic_signals')}}catch(e){lastErr=e}}
  throw lastErr||new Error('Overpass streetscape query unavailable');
}

function collectRoadPieces(data){
  const pieces=[];for(const way of data.ways||[]){const pts=(way.geometry||[]).map(p=>llToLocal(p.lat,p.lon));const w=roadWidth(way.tags);for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<5)continue;const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,dist=Math.hypot(mx,mz);if(dist>STREET_RADIUS*1.08)continue;pieces.push({ax:a.x,az:a.z,bx:b.x,bz:b.z,mx,mz,dx,dz,len,width:w,angle:Math.atan2(dx,dz),dist,tags:way.tags||{}})}}pieces.sort((a,b)=>a.dist-b.dist);return pieces;
}
function placeBox(dummy,mesh,i,x,y,z,angle,w,h,d){dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
function buildSidewalks(pieces){
  const items=[];for(const s of pieces){for(const side of [-1,1]){if(items.length>=MAX_SIDEWALKS)break;items.push({...s,side})}if(items.length>=MAX_SIDEWALKS)break}
  const mat=new THREE.MeshStandardMaterial({color:0xb9bbb4,roughness:.98,metalness:0});const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,items.length);const dummy=new THREE.Object3D();
  items.forEach((s,i)=>{const edge=s.width*.5+1.15,ox=Math.cos(s.angle)*edge*s.side,oz=-Math.sin(s.angle)*edge*s.side;placeBox(dummy,mesh,i,s.mx+ox,.07,s.mz+oz,s.angle,1.75,.14,s.len+.4)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;streetGroup.add(mesh);sidewalkCount=items.length;
}
function sampleStreetPoints(pieces,spacing,maxCount,extraOffset){
  const out=[];for(const s of pieces){const steps=Math.max(1,Math.floor(s.len/spacing));for(let n=0;n<=steps;n++){if(out.length>=maxCount)return out;const t=(n+.35)/(steps+1),x=s.ax+s.dx*t,z=s.az+s.dz*t,side=((out.length+n)&1)?1:-1,edge=s.width*.5+extraOffset,ox=Math.cos(s.angle)*edge*side,oz=-Math.sin(s.angle)*edge*side;out.push({x:x+ox,z:z+oz,angle:s.angle,side,dist:Math.hypot(x,z)})}}return out;
}
function buildLights(points){
  const poleMat=new THREE.MeshStandardMaterial({color:0x4b5558,roughness:.52,metalness:.7});const lampMat=new THREE.MeshStandardMaterial({color:0xfff3c4,emissive:0xffd67a,emissiveIntensity:.85,roughness:.28});const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.07,5.2,6),poleMat,points.length);const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.56,.12,.16),lampMat,points.length);const dummy=new THREE.Object3D();
  points.forEach((p,i)=>{dummy.position.set(p.x,2.6,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();pole.setMatrixAt(i,dummy.matrix);dummy.position.set(p.x,5.17,p.z);dummy.rotation.set(0,p.angle,0);dummy.updateMatrix();head.setMatrixAt(i,dummy.matrix)});pole.instanceMatrix.needsUpdate=true;head.instanceMatrix.needsUpdate=true;pole.castShadow=head.castShadow=true;streetGroup.add(pole,head);lightCount=points.length;
}
function buildTrees(points){
  const trunkMat=new THREE.MeshStandardMaterial({color:0x66513d,roughness:1});const crownMat=new THREE.MeshStandardMaterial({color:0x4f7650,roughness:.95});const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.11,.16,2.1,6),trunkMat,points.length);const crown=new THREE.InstancedMesh(new THREE.ConeGeometry(1.05,2.8,7),crownMat,points.length);const dummy=new THREE.Object3D();
  points.forEach((p,i)=>{dummy.position.set(p.x,1.05,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);dummy.position.set(p.x,3.1,p.z);dummy.scale.set(.9+((i%5)*.04),1,0.9+(((i+2)%5)*.04));dummy.updateMatrix();crown.setMatrixAt(i,dummy.matrix)});trunk.instanceMatrix.needsUpdate=true;crown.instanceMatrix.needsUpdate=true;trunk.castShadow=crown.castShadow=true;streetGroup.add(trunk,crown);treeCount=points.length;
}
function buildSignals(nodes){
  const pts=(nodes||[]).slice(0,MAX_SIGNALS).map(n=>{const p=llToLocal(n.lat,n.lon);return{x:p.x,z:p.z}});if(!pts.length)return;
  const poleMat=new THREE.MeshStandardMaterial({color:0x343b3d,roughness:.5,metalness:.75}),boxMat=new THREE.MeshStandardMaterial({color:0x171b1d,roughness:.65}),red=new THREE.MeshStandardMaterial({color:0x401010,emissive:0xff2d2d,emissiveIntensity:1.2});const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.07,3.7,6),poleMat,pts.length);const box=new THREE.InstancedMesh(new THREE.BoxGeometry(.34,.72,.22),boxMat,pts.length);const lamp=new THREE.InstancedMesh(new THREE.SphereGeometry(.085,6,4),red,pts.length);const dummy=new THREE.Object3D();
  pts.forEach((p,i)=>{dummy.position.set(p.x,1.85,p.z);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();pole.setMatrixAt(i,dummy.matrix);dummy.position.set(p.x,3.45,p.z);dummy.updateMatrix();box.setMatrixAt(i,dummy.matrix);dummy.position.set(p.x,3.62,p.z-.12);dummy.updateMatrix();lamp.setMatrixAt(i,dummy.matrix)});pole.instanceMatrix.needsUpdate=true;box.instanceMatrix.needsUpdate=true;lamp.instanceMatrix.needsUpdate=true;streetGroup.add(pole,box,lamp);signalCount=pts.length;
}
function enhanceBuildings(){
  const city=scene.getObjectByName('SanchongLuzhouCityLayerV07');if(!city)return;
  const buildings=[];const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
  city.children.filter(o=>o.isInstancedMesh).forEach(mesh=>{for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);m.decompose(p,q,s);if(s.y<4||s.x<2||s.z<2)continue;buildings.push({p:p.clone(),q:q.clone(),s:s.clone(),dist:Math.hypot(p.x,p.z)})}});buildings.sort((a,b)=>a.dist-b.dist);const use=buildings.slice(0,1500);if(!use.length)return;
  const bandMat=new THREE.MeshStandardMaterial({color:0x35434b,roughness:.45,metalness:.12,transparent:true,opacity:.82});const roofMat=new THREE.MeshStandardMaterial({color:0x6f7473,roughness:.9});const bands=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bandMat,use.length*2);const roofs=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),roofMat,use.length);const dummy=new THREE.Object3D(),off=new THREE.Vector3();let bi=0;
  use.forEach((b,i)=>{dummy.position.copy(b.p);dummy.position.y=b.p.y+b.s.y*.5+.13;dummy.quaternion.copy(b.q);dummy.scale.set(b.s.x*.90,.22,b.s.z*.90);dummy.updateMatrix();roofs.setMatrixAt(i,dummy.matrix);for(const side of [-1,1]){off.set(0,0,side*(b.s.z*.5+.035)).applyQuaternion(b.q);dummy.position.copy(b.p).add(off);dummy.position.y=b.p.y+b.s.y*.12;dummy.quaternion.copy(b.q);dummy.scale.set(b.s.x*.70,clamp(b.s.y*.055,.28,.72),.08);dummy.updateMatrix();bands.setMatrixAt(bi++,dummy.matrix)}});bands.instanceMatrix.needsUpdate=true;roofs.instanceMatrix.needsUpdate=true;bands.castShadow=false;roofs.castShadow=true;streetGroup.add(bands,roofs);facadeCount=bi;roofCount=use.length;
}
function renderStatus(){el.street.textContent=`街景 ${sidewalkCount}/${lightCount}/${treeCount}`;el.street.className=`chip ${streetReady?'good':'warn'}`;el.streetSource.textContent=`街景 ${streetSource}`;el.streetStatus.textContent=`V0.7.1：人行道 ${sidewalkCount}、路燈 ${lightCount}、路樹 ${treeCount}、號誌 ${signalCount}、建築立面帶 ${facadeCount}。`}
async function waitCity(timeout=42000){const start=performance.now();while(performance.now()-start<timeout){if(baseReal.snapshot().worldCityReady)return;await new Promise(r=>setTimeout(r,120))}throw new Error('V0.7 city layer readiness timeout')}
async function loadStreet(){
  streetReady=false;el.street.textContent='街景載入中';el.street.className='chip warn';clearStreet();mapOrigin={lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};const fixture=new URLSearchParams(location.search).get('fixture')==='1';
  try{const [data]=await Promise.all([fixture?Promise.resolve(fixtureStreetData()):fetchStreetData(mapOrigin.lat,mapOrigin.lon),waitCity()]);const pieces=collectRoadPieces(data);buildSidewalks(pieces);buildLights(sampleStreetPoints(pieces,58,MAX_LIGHTS,2.4));buildTrees(sampleStreetPoints(pieces,82,MAX_TREES,3.5));buildSignals(data.signals);enhanceBuildings();streetSource=fixture?'fixture':'live';streetReady=true;renderStatus()}
  catch(err){const data=fixtureStreetData(),pieces=collectRoadPieces(data);buildSidewalks(pieces);buildLights(sampleStreetPoints(pieces,58,MAX_LIGHTS,2.4));buildTrees(sampleStreetPoints(pieces,82,MAX_TREES,3.5));buildSignals(data.signals);enhanceBuildings();streetSource='fallback';streetReady=true;renderStatus();el.streetStatus.textContent+=` fallback: ${err.message}`;console.warn(err)}
}

const baseSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>({...baseSnapshot(),worldStreetscapeReady:streetReady,worldStreetscapeSource:streetSource,worldSidewalkCount:sidewalkCount,worldStreetLightCount:lightCount,worldStreetTreeCount:treeCount,worldTrafficSignalCount:signalCount,worldFacadeBandCount:facadeCount,worldRoofDetailCount:roofCount,worldStreetscapeVersion:'SanchongLuzhouV071'});
window.__STREETSCAPE__={snapshot:()=>baseReal.snapshot(),reload:loadStreet};
document.getElementById('loadRoads').addEventListener('click',()=>setTimeout(loadStreet,300));
loadStreet();
