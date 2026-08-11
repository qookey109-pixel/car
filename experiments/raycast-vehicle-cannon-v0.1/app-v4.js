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
renderer.toneMappingExposure=1.12;
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07121b);
scene.fog=new THREE.Fog(0x07121b,76,220);

const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,380);
camera.position.set(.72,3.35,9.4);

scene.add(new THREE.HemisphereLight(0xc9e8ff,0x131b17,1.55));
const sun=new THREE.DirectionalLight(0xfff1d8,2.9);
sun.position.set(-22,32,14);sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun);
const rim=new THREE.DirectionalLight(0x5ab7ff,1.5);rim.position.set(14,9,-20);scene.add(rim);
const fill=new THREE.DirectionalLight(0xff6b7d,.42);fill.position.set(-12,5,18);scene.add(fill);

const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase=new CANNON.SAPBroadphase(world);world.allowSleep=true;world.defaultContactMaterial.friction=0;world.defaultContactMaterial.restitution=0;world.solver.iterations=10;
const groundMaterial=new CANNON.Material('ground');
const groundBody=new CANNON.Body({mass:0,material:groundMaterial});groundBody.addShape(new CANNON.Plane());groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(groundBody);

const road=new THREE.Mesh(new THREE.PlaneGeometry(22,220),new THREE.MeshStandardMaterial({color:0x242a30,roughness:.94,metalness:.015}));road.rotation.x=-Math.PI/2;road.receiveShadow=true;road.position.z=-60;scene.add(road);
const shoulderMat=new THREE.MeshStandardMaterial({color:0x10161b,roughness:1});
for(const x of [-13,13]){const s=new THREE.Mesh(new THREE.PlaneGeometry(4,220),shoulderMat);s.rotation.x=-Math.PI/2;s.position.set(x,.002,-60);scene.add(s)}
for(let z=48;z>-166;z-=8){const m=new THREE.Mesh(new THREE.PlaneGeometry(.16,4),new THREE.MeshStandardMaterial({color:0xe9e4c7,roughness:.7}));m.rotation.x=-Math.PI/2;m.position.set(0,.009,z);scene.add(m)}
for(const x of [-5.5,5.5])for(let z=48;z>-166;z-=6){const m=new THREE.Mesh(new THREE.PlaneGeometry(.09,3),new THREE.MeshStandardMaterial({color:0xaebbc6,roughness:.76}));m.rotation.x=-Math.PI/2;m.position.set(x,.008,z);scene.add(m)}
function addBarrier(x,z,len=216){const body=new CANNON.Body({mass:0});body.addShape(new CANNON.Box(new CANNON.Vec3(.28,.42,len/2)));body.position.set(x,.42,z);world.addBody(body);const mesh=new THREE.Mesh(new THREE.BoxGeometry(.56,.84,len),new THREE.MeshStandardMaterial({color:0x59646e,roughness:.52,metalness:.5}));mesh.position.copy(body.position);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh)}
addBarrier(-11.2,-60);addBarrier(11.2,-60);
for(const [x,z,h] of [[-3,-82,.12],[3,-88,.18],[-3,-94,.24]]){const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Box(new CANNON.Vec3(2,h/2,1.1)));b.position.set(x,h/2,z);world.addBody(b);const m=new THREE.Mesh(new THREE.BoxGeometry(4,h,2.2),new THREE.MeshStandardMaterial({color:0x39434b,roughness:.8}));m.position.copy(b.position);m.receiveShadow=true;scene.add(m)}
const buildingMats=[0x112632,0x26323d,0x183645].map(color=>new THREE.MeshStandardMaterial({color,roughness:.8,metalness:.06}));
for(let i=0;i<32;i++){const side=i%2?-1:1,x=side*(18+(i%4)*2.3),z=44-i*7.05,h=5+(i%5)*2.4;const b=new THREE.Mesh(new THREE.BoxGeometry(6,h,5),buildingMats[i%3]);b.position.set(x,h/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);if(i%2===0){const glow=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.1),new THREE.MeshBasicMaterial({color:0x4aa7d9,transparent:true,opacity:.2}));glow.position.set(x-side*3.02,h*.58,z);glow.rotation.y=side>0?-Math.PI/2:Math.PI/2;scene.add(glow)}}

