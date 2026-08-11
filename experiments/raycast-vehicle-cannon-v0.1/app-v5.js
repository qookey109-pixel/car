import * as THREE from 'three';

// V5 is intentionally a visual-only layer on top of the validated V4 RaycastVehicle.
// Capture the scene created by V4 without exposing or rewriting its physics internals.
let capturedScene=null;
const originalSceneAdd=THREE.Scene.prototype.add;
THREE.Scene.prototype.add=function(...objects){
  if(!capturedScene)capturedScene=this;
  return originalSceneAdd.apply(this,objects);
};

await import('./app-v4.js');
THREE.Scene.prototype.add=originalSceneAdd;

const scene=capturedScene;
if(!scene)throw new Error('LowPolySportCoupeV5 could not capture V4 scene');

const groups=scene.children.filter(o=>o?.isGroup).sort((a,b)=>b.children.length-a.children.length);
const car=groups[0];
const wheels=groups.slice(1).filter(g=>g.children.length>=3).slice(0,4);
if(!car||wheels.length!==4)throw new Error(`LowPolySportCoupeV5 visual targets missing: car=${!!car}, wheels=${wheels.length}`);

const paint=new THREE.MeshPhysicalMaterial({
  color:0x238cf2,roughness:.21,metalness:.55,clearcoat:1,clearcoatRoughness:.11,flatShading:true
});
const paintDark=new THREE.MeshPhysicalMaterial({
  color:0x0c5eaa,roughness:.28,metalness:.55,clearcoat:.72,clearcoatRoughness:.15,flatShading:true
});
const carbon=new THREE.MeshStandardMaterial({color:0x060a0e,roughness:.38,metalness:.58,flatShading:true});
const wellMat=new THREE.MeshStandardMaterial({color:0x010203,roughness:.98,metalness:0,side:THREE.DoubleSide});
const metal=new THREE.MeshStandardMaterial({color:0xc1cbd2,roughness:.2,metalness:.95,flatShading:true});
const darkMetal=new THREE.MeshStandardMaterial({color:0x323a40,roughness:.34,metalness:.82,flatShading:true});
const lensClear=new THREE.MeshPhysicalMaterial({
  color:0xcff7ff,roughness:.06,metalness:.03,transparent:true,opacity:.62,
  clearcoat:1,clearcoatRoughness:.05,depthWrite:false
});
const lensRed=new THREE.MeshPhysicalMaterial({
  color:0xff394b,emissive:0xa70c1b,emissiveIntensity:1.35,roughness:.1,metalness:.02,
  transparent:true,opacity:.82,clearcoat:1,clearcoatRoughness:.05
});
const seam=new THREE.MeshBasicMaterial({color:0x02080d,transparent:true,opacity:.82,side:THREE.DoubleSide});

function box(w,h,d,mat,x,y,z,rx=0,ry=0,rz=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;return m;
}
function quad(points,mat){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;return m;
}
function lens(x,y,z,scale,mat,rotY=0){
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,10,6),mat);
  m.scale.set(scale[0],scale[1],scale[2]);m.position.set(x,y,z);m.rotation.y=rotY;m.castShadow=true;return m;
}
function arch(side,z,r=.49){
  const cavity=new THREE.Mesh(new THREE.CircleGeometry(r*.97,20),wellMat);
  cavity.position.set(side*1.102,.16,z);cavity.rotation.y=side>0?-Math.PI/2:Math.PI/2;car.add(cavity);
  const outer=new THREE.Mesh(new THREE.TorusGeometry(r,.052,6,20,Math.PI),paint);
  outer.position.set(side*1.112,.17,z);outer.rotation.set(0,Math.PI/2,side>0?Math.PI:0);outer.castShadow=true;car.add(outer);
  const inner=new THREE.Mesh(new THREE.TorusGeometry(r-.055,.027,5,18,Math.PI),carbon);
  inner.position.set(side*1.119,.17,z);inner.rotation.set(0,Math.PI/2,side>0?Math.PI:0);car.add(inner);
}

for(const side of [-1,1]){
  for(const z of [-1.45,1.45])arch(side,z);
  car.add(box(.075,.19,.96,paintDark,side*1.095,.26,-1.45));
  car.add(box(.075,.21,1.02,paintDark,side*1.095,.27,1.45));
  car.add(box(.16,.14,3.08,carbon,side*1.095,-.13,.11));
  const blade=quad([
    [side*1.11,-.17,-.62],[side*1.18,-.17,-.42],[side*1.18,-.17,.82],[side*1.11,-.17,1.00]
  ],carbon);car.add(blade);
  car.add(box(.018,.022,2.58,seam,side*1.105,.39,.18));
}

