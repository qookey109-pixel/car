import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x08131d);
scene.fog=new THREE.Fog(0x08131d,72,205);

const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,360);
camera.position.set(.5,4,11);

scene.add(new THREE.HemisphereLight(0xc2e6ff,0x172018,1.65));
const sun=new THREE.DirectionalLight(0xfff4df,2.8);
sun.position.set(-24,34,15);
sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;
scene.add(sun);
const rimLight=new THREE.DirectionalLight(0x5aaeff,1.35);
rimLight.position.set(16,10,-20);
scene.add(rimLight);

const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase=new CANNON.SAPBroadphase(world);
world.allowSleep=true;
world.defaultContactMaterial.friction=0;
world.defaultContactMaterial.restitution=0;
world.solver.iterations=10;

const groundMaterial=new CANNON.Material('ground');
const groundBody=new CANNON.Body({mass:0,material:groundMaterial});
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);
world.addBody(groundBody);

const asphalt=new THREE.MeshStandardMaterial({color:0x242a30,roughness:.93,metalness:.02});
const road=new THREE.Mesh(new THREE.PlaneGeometry(22,205),asphalt);
road.rotation.x=-Math.PI/2;road.receiveShadow=true;road.position.z=-53;scene.add(road);

const shoulderMat=new THREE.MeshStandardMaterial({color:0x11171c,roughness:1});
for(const x of [-13,13]){
  const s=new THREE.Mesh(new THREE.PlaneGeometry(4,205),shoulderMat);
  s.rotation.x=-Math.PI/2;s.position.set(x,.002,-53);scene.add(s);
}
for(let z=46;z>-154;z-=8){
  const mark=new THREE.Mesh(new THREE.PlaneGeometry(.16,4),new THREE.MeshStandardMaterial({color:0xe9e4c7,roughness:.7}));
  mark.rotation.x=-Math.PI/2;mark.position.set(0,.009,z);scene.add(mark);
}
for(const x of [-5.5,5.5]){
  for(let z=46;z>-154;z-=6){
    const mark=new THREE.Mesh(new THREE.PlaneGeometry(.09,3),new THREE.MeshStandardMaterial({color:0xaebbc6,roughness:.75}));
    mark.rotation.x=-Math.PI/2;mark.position.set(x,.008,z);scene.add(mark);
  }
}

function addBarrier(x,z,len=200){
  const body=new CANNON.Body({mass:0});
  body.addShape(new CANNON.Box(new CANNON.Vec3(.28,.42,len/2)));
  body.position.set(x,.42,z);world.addBody(body);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.56,.84,len),new THREE.MeshStandardMaterial({color:0x5c6670,roughness:.52,metalness:.52}));
  mesh.position.copy(body.position);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
}
addBarrier(-11.2,-53);addBarrier(11.2,-53);

for(const [x,z,h] of [[-3,-82,.12],[3,-88,.18],[-3,-94,.24]]){
  const body=new CANNON.Body({mass:0});
  body.addShape(new CANNON.Box(new CANNON.Vec3(2,h/2,1.1)));
  body.position.set(x,h/2,z);world.addBody(body);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(4,h,2.2),new THREE.MeshStandardMaterial({color:0x39434b,roughness:.8}));
  mesh.position.copy(body.position);mesh.receiveShadow=true;scene.add(mesh);
}

const buildingMats=[
  new THREE.MeshStandardMaterial({color:0x132733,roughness:.78,metalness:.08}),
  new THREE.MeshStandardMaterial({color:0x26323d,roughness:.82,metalness:.04}),
  new THREE.MeshStandardMaterial({color:0x1b3544,roughness:.76,metalness:.08})
];
for(let i=0;i<30;i++){
  const side=i%2?-1:1;
  const x=side*(18+(i%4)*2.3),z=42-i*7.0,h=5+(i%5)*2.4;
  const b=new THREE.Mesh(new THREE.BoxGeometry(6,h,5),buildingMats[i%buildingMats.length]);
  b.position.set(x,h/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);
  if(i%2===0){
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.1),new THREE.MeshBasicMaterial({color:0x4aa7d9,transparent:true,opacity:.22}));
    glow.position.set(x-side*3.02,h*.58,z);glow.rotation.y=side>0?-Math.PI/2:Math.PI/2;scene.add(glow);
  }
}