const chassisShape=new CANNON.Box(new CANNON.Vec3(.95,.3,2.0));
const chassisBody=new CANNON.Body({mass:900,linearDamping:.12,angularDamping:.42});chassisBody.addShape(chassisShape,new CANNON.Vec3(0,.12,0));chassisBody.position.set(0,1.25,30);chassisBody.allowSleep=false;
const vehicle=new CANNON.RaycastVehicle({chassisBody,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
const wheelOptions={radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),axleLocal:new CANNON.Vec3(-1,0,0),suspensionStiffness:34,suspensionRestLength:.34,frictionSlip:4.2,dampingRelaxation:2.4,dampingCompression:4.8,maxSuspensionForce:100000,rollInfluence:.045,maxSuspensionTravel:.22,customSlidingRotationalSpeed:-26,useCustomSlidingRotationalSpeed:true};
const wheelPoints=[[-.88,-.08,-1.45],[.88,-.08,-1.45],[-.88,-.08,1.45],[.88,-.08,1.45]];for(const p of wheelPoints)vehicle.addWheel({...wheelOptions,chassisConnectionPointLocal:new CANNON.Vec3(...p)});vehicle.addToWorld(world);

function loftBody(sections,material){
  const ring=s=>[[-s.w*.73,s.bottom],[-s.w,s.mid],[-s.shoulder,s.top],[-s.deck,s.crown],[s.deck,s.crown],[s.shoulder,s.top],[s.w,s.mid],[s.w*.73,s.bottom],[0,s.under]];
  const rings=sections.map(ring),positions=[];for(let i=0;i<sections.length;i++){for(const [x,y] of rings[i])positions.push(x,y,sections[i].z)}
  const N=9,idx=[];for(let s=0;s<sections.length-1;s++)for(let j=0;j<N;j++){const a=s*N+j,b=s*N+(j+1)%N,c=(s+1)*N+(j+1)%N,d=(s+1)*N+j;idx.push(a,b,c,a,c,d)}
  for(let j=1;j<N-1;j++)idx.push(0,j,j+1);const o=(sections.length-1)*N;for(let j=1;j<N-1;j++)idx.push(o,o+j+1,o+j);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.castShadow=m.receiveShadow=true;return m;
}
function quad(points,material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.castShadow=true;return m}
function box(w,h,d,material,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;return m}
function cyl(rt,rb,h,seg,material,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;return m}

const chassisMesh=new THREE.Group();
const paint=new THREE.MeshPhysicalMaterial({color:0x238cf2,roughness:.25,metalness:.52,clearcoat:.8,clearcoatRoughness:.16,flatShading:true});
const paintDark=new THREE.MeshStandardMaterial({color:0x0b579f,roughness:.35,metalness:.5,flatShading:true});
const carbon=new THREE.MeshStandardMaterial({color:0x080d12,roughness:.46,metalness:.5,flatShading:true});
const wellMat=new THREE.MeshStandardMaterial({color:0x030609,roughness:.96,metalness:.02,side:THREE.DoubleSide});
const glass=new THREE.MeshPhysicalMaterial({color:0x071924,roughness:.1,metalness:.12,transparent:true,opacity:.69,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide});
const headLamp=new THREE.MeshStandardMaterial({color:0xe8fbff,emissive:0x76ddff,emissiveIntensity:2,roughness:.1});
const rearLamp=new THREE.MeshStandardMaterial({color:0xff3849,emissive:0xd31427,emissiveIntensity:1.85,roughness:.2});
const metal=new THREE.MeshStandardMaterial({color:0xb8c2c9,roughness:.22,metalness:.92,flatShading:true});
const brakeMat=new THREE.MeshStandardMaterial({color:0xe34a33,roughness:.4,metalness:.55});
const seamMat=new THREE.MeshBasicMaterial({color:0x06121b,transparent:true,opacity:.72});

const bodySections=[
 {z:-2.36,w:.58,shoulder:.48,deck:.28,bottom:-.17,mid:-.01,top:.17,crown:.23,under:-.22},
 {z:-2.05,w:.82,shoulder:.72,deck:.48,bottom:-.18,mid:.07,top:.27,crown:.32,under:-.23},
 {z:-1.55,w:1.03,shoulder:.92,deck:.69,bottom:-.19,mid:.16,top:.39,crown:.43,under:-.23},
 {z:-.78,w:1.07,shoulder:.94,deck:.72,bottom:-.19,mid:.20,top:.48,crown:.52,under:-.23},
 {z:.12,w:1.06,shoulder:.94,deck:.72,bottom:-.19,mid:.21,top:.50,crown:.54,under:-.23},
 {z:1.08,w:1.07,shoulder:.94,deck:.72,bottom:-.19,mid:.20,top:.46,crown:.50,under:-.23},
 {z:1.63,w:1.04,shoulder:.91,deck:.67,bottom:-.18,mid:.16,top:.39,crown:.43,under:-.22},
 {z:2.13,w:.94,shoulder:.81,deck:.58,bottom:-.16,mid:.09,top:.32,crown:.36,under:-.20},
 {z:2.34,w:.73,shoulder:.62,deck:.42,bottom:-.13,mid:.02,top:.24,crown:.28,under:-.17}
];
chassisMesh.add(loftBody(bodySections,paint));
const roofSections=[
 {z:-.68,w:.66,shoulder:.58,deck:.42,bottom:.45,mid:.50,top:.61,crown:.71,under:.42},
 {z:-.32,w:.69,shoulder:.61,deck:.45,bottom:.45,mid:.58,top:.79,crown:.92,under:.42},
 {z:.42,w:.71,shoulder:.63,deck:.46,bottom:.45,mid:.60,top:.81,crown:.96,under:.42},
 {z:.82,w:.69,shoulder:.60,deck:.44,bottom:.44,mid:.57,top:.76,crown:.88,under:.41},
 {z:1.20,w:.60,shoulder:.52,deck:.38,bottom:.42,mid:.49,top:.61,crown:.70,under:.40}
];
chassisMesh.add(loftBody(roofSections,paintDark));

// Glass and pillars make the cabin read as a real volume from rear-quarter camera.
chassisMesh.add(quad([[-.61,.50,-.70],[.61,.50,-.70],[.54,.89,-.28],[-.54,.89,-.28]],glass));
chassisMesh.add(quad([[-.55,.91,.52],[.55,.91,.52],[.60,.48,1.20],[-.60,.48,1.20]],glass));
for(const side of [-1,1]){
  chassisMesh.add(quad([[side*.70,.50,-.55],[side*.57,.86,-.22],[side*.59,.87,.56],[side*.67,.49,1.06]],glass));
  // door skin, sill and real dark door gap
  chassisMesh.add(quad([[side*1.071,.08,-.60],[side*1.071,.39,-.46],[side*1.058,.39,.80],[side*1.058,.05,.93]],paintDark));
  chassisMesh.add(box(.025,.36,.018,seamMat,side*1.079,.24,-.48));
  chassisMesh.add(box(.025,.34,.018,seamMat,side*1.07,.22,.91));
  chassisMesh.add(box(.055,.028,.28,carbon,side*1.082,.31,.06));
  chassisMesh.add(box(.13,.13,3.02,carbon,side*1.08,-.10,.12));
  chassisMesh.add(box(.23,.13,.34,paintDark,side*.94,.62,-.48,0,side*.18,0));
  chassisMesh.add(quad([[side*1.085,.01,.72],[side*1.085,.28,.65],[side*1.078,.27,1.18],[side*1.078,-.01,1.35]],carbon));
  // dark inner wheel wells: creates actual depth/negative-space illusion behind the tires
  for(const z of [-1.45,1.45]){
    const well=new THREE.Mesh(new THREE.CircleGeometry(.48,20),wellMat);well.position.set(side*1.075,.15,z);well.rotation.y=side>0?-Math.PI/2:Math.PI/2;chassisMesh.add(well);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.48,.065,6,20,Math.PI),paintDark);arch.position.set(side*1.09,.17,z);arch.rotation.set(0,Math.PI/2,side>0?Math.PI:0);arch.castShadow=true;chassisMesh.add(arch);
  }
}
// hood creases / vents / grille
for(const x of [-.48,.48]){const crease=box(.018,.018,1.08,seamMat,x,.445,-1.25,.10,0,x<0?-.035:.035);chassisMesh.add(crease)}
for(const x of [-.36,.36])chassisMesh.add(box(.26,.035,.48,carbon,x,.38,-1.15,-.06));
const grille=box(1.18,.22,.055,carbon,0,.02,-2.35,-.04);chassisMesh.add(grille);
for(let x=-.45;x<=.45;x+=.18)chassisMesh.add(box(.035,.16,.065,metal,x,.02,-2.39));
chassisMesh.add(box(2.12,.075,.54,carbon,0,-.20,-2.08));
chassisMesh.add(box(1.98,.17,.18,carbon,0,-.04,-2.31));
for(const x of [-.61,.61]){const h=box(.50,.14,.075,headLamp,x,.21,-2.335,0,0,x<0?-.06:.06);chassisMesh.add(h)}
// rear JDM-style dark garnish and lamps
chassisMesh.add(box(1.95,.21,.07,carbon,0,.19,2.345));
for(const x of [-.64,.64])chassisMesh.add(box(.49,.13,.078,rearLamp,x,.20,2.386));
chassisMesh.add(box(1.68,.12,.34,carbon,0,-.17,2.19,.10));
chassisMesh.add(box(1.82,.075,.38,carbon,0,.79,1.83,-.07));
for(const x of [-.60,.60])chassisMesh.add(box(.075,.37,.09,carbon,x,.60,1.78));
for(const x of [-.31,.31])chassisMesh.add(cyl(.078,.095,.28,10,metal,x,-.07,2.42,Math.PI/2));
// A/B/C pillars add thickness to cabin silhouette
for(const side of [-1,1]){
  chassisMesh.add(box(.075,.46,.075,carbon,side*.62,.67,-.51,0,0,side*.18));
  chassisMesh.add(box(.07,.47,.07,carbon,side*.66,.68,.28));
  chassisMesh.add(box(.075,.44,.075,carbon,side*.62,.64,.94,0,0,-side*.17));
}
scene.add(chassisMesh);

