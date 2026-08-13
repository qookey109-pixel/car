import * as THREE from 'three';

// V0.7.3 is a visual-only Taiwan urban identity wrapper.
// It intentionally keeps V53, LowPolySportCoupeV5/RaycastVehicle, roads,
// city footprints, streetscape and river geometry untouched.
let capturedScene=null;
const nativeAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return nativeAdd.apply(this,objects)};
await import('../real-world-raycast-v0.7.2.2-sanchong-luzhou-river-performance/app.js');
THREE.Scene.prototype.add=nativeAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
if(!scene||!baseReal)throw new Error('SanchongLuzhouV073 failed to attach to V0.7.2.2 runtime');

const urbanGroup=new THREE.Group();urbanGroup.name='SanchongLuzhouTaiwanUrbanIdentityV073';scene.add(urbanGroup);
const BUDGET={buildings:420,windowBands:900,balconies:620,awnings:260,signs:220,ac:520,tanks:180};
let ready=false,counts={windowBands:0,balconies:0,awnings:0,signs:0,ac:0,tanks:0},drawMeshes=0;

const mat={
  window:new THREE.MeshLambertMaterial({color:0x243845,emissive:0x071016,emissiveIntensity:.08}),
  balcony:new THREE.MeshLambertMaterial({color:0xb5b2a8}),
  railing:new THREE.MeshLambertMaterial({color:0x525b5d}),
  awning:new THREE.MeshLambertMaterial({color:0xc65f42}),
  signA:new THREE.MeshBasicMaterial({color:0xe94d56}),
  signB:new THREE.MeshBasicMaterial({color:0x2e99b5}),
  signC:new THREE.MeshBasicMaterial({color:0xe0ad3f}),
  ac:new THREE.MeshLambertMaterial({color:0xd9d8ce}),
  tank:new THREE.MeshLambertMaterial({color:0xaeb9bd})
};

const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),dummy=new THREE.Object3D(),off=new THREE.Vector3();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hashBuilding(b){return Math.abs((Math.round(b.p.x*3)*73856093)^(Math.round(b.p.z*3)*19349663));}
function localOffset(b,x,y,z){off.set(x,y,z).applyQuaternion(b.q);return b.p.clone().add(off);}
function setBox(mesh,i,b,px,py,pz,sx,sy,sz){dummy.position.copy(localOffset(b,px,py,pz));dummy.quaternion.copy(b.q);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
function addInstanced(geometry,material,count){if(count<=0)return null;const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.castShadow=false;mesh.receiveShadow=true;urbanGroup.add(mesh);drawMeshes++;return mesh}
function finish(mesh){if(mesh)mesh.instanceMatrix.needsUpdate=true}

function collectBuildings(){
  const city=scene.getObjectByName('SanchongLuzhouCityLayerV07');if(!city)return [];
  const out=[];
  for(const mesh of city.children.filter(o=>o.isInstancedMesh&&o.userData.cityRole==='building')){
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,m);m.decompose(p,q,s);if(s.x<2.5||s.z<2.5||s.y<5)continue;
      out.push({p:p.clone(),q:q.clone(),s:s.clone(),dist:Math.hypot(p.x,p.z)});
    }
  }
  out.sort((a,b)=>a.dist-b.dist);return out.slice(0,BUDGET.buildings);
}