const chassisShape=new CANNON.Box(new CANNON.Vec3(.95,.3,2.0));
const chassisBody=new CANNON.Body({mass:900,linearDamping:.12,angularDamping:.42});
chassisBody.addShape(chassisShape,new CANNON.Vec3(0,.12,0));
chassisBody.position.set(0,1.25,30);
chassisBody.allowSleep=false;

const vehicle=new CANNON.RaycastVehicle({chassisBody,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
const wheelOptions={
  radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),axleLocal:new CANNON.Vec3(-1,0,0),
  suspensionStiffness:34,suspensionRestLength:.34,frictionSlip:4.2,
  dampingRelaxation:2.4,dampingCompression:4.8,maxSuspensionForce:100000,
  rollInfluence:.045,maxSuspensionTravel:.22,customSlidingRotationalSpeed:-26,
  useCustomSlidingRotationalSpeed:true
};
const wheelPoints=[[-.88,-.08,-1.45],[.88,-.08,-1.45],[-.88,-.08,1.45],[.88,-.08,1.45]];
for(const p of wheelPoints)vehicle.addWheel({...wheelOptions,chassisConnectionPointLocal:new CANNON.Vec3(...p)});
vehicle.addToWorld(world);

function loftBody(sections,material){
  const ring=(s)=>[
    [-s.w*.72,s.bottom],[-s.w,s.mid],[-s.shoulder,s.top],[0,s.crown],
    [s.shoulder,s.top],[s.w,s.mid],[s.w*.72,s.bottom],[0,s.under]
  ];
  const positions=[],rings=sections.map(ring);
  for(let i=0;i<sections.length;i++){
    const z=sections[i].z;
    for(const [x,y] of rings[i])positions.push(x,y,z);
  }
  const idx=[],N=8;
  for(let s=0;s<sections.length-1;s++){
    for(let j=0;j<N;j++){
      const a=s*N+j,b=s*N+(j+1)%N,c=(s+1)*N+(j+1)%N,d=(s+1)*N+j;
      idx.push(a,b,c,a,c,d);
    }
  }
  idx.push(0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,7);
  const o=(sections.length-1)*N;
  idx.push(o,o+2,o+1,o,o+3,o+2,o,o+4,o+3,o,o+5,o+4,o,o+6,o+5,o,o+7,o+6);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(idx);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}
function quad(points,material){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.castShadow=true;return m;
}
function box(w,h,d,material,x,y,z,rx=0,ry=0,rz=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;return m;
}

const chassisMesh=new THREE.Group();
const paint=new THREE.MeshStandardMaterial({color:0x2896ff,roughness:.28,metalness:.58,flatShading:true});
const paintShadow=new THREE.MeshStandardMaterial({color:0x0f5ca6,roughness:.38,metalness:.5,flatShading:true});
const carbon=new THREE.MeshStandardMaterial({color:0x0a0f14,roughness:.5,metalness:.48,flatShading:true});
const glass=new THREE.MeshPhysicalMaterial({color:0x081925,roughness:.12,metalness:.15,transparent:true,opacity:.74,clearcoat:.9,clearcoatRoughness:.12});
const headLamp=new THREE.MeshStandardMaterial({color:0xe4f8ff,emissive:0x7fe2ff,emissiveIntensity:1.8,roughness:.12});
const rearLamp=new THREE.MeshStandardMaterial({color:0xff3d49,emissive:0xc11120,emissiveIntensity:1.7,roughness:.22});
const metal=new THREE.MeshStandardMaterial({color:0xaeb8c0,roughness:.25,metalness:.9,flatShading:true});
const brakeMat=new THREE.MeshStandardMaterial({color:0xe04434,roughness:.48,metalness:.5});

const bodySections=[
  {z:-2.22,w:.68,shoulder:.52,bottom:-.17,mid:.03,top:.22,crown:.27,under:-.21},
  {z:-1.72,w:.96,shoulder:.86,bottom:-.18,mid:.12,top:.35,crown:.40,under:-.22},
  {z:-.78,w:1.02,shoulder:.9,bottom:-.18,mid:.18,top:.48,crown:.54,under:-.22},
  {z:.08,w:1.03,shoulder:.91,bottom:-.18,mid:.20,top:.50,crown:.55,under:-.22},
  {z:1.18,w:1.01,shoulder:.88,bottom:-.18,mid:.18,top:.44,crown:.48,under:-.22},
  {z:1.76,w:.96,shoulder:.82,bottom:-.17,mid:.12,top:.36,crown:.40,under:-.21},
  {z:2.16,w:.78,shoulder:.66,bottom:-.13,mid:.05,top:.28,crown:.31,under:-.18}
];
chassisMesh.add(loftBody(bodySections,paint));

const roofSections=[
  {z:-.62,w:.67,shoulder:.58,bottom:.43,mid:.49,top:.65,crown:.80,under:.41},
  {z:-.18,w:.70,shoulder:.62,bottom:.43,mid:.54,top:.78,crown:.93,under:.41},
  {z:.58,w:.72,shoulder:.64,bottom:.43,mid:.55,top:.79,crown:.93,under:.41},
  {z:1.12,w:.64,shoulder:.56,bottom:.42,mid:.50,top:.64,crown:.72,under:.40}
];
chassisMesh.add(loftBody(roofSections,paintShadow));

const windshield=quad([[-.61,.49,-.66],[.61,.49,-.66],[.54,.88,-.19],[-.54,.88,-.19]],glass);chassisMesh.add(windshield);
const rearGlass=quad([[-.56,.87,.62],[.56,.87,.62],[.61,.49,1.13],[-.61,.49,1.13]],glass);chassisMesh.add(rearGlass);
for(const side of [-1,1]){
  const sideWin=quad([
    [side*.69,.49,-.51],[side*.57,.84,-.13],[side*.59,.84,.58],[side*.67,.49,1.02]
  ],glass);chassisMesh.add(sideWin);
  const door=quad([
    [side*1.036,.10,-.55],[side*1.036,.40,-.42],[side*1.025,.39,.82],[side*1.025,.06,.92]
  ],paintShadow);chassisMesh.add(door);
  chassisMesh.add(box(.07,.035,.32,carbon,side*1.045,.32,.02,0,0,0));
  const mirror=box(.24,.13,.34,paintShadow,side*.92,.61,-.47,0,side*.18,0);chassisMesh.add(mirror);

  const intake=quad([
    [side*1.045,.04,.76],[side*1.045,.29,.66],[side*1.04,.27,1.15],[side*1.04,.02,1.28]
  ],carbon);chassisMesh.add(intake);
}

for(const [x,z] of [[-.88,-1.45],[.88,-1.45],[-.88,1.45],[.88,1.45]]){
  const arch=new THREE.Mesh(new THREE.TorusGeometry(.47,.055,5,14,Math.PI),carbon);
  arch.position.set(x>0?1.035:-1.035,.18,z);
  arch.rotation.set(0,Math.PI/2,x>0?Math.PI:0);
  arch.castShadow=true;chassisMesh.add(arch);
}

chassisMesh.add(box(2.08,.08,.52,carbon,0,-.19,-1.95,0,0,0));
chassisMesh.add(box(1.94,.18,.18,carbon,0,-.04,-2.10,0,0,0));
chassisMesh.add(box(1.94,.18,.20,carbon,0,-.03,2.08,0,0,0));
for(const x of [-.58,.58])chassisMesh.add(box(.48,.15,.08,headLamp,x,.22,-2.115,0,0,x<0?-.04:.04));
for(const x of [-.61,.61])chassisMesh.add(box(.48,.14,.075,rearLamp,x,.20,2.118));
chassisMesh.add(box(1.76,.08,.38,carbon,0,.78,1.76,-.07));
for(const x of [-.58,.58])chassisMesh.add(box(.075,.36,.09,carbon,x,.59,1.72));
for(const x of [-.28,.28]){
  const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.26,8),metal);
  pipe.rotation.x=Math.PI/2;pipe.position.set(x,-.06,2.21);pipe.castShadow=true;chassisMesh.add(pipe);
}
const diffuser=box(1.58,.12,.30,carbon,0,-.12,2.00,-.08);chassisMesh.add(diffuser);

