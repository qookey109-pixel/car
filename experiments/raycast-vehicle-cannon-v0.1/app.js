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
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07131c);
scene.fog=new THREE.Fog(0x07131c,70,190);

const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,350);
camera.position.set(0,5,12);

scene.add(new THREE.HemisphereLight(0x9fdcff,0x152019,1.7));
const sun=new THREE.DirectionalLight(0xffffff,2.2);
sun.position.set(-25,35,18);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;
scene.add(sun);

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

const road=new THREE.Mesh(new THREE.PlaneGeometry(22,190),new THREE.MeshStandardMaterial({color:0x252b31,roughness:.92,metalness:.02}));
road.rotation.x=-Math.PI/2;road.receiveShadow=true;road.position.z=-48;scene.add(road);
const shoulderMat=new THREE.MeshStandardMaterial({color:0x161b20,roughness:1});
for(const x of [-13,13]){const s=new THREE.Mesh(new THREE.PlaneGeometry(4,190),shoulderMat);s.rotation.x=-Math.PI/2;s.position.set(x,0.002,-48);scene.add(s)}
for(let z=42;z>-142;z-=8){const mark=new THREE.Mesh(new THREE.PlaneGeometry(.16,4),new THREE.MeshBasicMaterial({color:0xf4f2c9}));mark.rotation.x=-Math.PI/2;mark.position.set(0,.008,z);scene.add(mark)}
for(const x of [-5.5,5.5]){for(let z=42;z>-142;z-=6){const mark=new THREE.Mesh(new THREE.PlaneGeometry(.09,3),new THREE.MeshBasicMaterial({color:0xbac3cb}));mark.rotation.x=-Math.PI/2;mark.position.set(x,.007,z);scene.add(mark)}}

function addBarrier(x,z,len=188){
  const body=new CANNON.Body({mass:0});body.addShape(new CANNON.Box(new CANNON.Vec3(.28,.42,len/2)));body.position.set(x,.42,z);world.addBody(body);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.56,.84,len),new THREE.MeshStandardMaterial({color:0x5e6872,roughness:.6,metalness:.5}));mesh.position.copy(body.position);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
}
addBarrier(-11.2,-48);addBarrier(11.2,-48);

// Small suspension test pads far enough from spawn not to disturb the automated launch test.
for(const [x,z,h] of [[-3,-82,.12],[3,-88,.18],[-3,-94,.24]]){
  const body=new CANNON.Body({mass:0});body.addShape(new CANNON.Box(new CANNON.Vec3(2.0,h/2,1.1)));body.position.set(x,h/2,z);world.addBody(body);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(4,h,2.2),new THREE.MeshStandardMaterial({color:0x39434b,roughness:.8}));mesh.position.copy(body.position);mesh.receiveShadow=true;scene.add(mesh);
}

for(let i=0;i<26;i++){
  const side=i%2?-1:1;const x=side*(18+(i%4)*2.3);const z=38-i*7.2;const h=5+(i%5)*2.2;
  const b=new THREE.Mesh(new THREE.BoxGeometry(6,h,5),new THREE.MeshStandardMaterial({color:i%3?0x132b38:0x27323c,roughness:.8,metalness:.08}));
  b.position.set(x,h/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);
}

const chassisShape=new CANNON.Box(new CANNON.Vec3(.95,.3,2.0));
const chassisBody=new CANNON.Body({mass:900,linearDamping:.12,angularDamping:.42});
chassisBody.addShape(chassisShape,new CANNON.Vec3(0,.12,0));
chassisBody.position.set(0,1.25,30);
chassisBody.allowSleep=false;