function buildIdentity(buildings){
  urbanGroup.clear();drawMeshes=0;counts={windowBands:0,balconies:0,awnings:0,signs:0,ac:0,tanks:0};
  if(!buildings.length)return false;

  const windowItems=[],balconyItems=[],awningItems=[],signItems=[[],[],[]],acItems=[],tankItems=[];
  for(const b of buildings){
    const h=hashBuilding(b),front=(h&1)?1:-1,frontZ=front*(b.s.z*.5+.055),usableH=Math.max(3,b.s.y*.82);
    const floorBands=clamp(Math.floor(b.s.y/6),1,3);
    for(let n=0;n<floorBands&&windowItems.length<BUDGET.windowBands;n++)windowItems.push({b,front,z:frontZ,y:-b.s.y*.30+(n+1)*(usableH/(floorBands+1))});
    const balconyN=b.s.y>10?2:1;
    for(let n=0;n<balconyN&&balconyItems.length<BUDGET.balconies;n++)balconyItems.push({b,front,z:front*(b.s.z*.5+.34),y:-b.s.y*.22+n*clamp(b.s.y*.18,1.6,3.1)});
    if((h%3)!==0&&awningItems.length<BUDGET.awnings)awningItems.push({b,front,z:front*(b.s.z*.5+.42),y:-b.s.y*.5+2.45});
    if((h%4)!==0&&signItems.flat().length<BUDGET.signs)signItems[h%3].push({b,front,z:front*(b.s.z*.5+.12),y:-b.s.y*.5+clamp(b.s.y*.36,3.4,7.8),side:(h&2)?1:-1});
    if(acItems.length<BUDGET.ac)acItems.push({b,front,z:front*(b.s.z*.5+.12),y:-b.s.y*.08,side:(h&4)?1:-1});
    if(b.s.y>12&&(h%3)!==1&&tankItems.length<BUDGET.tanks)tankItems.push({b,y:b.s.y*.5+.48,side:(h&8)?1:-1});
  }

  const windowMesh=addInstanced(new THREE.BoxGeometry(1,1,1),mat.window,windowItems.length);
  windowItems.forEach((it,i)=>setBox(windowMesh,i,it.b,0,it.y,it.z,it.b.s.x*.62,clamp(it.b.s.y*.045,.32,.62),.07));finish(windowMesh);counts.windowBands=windowItems.length;

  const balconyMesh=addInstanced(new THREE.BoxGeometry(1,1,1),mat.balcony,balconyItems.length);
  const railMesh=addInstanced(new THREE.BoxGeometry(1,1,1),mat.railing,balconyItems.length);
  balconyItems.forEach((it,i)=>{setBox(balconyMesh,i,it.b,0,it.y,it.z,it.b.s.x*.54,.10,.62);setBox(railMesh,i,it.b,0,it.y+.42,it.z+it.front*.27,it.b.s.x*.54,.56,.055)});finish(balconyMesh);finish(railMesh);counts.balconies=balconyItems.length;

  const awningMesh=addInstanced(new THREE.BoxGeometry(1,1,1),mat.awning,awningItems.length);
  awningItems.forEach((it,i)=>setBox(awningMesh,i,it.b,0,it.y,it.z,it.b.s.x*.70,.12,.72));finish(awningMesh);counts.awnings=awningItems.length;

  signItems.forEach((items,k)=>{const sm=addInstanced(new THREE.BoxGeometry(1,1,1),[mat.signA,mat.signB,mat.signC][k],items.length);items.forEach((it,i)=>setBox(sm,i,it.b,it.side*(it.b.s.x*.5-.28),it.y,it.z,.44,clamp(it.b.s.y*.20,1.3,2.8),.12));finish(sm)});counts.signs=signItems.reduce((n,a)=>n+a.length,0);

  const acMesh=addInstanced(new THREE.BoxGeometry(1,1,1),mat.ac,acItems.length);
  acItems.forEach((it,i)=>setBox(acMesh,i,it.b,it.side*it.b.s.x*.28,it.y,it.z,.56,.38,.24));finish(acMesh);counts.ac=acItems.length;

  const tankMesh=addInstanced(new THREE.CylinderGeometry(.34,.34,.72,8),mat.tank,tankItems.length);
  tankItems.forEach((it,i)=>{dummy.position.copy(localOffset(it.b,it.side*it.b.s.x*.18,it.y,0));dummy.quaternion.copy(it.b.q);dummy.scale.set(1,1,1);dummy.updateMatrix();tankMesh.setMatrixAt(i,dummy.matrix)});finish(tankMesh);counts.tanks=tankItems.length;

  ready=true;
  const status=document.getElementById('identityStatus');if(status)status.textContent=`V0.7.3 台灣城市語彙：窗帶 ${counts.windowBands}／陽台 ${counts.balconies}／雨棚 ${counts.awnings}／招牌 ${counts.signs}／冷氣 ${counts.ac}／水塔 ${counts.tanks}。`;
  const chip=document.getElementById('identity');if(chip){chip.textContent=`城市語彙 ${counts.signs}/${counts.balconies}`;chip.className='chip good'}
  return true;
}

async function waitAndBuild(){
  for(let i=0;i<240;i++){
    const snap=baseReal.snapshot();
    if(snap.worldCityReady&&scene.getObjectByName('SanchongLuzhouCityLayerV07')){const buildings=collectBuildings();if(buildIdentity(buildings))return;}
    await new Promise(r=>setTimeout(r,250));
  }
  throw new Error('V0.7.3 city identity timed out waiting for city layer');
}
await waitAndBuild();

const priorSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>({...priorSnapshot(),worldUrbanIdentityReady:ready,worldUrbanIdentityVersion:'SanchongLuzhouTaiwanUrbanIdentityV073',worldUrbanIdentityBuildingBudget:BUDGET.buildings,worldUrbanIdentityCounts:{...counts},worldUrbanIdentityDrawMeshes:drawMeshes});
window.__URBAN_IDENTITY__={snapshot:()=>baseReal.snapshot(),rebuild:()=>buildIdentity(collectBuildings())};

document.getElementById('loadRoads')?.addEventListener('click',()=>setTimeout(async()=>{ready=false;for(let i=0;i<240;i++){const s=baseReal.snapshot();if(s.worldCityReady){const buildings=collectBuildings();if(buildIdentity(buildings))break}await new Promise(r=>setTimeout(r,250))}},1200));