const hoodLine=box(.015,.012,1.14,carbon,0,.535,-1.23,-.14);chassisMesh.add(hoodLine);
for(const x of [-.48,.48])chassisMesh.add(box(.34,.035,.52,carbon,x,.44,-1.58,-.12,0,0));

scene.add(chassisMesh);

const wheelMeshes=[];
for(let i=0;i<4;i++){
  const group=new THREE.Group();
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.29,14),new THREE.MeshStandardMaterial({color:0x090b0e,roughness:.82,metalness:.04,flatShading:true}));
  tire.rotation.z=Math.PI/2;tire.castShadow=true;group.add(tire);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.305,10),metal);rim.rotation.z=Math.PI/2;group.add(rim);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.315,8),carbon);hub.rotation.z=Math.PI/2;group.add(hub);
  const caliper=box(.07,.22,.10,brakeMat,0,0,0);caliper.rotation.z=Math.PI/2;group.add(caliper);
  wheelMeshes.push(group);scene.add(group);
}

const controls={gas:false,brake:false,left:false,right:false,drift:false};
let ready=false,driftState='GRIP',fps=0,frameCount=0,fpsClock=performance.now();
const normalRearFriction=4.2,driftRearFriction=1.25,normalFrontFriction=4.2,driftFrontFriction=3.3;