const vehicle=new CANNON.RaycastVehicle({chassisBody,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
const wheelOptions={
  radius:.36,
  directionLocal:new CANNON.Vec3(0,-1,0),
  axleLocal:new CANNON.Vec3(-1,0,0),
  suspensionStiffness:34,
  suspensionRestLength:.34,
  frictionSlip:4.2,
  dampingRelaxation:2.4,
  dampingCompression:4.8,
  maxSuspensionForce:100000,
  rollInfluence:.045,
  maxSuspensionTravel:.22,
  customSlidingRotationalSpeed:-26,
  useCustomSlidingRotationalSpeed:true
};
const wheelPoints=[[-.88,-.08,-1.45],[.88,-.08,-1.45],[-.88,-.08,1.45],[.88,-.08,1.45]];
for(const p of wheelPoints)vehicle.addWheel({...wheelOptions,chassisConnectionPointLocal:new CANNON.Vec3(...p)});
vehicle.addToWorld(world);

const chassisMesh=new THREE.Group();
const bodyMesh=new THREE.Mesh(new THREE.BoxGeometry(1.9,.6,4.0),new THREE.MeshStandardMaterial({color:0x31a7ff,roughness:.32,metalness:.55}));
bodyMesh.position.y=.12;bodyMesh.castShadow=true;chassisMesh.add(bodyMesh);
const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.45,.48,1.7),new THREE.MeshStandardMaterial({color:0x142536,roughness:.18,metalness:.55}));
cabin.position.set(0,.56,.15);cabin.castShadow=true;chassisMesh.add(cabin);
const nose=new THREE.Mesh(new THREE.BoxGeometry(1.5,.15,.7),new THREE.MeshStandardMaterial({color:0x8fe1ff,emissive:0x163948,emissiveIntensity:.6}));nose.position.set(0,.16,-1.82);chassisMesh.add(nose);
scene.add(chassisMesh);

const wheelMeshes=[];
for(let i=0;i<4;i++){
  const group=new THREE.Group();
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.25,20),new THREE.MeshStandardMaterial({color:0x111315,roughness:.72,metalness:.15}));
  tire.rotation.z=Math.PI/2;tire.castShadow=true;group.add(tire);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.27,16),new THREE.MeshStandardMaterial({color:0x9aa7b2,roughness:.35,metalness:.8}));hub.rotation.z=Math.PI/2;group.add(hub);
  wheelMeshes.push(group);scene.add(group);
}

const controls={gas:false,brake:false,left:false,right:false,drift:false};
let ready=false,driftState='GRIP',fps=0,frameCount=0,fpsClock=performance.now();
const normalRearFriction=4.2,driftRearFriction=1.25,normalFrontFriction=4.2,driftFrontFriction=3.3;

function resetCar(){
  chassisBody.position.set(0,1.25,30);chassisBody.quaternion.set(0,0,0,1);chassisBody.velocity.setZero();chassisBody.angularVelocity.setZero();chassisBody.force.setZero();chassisBody.torque.setZero();
  vehicle.applyEngineForce(0,2);vehicle.applyEngineForce(0,3);for(let i=0;i<4;i++){vehicle.setBrake(0,i);vehicle.setSteeringValue(0,i)}
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
  const q=chassisBody.quaternion;const inv=q.inverse();return inv.vmult(chassisBody.velocity,new CANNON.Vec3());
}