const wheelMeshes=[];
for(let i=0;i<4;i++){
  const g=new THREE.Group();
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.29,16),new THREE.MeshStandardMaterial({color:0x07090b,roughness:.86,metalness:.04,flatShading:true}));tire.rotation.z=Math.PI/2;tire.castShadow=true;g.add(tire);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.302,20),new THREE.MeshStandardMaterial({color:0x59636a,roughness:.36,metalness:.78}));disc.rotation.z=Math.PI/2;g.add(disc);
  const rimHub=new THREE.Mesh(new THREE.CylinderGeometry(.082,.082,.318,12),metal);rimHub.rotation.z=Math.PI/2;g.add(rimHub);
  for(let s=0;s<6;s++){const a=s*Math.PI/3;const spoke=box(.026,.055,.27,metal,0,0,0,0,0,a);spoke.position.set(0,Math.cos(a)*.115,Math.sin(a)*.115);spoke.rotation.x=a;g.add(spoke)}
  const caliper=box(.075,.18,.09,brakeMat,0,.18,.05);g.add(caliper);
  wheelMeshes.push(g);scene.add(g);
}

// Soft procedural contact shadow makes the car visibly sit on the road.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sx=shadowCanvas.getContext('2d');const grad=sx.createRadialGradient(64,64,8,64,64,58);grad.addColorStop(0,'rgba(0,0,0,.60)');grad.addColorStop(.55,'rgba(0,0,0,.34)');grad.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=grad;sx.fillRect(0,0,128,128);const shadowTex=new THREE.CanvasTexture(shadowCanvas);const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(3.2,5.3),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:.7}));contactShadow.rotation.x=-Math.PI/2;scene.add(contactShadow);