function resetCar(){
  chassisBody.position.set(0,1.25,30);chassisBody.quaternion.set(0,0,0,1);
  chassisBody.velocity.setZero();chassisBody.angularVelocity.setZero();chassisBody.force.setZero();chassisBody.torque.setZero();
  vehicle.applyEngineForce(0,2);vehicle.applyEngineForce(0,3);
  for(let i=0;i<4;i++){vehicle.setBrake(0,i);vehicle.setSteeringValue(0,i)}
}
const keyMap={KeyW:'gas',ArrowUp:'gas',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'drift'};
addEventListener('keydown',e=>{if(e.code==='KeyR'){resetCar();return}const k=keyMap[e.code];if(k){controls[k]=true;e.preventDefault()}});
addEventListener('keyup',e=>{const k=keyMap[e.code];if(k){controls[k]=false;e.preventDefault()}});
for(const btn of document.querySelectorAll('[data-action]')){
  const action=btn.dataset.action;
  if(action==='reset'){btn.addEventListener('pointerdown',e=>{e.preventDefault();resetCar()});continue}
  const down=e=>{e.preventDefault();try{btn.setPointerCapture(e.pointerId)}catch{}controls[action]=true;btn.classList.add('active')};
  const up=e=>{e.preventDefault();controls[action]=false;btn.classList.remove('active');try{btn.releasePointerCapture(e.pointerId)}catch{}};
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
}

function localVelocity(){
  const inv=chassisBody.quaternion.inverse();
  return inv.vmult(chassisBody.velocity,new CANNON.Vec3());
}
function updateVehicleInput(dt){
  const speed=Math.abs(vehicle.currentVehicleSpeedKmHour||0);
  const steerInput=(controls.left?1:0)-(controls.right?1:0);
  const steerMax=lerp(.48,.17,clamp(speed/145,0,1));
  const steering=steerInput*steerMax;
  vehicle.setSteeringValue(steering,0);vehicle.setSteeringValue(steering,1);
  const forwardFactor=clamp(1-speed/178,.16,1);
  const engineForce=controls.gas?6200*forwardFactor:0;
  vehicle.applyEngineForce(engineForce,2);vehicle.applyEngineForce(engineForce,3);

  let brake=0;
  if(controls.brake){
    if(speed<4&&!controls.gas){vehicle.applyEngineForce(-2600,2);vehicle.applyEngineForce(-2600,3)}
    else brake=42;
  }
  for(let i=0;i<4;i++)vehicle.setBrake(brake,i);

  if(controls.drift&&speed>18&&Math.abs(steerInput)>.05){
    driftState='DRIFT';
    vehicle.wheelInfos[0].frictionSlip=driftFrontFriction;vehicle.wheelInfos[1].frictionSlip=driftFrontFriction;
    vehicle.wheelInfos[2].frictionSlip=driftRearFriction;vehicle.wheelInfos[3].frictionSlip=driftRearFriction;
    vehicle.setBrake(Math.max(brake,6),2);vehicle.setBrake(Math.max(brake,6),3);
    chassisBody.angularVelocity.y+=steerInput*clamp(speed/100,.2,1)*.018;
  }else{
    driftState=controls.drift?'ARMED':'GRIP';
    vehicle.wheelInfos[0].frictionSlip=normalFrontFriction;vehicle.wheelInfos[1].frictionSlip=normalFrontFriction;
    vehicle.wheelInfos[2].frictionSlip=normalRearFriction;vehicle.wheelInfos[3].frictionSlip=normalRearFriction;
  }
  const up=chassisBody.quaternion.vmult(new CANNON.Vec3(0,1,0));
  chassisBody.torque.x+=-up.z*2600*dt;
  chassisBody.torque.z+=up.x*2600*dt;
}