function updateVehicleInput(dt){
  const speed=Math.abs(vehicle.currentVehicleSpeedKmHour||0);
  const steerInput=(controls.left?1:0)-(controls.right?1:0);
  const steerMax=lerp(.48,.17,clamp(speed/145,0,1));
  const steering=steerInput*steerMax;
  vehicle.setSteeringValue(steering,0);vehicle.setSteeringValue(steering,1);

  const forwardFactor=clamp(1-speed/178,.16,1);
  const engineForce=controls.gas?-6200*forwardFactor:0;
  vehicle.applyEngineForce(engineForce,2);vehicle.applyEngineForce(engineForce,3);

  let brake=0;
  if(controls.brake){
    if(speed<4&&!controls.gas){vehicle.applyEngineForce(2600,2);vehicle.applyEngineForce(2600,3)}else brake=42;
  }
  for(let i=0;i<4;i++)vehicle.setBrake(brake,i);

  if(controls.drift&&speed>24&&Math.abs(steerInput)>.05){
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

  // Mild anti-roll / arcade stabilization. The raycast suspension remains responsible for vertical movement.
  const up=chassisBody.quaternion.vmult(new CANNON.Vec3(0,1,0));
  chassisBody.torque.x+=-up.z*2600*dt;
  chassisBody.torque.z+=up.x*2600*dt;
}

function syncVisuals(){
  chassisMesh.position.copy(chassisBody.position);chassisMesh.quaternion.copy(chassisBody.quaternion);
  for(let i=0;i<vehicle.wheelInfos.length;i++){
    vehicle.updateWheelTransform(i);const t=vehicle.wheelInfos[i].worldTransform;wheelMeshes[i].position.copy(t.position);wheelMeshes[i].quaternion.copy(t.quaternion);
  }
}

const camOffset=new THREE.Vector3(0,3.7,8.8),lookOffset=new THREE.Vector3(0,.7,-4.7),desiredCam=new THREE.Vector3(),desiredLook=new THREE.Vector3();
function updateCamera(dt){
  const q=new THREE.Quaternion(chassisBody.quaternion.x,chassisBody.quaternion.y,chassisBody.quaternion.z,chassisBody.quaternion.w);
  desiredCam.copy(camOffset).applyQuaternion(q).add(chassisMesh.position);
  desiredLook.copy(lookOffset).applyQuaternion(q).add(chassisMesh.position);
  camera.position.lerp(desiredCam,1-Math.exp(-6*dt));
  camera.lookAt(desiredLook);
  const targetFov=driftState==='DRIFT'?66:60;camera.fov=lerp(camera.fov,targetFov,1-Math.exp(-7*dt));camera.updateProjectionMatrix();
}

function snapshot(){
  const lv=localVelocity();const slip=Math.abs(Math.atan2(lv.x,Math.abs(lv.z)+.01)*180/Math.PI);
  let compression=0;
  for(const w of vehicle.wheelInfos)compression+=clamp((w.suspensionRestLength-w.suspensionLength)/Math.max(.01,w.suspensionRestLength),0,1);
  compression/=vehicle.wheelInfos.length;
  return {ready,speedKmh:Math.round(Math.abs(vehicle.currentVehicleSpeedKmHour||0)),grounded:vehicle.numWheelsOnGround,wheels:vehicle.wheelInfos.length,slipDeg:+slip.toFixed(1),suspensionCompression:+compression.toFixed(3),driftState,fps,chassisY:+chassisBody.position.y.toFixed(3),position:{x:+chassisBody.position.x.toFixed(2),y:+chassisBody.position.y.toFixed(2),z:+chassisBody.position.z.toFixed(2)}};
}

const el={speed:document.querySelector('#speed'),grounded:document.querySelector('#grounded'),slip:document.querySelector('#slip'),suspension:document.querySelector('#suspension'),state:document.querySelector('#state'),fps:document.querySelector('#fps')};
function updateHud(){const s=snapshot();el.speed.textContent=`${s.speedKmh} km/h`;el.grounded.textContent=`輪胎接地 ${s.grounded}/4`;el.grounded.className=`chip ${s.grounded>=3?'good':'warn'}`;el.slip.textContent=`滑移 ${s.slipDeg}°`;el.suspension.textContent=`懸吊 ${Math.round(s.suspensionCompression*100)}%`;el.state.textContent=s.driftState;el.state.className=`chip ${s.driftState==='DRIFT'?'warn':''}`;el.fps.textContent=`FPS ${s.fps||'--'}`}

let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.05);last=now;
  updateVehicleInput(dt);world.step(1/60,dt,4);syncVisuals();updateCamera(dt);renderer.render(scene,camera);
  frameCount++;if(now-fpsClock>=500){fps=Math.round(frameCount*1000/(now-fpsClock));frameCount=0;fpsClock=now}updateHud();ready=true;
}
requestAnimationFrame(loop);

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5))});

window.__RAYCAST_LAB__={snapshot,reset:resetCar,setControls:(next)=>Object.assign(controls,next),versions:{three:'0.185.0',cannon:'0.20.0'}};
