import * as THREE from 'three';

// V0.7.4 is a visual-only polish wrapper on the validated V0.7.3 identity layer.
// It keeps V53, V5 RaycastVehicle, roads, city footprints, streetscape and river geometry untouched.
let capturedScene=null;
const nativeAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return nativeAdd.apply(this,objects)};
await import('../real-world-raycast-v0.7.3-sanchong-luzhou-urban-identity/app.js');
THREE.Scene.prototype.add=nativeAdd;

const scene=capturedScene;
const baseReal=window.__REAL_WORLD_RAYCAST__;
if(!scene||!baseReal||!window.__URBAN_IDENTITY__)throw new Error('SanchongLuzhouV074 failed to attach to V0.7.3 runtime');

const polishGroup=new THREE.Group();
polishGroup.name='SanchongLuzhouUrbanPolishV074';
scene.add(polishGroup);

const BUDGET={
  buildings:360,facadePanels:360,shopfronts:260,canopies:260,arcadeColumns:400,
  horizontalSigns:220,lightboxes:180,parapets:220,busStops:18,windowMullions:520,arcadeBeams:180
};
let ready=false,drawMeshes=0,ownCounts={};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),dummy=new THREE.Object3D(),off=new THREE.Vector3();
const tempColor=new THREE.Color();

const geo={
  box:new THREE.BoxGeometry(1,1,1),
  column:new THREE.CylinderGeometry(.5,.5,1,6),
  sign:new THREE.BoxGeometry(1,1,1)
};
const mat={
  facade:new THREE.MeshLambertMaterial({color:0xffffff,roughness:.9}),
  glass:new THREE.MeshLambertMaterial({color:0x263d47,emissive:0x071117,emissiveIntensity:.14}),
  canopy:new THREE.MeshLambertMaterial({color:0xffffff}),
  column:new THREE.MeshLambertMaterial({color:0xc6c2b7}),
  sign:new THREE.MeshBasicMaterial({color:0xffffff}),
  lightbox:new THREE.MeshBasicMaterial({color:0xffe8aa}),
  parapet:new THREE.MeshLambertMaterial({color:0xa6a49b}),
  mullion:new THREE.MeshLambertMaterial({color:0x3f4a4d}),
  busMetal:new THREE.MeshLambertMaterial({color:0x4d5b5e}),
  busGlass:new THREE.MeshLambertMaterial({color:0x8bb1bc,transparent:true,opacity:.46,depthWrite:false}),
  busBench:new THREE.MeshLambertMaterial({color:0x8c725e}),
  arcadeBeam:new THREE.MeshLambertMaterial({color:0xb7b2a7})
};

function hashBuilding(b){return Math.abs((Math.round(b.p.x*3)*73856093)^(Math.round(b.p.z*3)*19349663));}
function localOffset(b,x,y,z){off.set(x,y,z).applyQuaternion(b.q);return b.p.clone().add(off);}
function setBox(mesh,i,b,x,y,z,sx,sy,sz){dummy.position.copy(localOffset(b,x,y,z));dummy.quaternion.copy(b.q);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
function setCylinder(mesh,i,b,x,y,z,sx,sy,sz){dummy.position.copy(localOffset(b,x,y,z));dummy.quaternion.copy(b.q);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
function addInstanced(geometry,material,count,role){if(count<=0)return null;const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.castShadow=false;mesh.receiveShadow=role!=='lightbox'&&role!=='sign';mesh.userData.polishRole=role;polishGroup.add(mesh);drawMeshes++;return mesh}
function finish(mesh){if(!mesh)return;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true}
function clearPolish(){polishGroup.clear();drawMeshes=0;ownCounts={}}

function collectBuildings(){
  const city=scene.getObjectByName('SanchongLuzhouCityLayerV07');if(!city)return [];
  const out=[];
  for(const mesh of city.children.filter(o=>o.isInstancedMesh&&o.userData.cityRole==='building')){
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,m);m.decompose(p,q,s);
      if(s.x<3||s.z<3||s.y<5)continue;
      const dist=Math.hypot(p.x,p.z);if(dist>900)continue;
      out.push({p:p.clone(),q:q.clone(),s:s.clone(),dist});
    }
  }
  out.sort((a,b)=>a.dist-b.dist);return out.slice(0,BUDGET.buildings);
}