function syncVisuals(){
  chassisMesh.position.copy(chassisBody.position);chassisMesh.quaternion.copy(chassisBody.quaternion);
  for(let i=0;i<vehicle.wheelInfos.length;i++){
    vehicle.updateWheelTransform(i);
    const t=vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(t.position);wheelMeshes[i].quaternion.copy(t.quaternion);
  }
}

const camOffset=new THREE.Vector3(.48,3.15,7.55);
const lookOffset=new THREE.Vector3(0,.52,-4.4);
const desiredCam=new THREE.Vector3(),desiredLook=new THREE.Vector3();
function updateCamera(dt){
  const q=new THREE.Quaternion(chassisBody.quaternion.x,chassisBody.quaternion.y,chassisBody.quaternion.z,chassisBody.quaternion.w);
  const lv=localVelocity();
  const shoulder=clamp(lv.x*.018,-.42,.42);
  desiredCam.copy(camOffset).applyQuaternion(q).add(chassisMesh.position);
  desiredCam.x+=shoulder;
  desiredLook.copy(lookOffset).applyQuaternion(q).add(chassisMesh.position);
  camera.position.lerp(desiredCam,1-Math.exp(-6.5*dt));
  camera.lookAt(desiredLook);
  const speed=Math.abs(vehicle.currentVehicleSpeedKmHour||0);
  const targetFov=(driftState==='DRIFT'?66:58)+clamp(speed/180,0,1)*4;
  camera.fov=lerp(camera.fov,targetFov,1-Math.exp(-7*dt));camera.updateProjectionMatrix();
}

function snapshot(){
  const lv=localVelocity();
  const slip=Math.abs(Math.atan2(lv.x,Math.abs(lv.z)+.01)*180/Math.PI);
  let compression=0;
  for(const w of vehicle.wheelInfos)compression+=clamp((w.suspensionRestLength-w.suspensionLength)/Math.max(.01,w.suspensionRestLength),0,1);
  compression/=vehicle.wheelInfos.length;
  return {
    ready,speedKmh:Math.round(Math.abs(vehicle.currentVehicleSpeedKmHour||0)),
    grounded:vehicle.numWheelsOnGround,wheels:vehicle.wheelInfos.length,
    slipDeg:+slip.toFixed(1),suspensionCompression:+compression.toFixed(3),
    driftState,fps,chassisY:+chassisBody.position.y.toFixed(3),
    visualVersion:'LowPolySportCoupeV3',
    position:{x:+chassisBody.position.x.toFixed(2),y:+chassisBody.position.y.toFixed(2),z:+chassisBody.position.z.toFixed(2)}
  };
}
const el={
  speed:document.querySelector('#speed'),grounded:document.querySelector('#grounded'),
  slip:document.querySelector('#slip'),suspension:document.querySelector('#suspension'),
  state:document.querySelector('#state'),fps:document.querySelector('#fps')
};
function updateHud(){
  const s=snapshot();
  el.speed.textContent=`${s.speedKmh} km/h`;
  el.grounded.textContent=`輪胎接地 ${s.grounded}/4`;el.grounded.className=`chip ${s.grounded>=3?'good':'warn'}`;
  el.slip.textContent=`滑移 ${s.slipDeg}°`;el.suspension.textContent=`懸吊 ${Math.round(s.suspensionCompression*100)}%`;
  el.state.textContent=s.driftState;el.state.className=`chip ${s.driftState==='DRIFT'?'warn':''}`;
  el.fps.textContent=`FPS ${s.fps||'--'}`;
}

let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-last)/1000,.05);last=now;
  updateVehicleInput(dt);world.step(1/60,dt,4);syncVisuals();updateCamera(dt);
  renderer.render(scene,camera);
  frameCount++;
  if(now-fpsClock>=500){fps=Math.round(frameCount*1000/(now-fpsClock));frameCount=0;fpsClock=now}
  updateHud();ready=true;
}
requestAnimationFrame(loop);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
});

window.__RAYCAST_LAB__={
  snapshot,reset:resetCar,setControls:(next)=>Object.assign(controls,next),
  versions:{three:'0.185.0',cannon:'0.20.0',visual:'LowPolySportCoupeV3'}
};