// Sculpted front fascia: center intake, corner brake ducts and canards.
car.add(box(1.28,.24,.09,carbon,0,.01,-2.385,-.03));
for(const side of [-1,1]){
  car.add(quad([
    [side*.93,.16,-2.37],[side*.53,.14,-2.385],[side*.58,-.08,-2.39],[side*1.00,-.04,-2.37]
  ],carbon));
  car.add(box(.34,.055,.34,carbon,side*.92,-.18,-2.20,0,side*.06,side*.05));
}
car.add(box(.72,.035,1.04,paintDark,0,.47,-1.25,-.055));
for(const x of [-.49,.49])car.add(box(.02,.025,1.24,seam,x,.47,-1.27,.095,0,x<0?-.04:.04));

// Volumetric projector lamp housings.
const projectorMat=new THREE.MeshStandardMaterial({
  color:0xf2fdff,emissive:0x8be9ff,emissiveIntensity:3.1,roughness:.08
});
for(const side of [-1,1]){
  const x=side*.62;
  car.add(lens(x,.225,-2.405,[.31,.105,.075],lensClear,side*.08));
  const core=new THREE.Mesh(new THREE.SphereGeometry(.08,8,5),projectorMat);
  core.position.set(x,.225,-2.455);core.scale.set(1.25,.72,.45);car.add(core);
}

// Rear bumper and dimensional tail lamps.
car.add(box(1.86,.16,.13,carbon,0,-.08,2.36,.08));
car.add(box(1.48,.12,.34,carbon,0,-.18,2.18,.12));
for(const side of [-1,1]){
  const x=side*.65;
  car.add(lens(x,.205,2.405,[.30,.095,.075],lensRed,-side*.04));
  car.add(box(.36,.035,.035,metal,x,.20,2.455));
}
car.add(box(.58,.18,.035,wellMat,0,.02,2.438));
const tow=new THREE.Mesh(new THREE.TorusGeometry(.075,.018,5,12),new THREE.MeshStandardMaterial({color:0xe83936,roughness:.38,metalness:.5}));
tow.position.set(.58,-.10,2.45);tow.rotation.x=Math.PI/2;car.add(tow);

// Underbody: visible under pitch/bump, adding believable mass without touching physics.
car.add(box(1.50,.07,3.72,darkMetal,0,-.245,.03));
car.add(box(.12,.08,2.78,metal,0,-.29,.36));
car.add(box(.82,.13,.48,darkMetal,0,-.27,1.76));
for(const x of [-.33,.33]){
  const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,1.1,8),darkMetal);
  pipe.rotation.x=Math.PI/2;pipe.position.set(x,-.27,1.45);car.add(pipe);
}
car.add(box(1.22,.024,.024,seam,0,.90,-.28));
car.add(box(1.20,.024,.024,seam,0,.89,.55));

// Wheel V5: keep the visible detail, but batch repeated nuts/tread blocks as InstancedMesh.
const nutGeometry=new THREE.CylinderGeometry(.012,.012,.342,6);
const treadGeometry=new THREE.BoxGeometry(.305,.040,.105);
const tempObj=new THREE.Object3D();
for(const wheel of wheels){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.205,.018,6,18),metal);
  ring.rotation.y=Math.PI/2;wheel.add(ring);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.335,10),darkMetal);
  hub.rotation.z=Math.PI/2;wheel.add(hub);

  const nuts=new THREE.InstancedMesh(nutGeometry,metal,5);
  for(let n=0;n<5;n++){
    const a=n*Math.PI*2/5;
    tempObj.position.set(0,Math.cos(a)*.055,Math.sin(a)*.055);
    tempObj.rotation.set(0,0,Math.PI/2);
    tempObj.scale.set(1,1,1);tempObj.updateMatrix();nuts.setMatrixAt(n,tempObj.matrix);
  }
  nuts.instanceMatrix.needsUpdate=true;wheel.add(nuts);

  const tread=new THREE.InstancedMesh(treadGeometry,wellMat,14);
  for(let t=0;t<14;t++){
    const a=t*Math.PI*2/14;
    tempObj.position.set(0,Math.cos(a)*.355,Math.sin(a)*.355);
    tempObj.rotation.set(a,0,0);
    tempObj.scale.set(1,1,1);tempObj.updateMatrix();tread.setMatrixAt(t,tempObj.matrix);
  }
  tread.instanceMatrix.needsUpdate=true;wheel.add(tread);
}

const lab=window.__RAYCAST_LAB__;
if(!lab)throw new Error('LowPolySportCoupeV5 could not attach to Raycast lab');
const v4Snapshot=lab.snapshot.bind(lab);
lab.snapshot=()=>({...v4Snapshot(),visualVersion:'LowPolySportCoupeV5'});
lab.visualVersion='LowPolySportCoupeV5';
lab.visualDetails={
  wheelArches:'deep-recessed',headlamps:'volumetric-projector',tailLamps:'volumetric',
  tires:'14-block-tread',underbody:true,bumperDepth:true,wheelDetailBatching:'instanced'
};