function buildPolish(buildings){
  clearPolish();
  if(!buildings.length)return false;
  const facade=[],shop=[],canopy=[],columns=[],signs=[],lightboxes=[],parapets=[],mullions=[],beams=[],bus=[];
  for(const b of buildings){
    const h=hashBuilding(b),front=(h&1)?1:-1,edge=front*(b.s.z*.5+.035),ground=-b.s.y*.5;
    if(facade.length<BUDGET.facadePanels)facade.push({b,front,z:edge,color:[0xc8bfad,0xb7c1bd,0xb9c3c9,0xc8c1b8,0xaeb9b1][h%5]});
    const commercial=(h%5)!==0&&b.s.x>=4.2;
    if(commercial&&shop.length<BUDGET.shopfronts){
      shop.push({b,front,z:front*(b.s.z*.5+.095),y:ground+1.28});
      if(canopy.length<BUDGET.canopies)canopy.push({b,front,z:front*(b.s.z*.5+.50),y:ground+2.63,color:[0xb95143,0x477e91,0xd09a43,0x697c62][h%4]});
      if(signs.length<BUDGET.horizontalSigns)signs.push({b,front,z:front*(b.s.z*.5+.15),y:ground+3.12,color:[0xdf4f52,0x2d8da7,0xe0a43c,0x53735c][(h>>2)%4]});
      if((h%3)!==0&&lightboxes.length<BUDGET.lightboxes)lightboxes.push({b,front,z:front*(b.s.z*.5+.19),y:ground+4.0,side:(h&8)?1:-1});
      if((h%2)===0&&columns.length+2<=BUDGET.arcadeColumns){
        columns.push({b,front,z:front*(b.s.z*.5+.68),y:ground+1.32,x:-b.s.x*.34});
        columns.push({b,front,z:front*(b.s.z*.5+.68),y:ground+1.32,x:b.s.x*.34});
        if(beams.length<BUDGET.arcadeBeams)beams.push({b,front,z:front*(b.s.z*.5+.68),y:ground+2.62});
      }
    }
    if(b.s.y>8&&parapets.length<BUDGET.parapets)parapets.push({b,front,z:front*(b.s.z*.5-.08),y:b.s.y*.5+.27});
    const floors=clamp(Math.floor(b.s.y/5.2),1,3);
    for(let n=0;n<floors&&mullions.length<BUDGET.windowMullions;n++)mullions.push({b,front,z:front*(b.s.z*.5+.082),y:ground+4.8+n*3.2,side:(n&1)?1:-1});
    if((h%29)===0&&bus.length<BUDGET.busStops&&commercial)bus.push({b,front,z:front*(b.s.z*.5+1.48),x:(h&16)?b.s.x*.36:-b.s.x*.36,ground});
  }

  const facadeMesh=addInstanced(geo.box,mat.facade,facade.length,'facade');
  facade.forEach((it,i)=>{setBox(facadeMesh,i,it.b,0,0,it.z,it.b.s.x*.95,it.b.s.y*.88,.045);facadeMesh.setColorAt(i,tempColor.setHex(it.color))});finish(facadeMesh);

  const shopMesh=addInstanced(geo.box,mat.glass,shop.length,'shopfront');
  shop.forEach((it,i)=>setBox(shopMesh,i,it.b,0,it.y,it.z,it.b.s.x*.72,2.12,.10));finish(shopMesh);

  const canopyMesh=addInstanced(geo.box,mat.canopy,canopy.length,'canopy');
  canopy.forEach((it,i)=>{setBox(canopyMesh,i,it.b,0,it.y,it.z,it.b.s.x*.78,.14,.82);canopyMesh.setColorAt(i,tempColor.setHex(it.color))});finish(canopyMesh);

  const columnMesh=addInstanced(geo.column,mat.column,columns.length,'arcadeColumn');
  columns.forEach((it,i)=>setCylinder(columnMesh,i,it.b,it.x,it.y,it.z,.18,2.64,.18));finish(columnMesh);

  const beamMesh=addInstanced(geo.box,mat.arcadeBeam,beams.length,'arcadeBeam');
  beams.forEach((it,i)=>setBox(beamMesh,i,it.b,0,it.y,it.z,it.b.s.x*.78,.18,.22));finish(beamMesh);

  const signMesh=addInstanced(geo.sign,mat.sign,signs.length,'sign');
  signs.forEach((it,i)=>{setBox(signMesh,i,it.b,0,it.y,it.z,it.b.s.x*.58,.54,.12);signMesh.setColorAt(i,tempColor.setHex(it.color))});finish(signMesh);

  const lightMesh=addInstanced(geo.sign,mat.lightbox,lightboxes.length,'lightbox');
  lightboxes.forEach((it,i)=>setBox(lightMesh,i,it.b,it.side*(it.b.s.x*.5-.24),it.y,it.z,.38,1.18,.15));finish(lightMesh);

  const parapetMesh=addInstanced(geo.box,mat.parapet,parapets.length,'parapet');
  parapets.forEach((it,i)=>setBox(parapetMesh,i,it.b,0,it.y,it.z,it.b.s.x*.88,.48,.16));finish(parapetMesh);

  const mullionMesh=addInstanced(geo.box,mat.mullion,mullions.length,'windowMullion');
  mullions.forEach((it,i)=>setBox(mullionMesh,i,it.b,it.side*it.b.s.x*.20,it.y,it.z,.055,.72,.06));finish(mullionMesh);

  const busRoof=addInstanced(geo.box,mat.busMetal,bus.length,'busStopRoof');
  const busBack=addInstanced(geo.box,mat.busGlass,bus.length,'busStopBack');
  const busBench=addInstanced(geo.box,mat.busBench,bus.length,'busStopBench');
  bus.forEach((it,i)=>{
    setBox(busRoof,i,it.b,it.x,it.ground+2.35,it.z,2.45,.12,1.08);
    setBox(busBack,i,it.b,it.x,it.ground+1.25,it.z-it.front*.43,2.20,2.05,.08);
    setBox(busBench,i,it.b,it.x,it.ground+.55,it.z,1.45,.18,.38);
  });finish(busRoof);finish(busBack);finish(busBench);

  ownCounts={
    facadePanels:facade.length,shopfronts:shop.length,canopies:canopy.length,arcadeColumns:columns.length,
    arcadeBeams:beams.length,horizontalSigns:signs.length,lightboxes:lightboxes.length,parapets:parapets.length,
    windowMullions:mullions.length,busStops:bus.length,selectedBuildings:buildings.length
  };
  ready=true;
  const baseCounts=baseReal.snapshot().worldUrbanIdentityCounts||{};
  const combined={
    windows:(baseCounts.windowBands||0)+mullions.length,
    balconies:baseCounts.balconies||0,
    awnings:(baseCounts.awnings||0)+canopy.length,
    shopfronts:shop.length,
    signs:(baseCounts.signs||0)+signs.length+lightboxes.length,
    acUnits:baseCounts.ac||0,
    rooftopTanks:baseCounts.tanks||0,
    arcadeColumns:columns.length,
    busStops:bus.length,
    facadePanels:facade.length,
    parapets:parapets.length
  };
  const status=document.getElementById('polishStatus');if(status)status.textContent=`V0.7.4 城市總強化：店面 ${combined.shopfronts}／騎樓柱 ${combined.arcadeColumns}／招牌 ${combined.signs}／窗與立面 ${combined.windows}／站牌 ${combined.busStops}。`;
  const chip=document.getElementById('polish');if(chip){chip.textContent=`城市精修 ${combined.shopfronts}/${combined.arcadeColumns}`;chip.className='chip good'}
  return combined;
}

