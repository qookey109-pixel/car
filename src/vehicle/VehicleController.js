import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class VehicleController{
  constructor(scene,world){
    this.scene=scene;this.world=world;
    this.input={throttle:0,steer:0,handbrake:false,nitro:false};
    this.nitro=1;this.nitroActive=false;this.driftIntensity=0;this.isDrifting=false;
    this.engineForce=2350;this.reverseForce=1100;this.maxSteer=.48;
    this.spawn={position:new CANNON.Vec3(0,1.2,24),quaternion:new CANNON.Quaternion()};
    this._buildPhysics();this._buildVisual();
  }

  _buildPhysics(){
    const chassisShape=new CANNON.Box(new CANNON.Vec3(.93,.34,1.9));
    this.chassisBody=new CANNON.Body({mass:165,material:new CANNON.Material('car'),position:this.spawn.position.clone()});
    this.chassisBody.addShape(chassisShape,new CANNON.Vec3(0,.05,0));
    this.chassisBody.angularDamping=.48;this.chassisBody.linearDamping=.045;
    this.chassisBody.allowSleep=false;

    this.vehicle=new CANNON.RaycastVehicle({chassisBody:this.chassisBody,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
    const wheel={
      radius:.37,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:38,
      suspensionRestLength:.33,frictionSlip:4.8,dampingRelaxation:2.4,dampingCompression:4.8,
      maxSuspensionForce:100000,rollInfluence:.018,axleLocal:new CANNON.Vec3(-1,0,0),
      chassisConnectionPointLocal:new CANNON.Vec3(),maxSuspensionTravel:.28,customSlidingRotationalSpeed:-28,useCustomSlidingRotationalSpeed:true
    };
    [[-.86,0,-1.25],[.86,0,-1.25],[-.88,0,1.25],[.88,0,1.25]].forEach(([x,y,z])=>{
      wheel.chassisConnectionPointLocal.set(x,y,z);this.vehicle.addWheel({...wheel,chassisConnectionPointLocal:wheel.chassisConnectionPointLocal.clone()});
    });
    this.vehicle.addToWorld(this.world);
  }

  _buildVisual(){
    this.visualRoot=new THREE.Group();this.visualRoot.name='PlayerCar';
    const paint=new THREE.MeshPhysicalMaterial({color:0x147dff,metalness:.72,roughness:.24,clearcoat:1,clearcoatRoughness:.13});
    const dark=new THREE.MeshStandardMaterial({color:0x060a11,metalness:.65,roughness:.3});
    const glass=new THREE.MeshPhysicalMaterial({color:0x07192d,metalness:.15,roughness:.08,transmission:.28,transparent:true,opacity:.9});
    const glow=new THREE.MeshStandardMaterial({color:0x32efff,emissive:0x28dfff,emissiveIntensity:2.2,roughness:.35});
    const redGlow=new THREE.MeshStandardMaterial({color:0xff334c,emissive:0xff1638,emissiveIntensity:2.6});

    const body=new THREE.Mesh(new THREE.BoxGeometry(1.86,.58,3.72),paint);body.position.y=.12;body.castShadow=true;body.receiveShadow=true;this.visualRoot.add(body);
    const nose=new THREE.Mesh(new THREE.BoxGeometry(1.7,.26,1.15),paint);nose.position.set(0,.34,-1.48);nose.rotation.x=-.06;nose.castShadow=true;this.visualRoot.add(nose);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.5,.52,1.6),glass);cabin.position.set(0,.59,.18);cabin.scale.set(1,.9,1);cabin.castShadow=true;this.visualRoot.add(cabin);
    const splitter=new THREE.Mesh(new THREE.BoxGeometry(1.76,.08,.28),dark);splitter.position.set(0,-.18,-1.83);this.visualRoot.add(splitter);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(1.65,.07,.34),dark);wing.position.set(0,.58,1.64);this.visualRoot.add(wing);
    const wingPostGeo=new THREE.BoxGeometry(.07,.42,.07);[-.58,.58].forEach(x=>{const p=new THREE.Mesh(wingPostGeo,dark);p.position.set(x,.38,1.52);this.visualRoot.add(p)});
    [-.58,.58].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.38,.13,.08),glow);h.position.set(x,.18,-1.89);this.visualRoot.add(h)});
    [-.58,.58].forEach(x=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.38,.11,.08),redGlow);t.position.set(x,.24,1.89);this.visualRoot.add(t)});
    this.nitroGlow=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.18),glow);this.nitroGlow.position.set(0,-.02,1.98);this.nitroGlow.visible=false;this.visualRoot.add(this.nitroGlow);
    this.scene.add(this.visualRoot);

    const tireMat=new THREE.MeshStandardMaterial({color:0x07090c,roughness:.68,metalness:.1});
    const rimMat=new THREE.MeshStandardMaterial({color:0xa9b8c8,metalness:.9,roughness:.22});
    this.wheelMeshes=[];
    for(let i=0;i<4;i++){
      const g=new THREE.Group();
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.24,18),tireMat);tire.rotation.z=Math.PI/2;tire.castShadow=true;g.add(tire);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.25,12),rimMat);rim.rotation.z=Math.PI/2;g.add(rim);
      this.scene.add(g);this.wheelMeshes.push(g);
    }
  }

  setInput(next){Object.assign(this.input,next)}

  update(dt){
    const speed=Math.abs(this.vehicle.currentVehicleSpeedKmHour||0);
    const steer=this.input.steer*this.maxSteer*clamp(1.15-speed/260,.58,1.05);
    this.vehicle.setSteeringValue(steer,0);this.vehicle.setSteeringValue(steer,1);

    const wantsForward=this.input.throttle>0.05,wantsReverse=this.input.throttle<-.05;
    let drive=0,brake=0;
    if(wantsForward) drive=-this.engineForce*this.input.throttle;
    if(wantsReverse){
      if(speed>7) brake=10; else drive=this.reverseForce*Math.abs(this.input.throttle);
    }

    this.nitroActive=Boolean(this.input.nitro&&wantsForward&&speed>18&&this.nitro>.02);
    if(this.nitroActive){drive*=1.62;this.nitro=Math.max(0,this.nitro-dt*.19)}else this.nitro=Math.min(1,this.nitro+dt*.075);
    this.nitroGlow.visible=this.nitroActive;
    if(this.nitroActive){this.nitroGlow.scale.z=1+Math.sin(performance.now()*.04)*.35}

    this.vehicle.applyEngineForce(drive,2);this.vehicle.applyEngineForce(drive,3);
    this.vehicle.setBrake(brake,0);this.vehicle.setBrake(brake,1);
    const rearBrake=this.input.handbrake?15:brake;
    this.vehicle.setBrake(rearBrake,2);this.vehicle.setBrake(rearBrake,3);
    this.vehicle.wheelInfos[2].frictionSlip=this.input.handbrake?1.65:4.8;
    this.vehicle.wheelInfos[3].frictionSlip=this.input.handbrake?1.65:4.8;
    this.vehicle.wheelInfos[0].frictionSlip=this.input.handbrake?3.6:4.8;
    this.vehicle.wheelInfos[1].frictionSlip=this.input.handbrake?3.6:4.8;

    const right=new CANNON.Vec3(1,0,0);this.chassisBody.quaternion.vmult(right,right);
    const lateral=Math.abs(this.chassisBody.velocity.dot(right));
    this.driftIntensity=clamp((lateral-1.1)/7,0,1)*clamp(speed/55,0,1);
    this.isDrifting=speed>28&&this.driftIntensity>.08&&(this.input.handbrake||Math.abs(this.input.steer)>.42);

    this._syncVisuals();
  }

  _syncVisuals(){
    const p=this.chassisBody.position,q=this.chassisBody.quaternion;
    this.visualRoot.position.set(p.x,p.y,p.z);this.visualRoot.quaternion.set(q.x,q.y,q.z,q.w);
    for(let i=0;i<this.wheelMeshes.length;i++){
      this.vehicle.updateWheelTransform(i);const t=this.vehicle.wheelInfos[i].worldTransform;
      this.wheelMeshes[i].position.set(t.position.x,t.position.y,t.position.z);
      this.wheelMeshes[i].quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
    }
  }

  reset(position={x:0,y:1.2,z:24},yaw=0){
    this.chassisBody.position.set(position.x,position.y,position.z);this.chassisBody.velocity.setZero();this.chassisBody.angularVelocity.setZero();
    this.chassisBody.quaternion.setFromEuler(0,yaw,0);this.chassisBody.force.setZero();this.chassisBody.torque.setZero();
    this.nitro=1;this.input={throttle:0,steer:0,handbrake:false,nitro:false};
  }

  get speedKmh(){return Math.abs(this.vehicle.currentVehicleSpeedKmHour||0)}
  get position(){return this.chassisBody.position}
  get quaternion(){return this.chassisBody.quaternion}
  get velocity(){return this.chassisBody.velocity}
}