const controls={gas:false,brake:false,left:false,right:false,drift:false};
let ready=false,driftState='GRIP',fps=0,frameCount=0,fpsClock=performance.now();
const normalRearFriction=4.2,driftRearFriction=1.25,normalFrontFriction=4.2,driftFrontFriction=3.3;
function resetCar(){chassisBody.position.set(0,1.25,30);chassisBody.quaternion.set(0,0,0,1);chassisBody.velocity.setZero();chassisBody.angularVelocity.setZero();chassisBody.force.setZero();chassisBody.torque.setZero();vehicle.applyEngineForce(0,2);vehicle.applyEngineForce(0,3);for(let i=0;i<4;i++){vehicle.setBrake(0,i);vehicle.setSteeringValue(0,i)}}
const keyMap={KeyW:'gas',ArrowUp:'gas',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'drift'};
addEventListener('keydown',e=>{if(e.code==='KeyR'){resetCar();return}const k=keyMap[e.code];if(k){controls[k]=true;e.preventDefault()}});addEventListener('keyup',e=>{const k=keyMap[e.code];if(k){controls[k]=false;e.preventDefault()}});
for(const btn of document.querySelectorAll('[data-action]')){const action=btn.dataset.action;if(action==='reset'){btn.addEventListener('pointerdown',e=>{e.preventDefault();resetCar()});continue}const down=e=>{e.preventDefault();try{btn.setPointerCapture(e.pointerId)}catch{}controls[action]=true;btn.classList.add('active')};const up=e=>{e.preventDefault();controls[action]=false;btn.classList.remove('active');try{btn.releasePointerCapture(e.pointerId)}catch{}};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up)}
function localVelocity(){const inv=chassisBody.quaternion.inverse();return inv.vmult(chassisBody.velocity,new CANNON.Vec3())}
function updateVehicleInput(dt){
 const speed=Math.abs(vehicle.currentVehicleSpeedKmHour||0),steerInput=(controls.left?1:0)-(controls.right?1:0),steerMax=lerp(.48,.17,clamp(speed/145,0,1)),steering=steerInput*steerMax;vehicle.setSteeringValue(steering,0);vehicle.setSteeringValue(steering,1);
 const forwardFactor=clamp(1-speed/178,.16,1),engineForce=controls.gas?6200*forwardFactor:0;vehicle.applyEngineForce(engineForce,2);vehicle.applyEngineForce(engineForce,3);
 let brake=0;if(controls.brake){if(speed<4&&!controls.gas){vehicle.applyEngineForce(-2600,2);vehicle.applyEngineForce(-2600,3)}else brake=42}for(let i=0;i<4;i++)vehicle.setBrake(brake,i);
 if(controls.drift&&speed>18&&Math.abs(steerInput)>.05){driftState='DRIFT';vehicle.wheelInfos[0].frictionSlip=driftFrontFriction;vehicle.wheelInfos[1].frictionSlip=driftFrontFriction;vehicle.wheelInfos[2].frictionSlip=driftRearFriction;vehicle.wheelInfos[3].frictionSlip=driftRearFriction;vehicle.setBrake(Math.max(brake,6),2);vehicle.setBrake(Math.max(brake,6),3);chassisBody.angularVelocity.y+=steerInput*clamp(speed/100,.2,1)*.018}else{driftState=controls.drift?'ARMED':'GRIP';vehicle.wheelInfos[0].frictionSlip=normalFrontFriction;vehicle.wheelInfos[1].frictionSlip=normalFrontFriction;vehicle.wheelInfos[2].frictionSlip=normalRearFriction;vehicle.wheelInfos[3].frictionSlip=normalRearFriction}
 const up=chassisBody.quaternion.vmult(new CANNON.Vec3(0,1,0));chassisBody.torque.x+=-up.z*2600*dt;chassisBody.torque.z+=up.x*2600*dt;
}
function syncVisuals(){chassisMesh.position.copy(chassisBody.position);chassisMesh.quaternion.copy(chassisBody.quaternion);for(let i=0;i<vehicle.wheelInfos.length;i++){vehicle.updateWheelTransform(i);const t=vehicle.wheelInfos[i].worldTransform;wheelMeshes[i].position.copy(t.position);wheelMeshes[i].quaternion.copy(t.quaternion)}contactShadow.position.set(chassisBody.position.x,.016,chassisBody.position.z);const q=chassisBody.quaternion;const yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z));contactShadow.rotation.z=-yaw}
const camOffset=new THREE.Vector3(.72,3.15,8.15),lookOffset=new THREE.Vector3(-.10,.48,-4.2),desiredCam=new THREE.Vector3(),desiredLook=new THREE.Vector3();
function updateCamera(dt){const q=new THREE.Quaternion(chassisBody.quaternion.x,chassisBody.quaternion.y,chassisBody.quaternion.z,chassisBody.quaternion.w);desiredCam.copy(camOffset).applyQuaternion(q).add(chassisMesh.position);desiredLook.copy(lookOffset).applyQuaternion(q).add(chassisMesh.position);camera.position.lerp(desiredCam,1-Math.exp(-6.5*dt));camera.lookAt(desiredLook);camera.fov=lerp(camera.fov,driftState==='DRIFT'?62:56,1-Math.exp(-7*dt));camera.updateProjectionMatrix()}
function snapshot(){const lv=localVelocity(),slip=Math.abs(Math.atan2(lv.x,Math.abs(lv.z)+.01)*180/Math.PI);let compression=0;for(const w of vehicle.wheelInfos)compression+=clamp((w.suspensionRestLength-w.suspensionLength)/Math.max(.01,w.suspensionRestLength),0,1);compression/=vehicle.wheelInfos.length;return {ready,speedKmh:Math.round(Math.abs(vehicle.currentVehicleSpeedKmHour||0)),grounded:vehicle.numWheelsOnGround,wheels:vehicle.wheelInfos.length,slipDeg:+slip.toFixed(1),suspensionCompression:+compression.toFixed(3),driftState,fps,chassisY:+chassisBody.position.y.toFixed(3),position:{x:+chassisBody.position.x.toFixed(2),y:+chassisBody.position.y.toFixed(2),z:+chassisBody.position.z.toFixed(2)},visualVersion:'LowPolySportCoupeV4'} }
const el={speed:document.querySelector('#speed'),grounded:document.querySelector('#grounded'),slip:document.querySelector('#slip'),suspension:document.querySelector('#suspension'),state:document.querySelector('#state'),fps:document.querySelector('#fps')};
function updateHud(){const s=snapshot();el.speed.textContent=`${s.speedKmh} km/h`;el.grounded.textContent=`輪胎接地 ${s.grounded}/4`;el.grounded.className=`chip ${s.grounded>=3?'good':'warn'}`;el.slip.textContent=`滑移 ${s.slipDeg}°`;el.suspension.textContent=`懸吊 ${Math.round(s.suspensionCompression*100)}%`;el.state.textContent=s.driftState;el.state.className=`chip ${s.driftState==='DRIFT'?'warn':''}`;el.fps.textContent=`FPS ${s.fps||'--'}`}
let last=performance.now();function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.05);last=now;updateVehicleInput(dt);world.step(1/60,dt,4);syncVisuals();updateCamera(dt);renderer.render(scene,camera);frameCount++;if(now-fpsClock>=500){fps=Math.round(frameCount*1000/(now-fpsClock));frameCount=0;fpsClock=now}updateHud();ready=true}requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5))});
window.__RAYCAST_LAB__={snapshot,reset:resetCar,setControls:next=>Object.assign(controls,next),versions:{three:'0.185.0',cannon:'0.20.0'},visualVersion:'LowPolySportCoupeV4'};