let combinedCounts={};
async function waitAndBuild(){
  for(let i=0;i<260;i++){
    const snap=baseReal.snapshot();
    if(snap.worldUrbanIdentityReady&&scene.getObjectByName('SanchongLuzhouCityLayerV07')){
      const buildings=collectBuildings();const c=buildPolish(buildings);if(c){combinedCounts=c;return;}
    }
    await new Promise(r=>setTimeout(r,250));
  }
  throw new Error('V0.7.4 urban polish timed out waiting for V0.7.3 identity layer');
}
await waitAndBuild();

const priorSnapshot=baseReal.snapshot.bind(baseReal);
baseReal.snapshot=()=>({...priorSnapshot(),
  worldUrbanPolishReady:ready,
  worldUrbanPolishVersion:'SanchongLuzhouUrbanPolishV074',
  worldUrbanPolishSource:'derived-city-v073',
  worldUrbanPolishCounts:{...combinedCounts},
  worldUrbanPolishOwnCounts:{...ownCounts},
  worldUrbanPolishDrawMeshes:drawMeshes,
  worldUrbanPolishRenderStats:{budget:{...BUDGET},selectedBuildings:ownCounts.selectedBuildings||0,drawMeshes}
});
window.__URBAN_POLISH__={snapshot:()=>baseReal.snapshot(),rebuild:()=>{const c=buildPolish(collectBuildings());if(c)combinedCounts=c;return baseReal.snapshot()}};

document.getElementById('loadRoads')?.addEventListener('click',()=>setTimeout(async()=>{
  ready=false;
  for(let i=0;i<260;i++){
    const snap=baseReal.snapshot();
    if(snap.worldUrbanIdentityReady&&snap.worldCityReady){const c=buildPolish(collectBuildings());if(c){combinedCounts=c;break}}
    await new Promise(r=>setTimeout(r,250));
  }
},2800));
