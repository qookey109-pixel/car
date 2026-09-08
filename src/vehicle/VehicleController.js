import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const expStep=(current,target,rate,dt)=>current+(target-current)*(1-Math.exp(-rate*dt));

export class VehicleController{
  constructor(scene,world){
    this.scene=scene;this.world=world;
    this.input={throttle:0,steer:0,handbrake:false,nitro:false};
    this.nitro=1;this.nitroActive=false;this.driftIntensity=0;this.isDrifting=false;
    this.engineForce=1950;this.reverseForce=1000;this.maxSteer=.42;
    this._throttleState=0;this._steerState=0;this._nitroBlend=0;
    this.spawn={position:new CANNON.Vec3(0,1.2,24),quaternion:new CANNON.Quaternion()};
    this._buildPhysics();this._buildVisual();
  }

  _buildPhysics(){
    const chassisShape=new CANNON.Box(new CANNON.Vec3(.93,.34,1.9));
    this.chassisBody=new CANNON.Body({mass:165,material:new CANNON.Material('car'),position:this.spawn.position.clone()});
    // Keep the body origin slightly below the geometric center. This lowers the effective
    // center of mass without changing the visible sports-car proportions.
    this.chassisBody.addShape(chassisShape,new CANNON.Vec3(0,.12,0));
    this.chassisBody.angularDamping=.6;this.chassisBody.linearDamping=.06;
    this.chassisBody.allowSleep=false;

    this.vehicle=new CANNON.RaycastVehicle({chassisBody:this.chassisBody,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
    const wheel={
      radius:.37,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:38,
      suspensionRestLength:.33,frictionSlip:3.45,dampingRelaxation:2.4,dampingCompression:4.8,
      maxSuspensionForce:100000,rollInfluence:.008,axleLocal:new CANNON.Vec3(-1,0,0),
      chassisConnectionPointLocal:new CANNON.Vec3(),maxSuspensionTravel:.28,customSlidingRotationalSpeed:-28,useCustomSlidingRotationalSpeed:true
    };
    [[-.86,0,-1.25],[.86,0,-1.25],[-.88,0,1.25],[.88,0,1.25]].forEach(([x,y,z])=>{
      wheel.chassisConnectionPointLocal.set(x,y,z);this.vehicle.addWheel({...wheel,chassisConnectionPointLocal:wheel.chassisConnectionPointLocal.clone()});
    });
    this.vehicle.addToWorld(this.world);
  }

  _buildVisual(){
    this.visualRoot=new THREE.Group();this.visualRoot.name='PlayerCar';
    const paint=new THREE.MeshPhysicalMaterial({color:0x1688ff,metalness:.68,roughness:.22,clearcoat:1,clearcoatRoughness:.1,emissive:0x03152d,emissiveIntensity:.28});
    const paintDark=new THREE.MeshPhysicalMaterial({color:0x0757b5,metalness:.66,roughness:.24,clearcoat:.9,clearcoatRoughness:.12});
    const dark=new THREE.MeshStandardMaterial({color:0x080d14,metalness:.72,roughness:.28});
    const glass=new THREE.MeshPhysicalMaterial({color:0x0b2946,metalness:.12,roughness:.08,transmission:.2,transparent:true,opacity:.86,clearcoat:1});
    const glow=new THREE.MeshStandardMaterial({color:0x6bf7ff,emissive:0x28dfff,emissiveIntensity:3.2,roughness:.28});
    const redGlow=new THREE.MeshStandardMaterial({color:0xff5870,emissive:0xff173d,emissiveIntensity:3.4,roughness:.28});
    const accent=new THREE.MeshBasicMaterial({color:0x58ecff,transparent:true,opacity:.9});

    const body=new THREE.Mesh(new THREE.BoxGeometry(1.9,.5,3.62),paint);body.position.y=.08;body.castShadow=true;body.receiveShadow=true;this.visualRoot.add(body);
    const shoulder=new THREE.Mesh(new THREE.BoxGeometry(1.98,.22,2.42),paintDark);shoulder.position.set(0,.34,.03);shoulder.castShadow=true;this.visualRoot.add(shoulder);
    const nose=new THREE.Mesh(new THREE.BoxGeometry(1.72,.24,1.12),paint);nose.position.set(0,.34,-1.48);nose.rotation.x=-.075;nose.castShadow=true;this.visualRoot.add(nose);
    const hood=new THREE.Mesh(new THREE.BoxGeometry(1.46,.08,1.18),paintDark);hood.position.set(0,.49,-1.02);hood.rotation.x=-.04;this.visualRoot.add(hood);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.44,.5,1.52),glass);cabin.position.set(0,.69,.1);cabin.scale.set(1,.92,1);cabin.castShadow=true;this.visualRoot.add(cabin);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(1.28,.07,.9),dark);roof.position.set(0,.95,.14);this.visualRoot.add(roof);
    const centerStripe=new THREE.Mesh(new THREE.BoxGeometry(.16,.025,2.72),accent);centerStripe.position.set(0,.54,-.2);this.visualRoot.add(centerStripe);

    const fenderGeo=new THREE.BoxGeometry(.28,.28,.9);for(const x of [-1.0,1.0])for(const z of [-1.24,1.24]){const f=new THREE.Mesh(fenderGeo,paintDark);f.position.set(x,.06,z);f.rotation.y=x*z>0?.035:-.035;this.visualRoot.add(f)}
    const skirtGeo=new THREE.BoxGeometry(.14,.12,2.5);for(const x of [-1.0,1.0]){const s=new THREE.Mesh(skirtGeo,dark);s.position.set(x,-.12,.05);this.visualRoot.add(s);const strip=new THREE.Mesh(new THREE.BoxGeometry(.035,.035,2.2),accent);strip.position.set(x*1.01,-.03,.02);this.visualRoot.add(strip)}

    const splitter=new THREE.Mesh(new THREE.BoxGeometry(1.82,.08,.32),dark);splitter.position.set(0,-.18,-1.84);this.visualRoot.add(splitter);
    const rearDiffuser=new THREE.Mesh(new THREE.BoxGeometry(1.75,.1,.32),dark);rearDiffuser.position.set(0,-.16,1.82);this.visualRoot.add(rearDiffuser);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(1.72,.07,.36),dark);wing.position.set(0,.68,1.61);this.visualRoot.add(wing);
    const wingPostGeo=new THREE.BoxGeometry(.07,.48,.07);[-.6,.6].forEach(x=>{const p=new THREE.Mesh(wingPostGeo,dark);p.position.set(x,.45,1.5);this.visualRoot.add(p)});

    [-.58,.58].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.42,.14,.075),glow);h.position.set(x,.2,-1.88);this.visualRoot.add(h)});
    const tailBar=new THREE.Mesh(new THREE.BoxGeometry(1.5,.055,.07),redGlow);tailBar.position.set(0,.3,1.9);this.visualRoot.add(tailBar);
    [-.58,.58].forEach(x=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.34,.12,.075),redGlow);t.position.set(x,.26,1.91);this.visualRoot.add(t)});

    const underMat=new THREE.MeshBasicMaterial({color:0x16dfff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    this.underglow=new THREE.Mesh(new THREE.PlaneGeometry(2.15,4.15),underMat);this.underglow.rotation.x=-Math.PI/2;this.underglow.position.y=-.33;this.visualRoot.add(this.underglow);
    this.underglowLight=new THREE.PointLight(0x2de8ff,8,7,2);this.underglowLight.position.set(0,-.05,.25);this.visualRoot.add(this.underglowLight);

    this.headlight=new THREE.SpotLight(0xbfefff,34,34,Math.PI*.18,.72,1.4);this.headlight.position.set(0,.38,-1.65);this.headlight.castShadow=false;this.headlightTarget=new THREE.Object3D();this.headlightTarget.position.set(0,-.35,-16);this.visualRoot.add(this.headlight,this.headlightTarget);this.headlight.target=this.headlightTarget;

    this.nitroGlow=new THREE.Mesh(new THREE.BoxGeometry(.58,.07,.2),glow);this.nitroGlow.position.set(0,-.02,1.99);this.nitroGlow.visible=false;this.visualRoot.add(this.nitroGlow);
    this.scene.add(this.visualRoot);

    const tireMat=new THREE.MeshStandardMaterial({color:0x07090c,roughness:.65,metalness:.1});
    const rimMat=new THREE.MeshStandardMaterial({color:0xc2d1df,metalness:.92,roughness:.18});
    const brakeMat=new THREE.MeshStandardMaterial({color:0x2ddfff,emissive:0x18a9d8,emissiveIntensity:1.5,metalness:.35,roughness:.3});
    this.wheelMeshes=[];
    for(let i=0;i<4;i++){
      const g=new THREE.Group();
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.24,20),tireMat);tire.rotation.z=Math.PI/2;tire.castShadow=true;g.add(tire);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.25,14),rimMat);rim.rotation.z=Math.PI/2;g.add(rim);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.26,10),brakeMat);hub.rotation.z=Math.PI/2;g.add(hub);
      this.scene.add(g);this.wheelMeshes.push(g);
    }
  }

  setInput(next){Object.assign(this.input,next)}

  _stabilityAssist(dt,speed){
    const grounded=this.vehicle.wheelInfos.reduce((n,w)=>n+(w.isInContact?1:0),0);
    if(grounded<2)return;

    const up=new CANNON.Vec3(0,1,0);this.chassisBody.quaternion.vmult(up,up);
    // Only assist a car that is still broadly upright. Once genuinely overturned, Reset
    // remains the deliberate recovery action rather than an invisible auto-teleport.
    if(up.y>.2){
      const worldUp=new CANNON.Vec3(0,1,0),axis=new CANNON.Vec3();
      up.cross(worldUp,axis);
      const assist=clamp(speed/45,.35,1)*this.chassisBody.mass*7.5;
      axis.scale(assist,axis);this.chassisBody.torque.vadd(axis,this.chassisBody.torque);
    }

    // Damp roll/pitch without suppressing yaw. This is a simcade anti-roll layer and is
    // intentionally strongest on the ground, where Safari testing exposed traction-roll.
    const damp=clamp(1-2.5*dt,.78,1);
    this.chassisBody.angularVelocity.x=clamp(this.chassisBody.angularVelocity.x*damp,-2.1,2.1);
    this.chassisBody.angularVelocity.z=clamp(this.chassisBody.angularVelocity.z*damp,-2.1,2.1);
  }

  update(dt){
    dt=clamp(Number.isFinite(dt)?dt:1/60,1/240,1/20);
    const speed=Math.abs(this.vehicle.currentVehicleSpeedKmHour||0);

    // Keyboard/mobile inputs are digital. Smooth them before they reach the physics model
    // so pressing GAS or steering no longer becomes an instantaneous full-force impulse.
    const throttleRate=Math.abs(this.input.throttle)>Math.abs(this._throttleState)?3.2:6.2;
    this._throttleState=expStep(this._throttleState,this.input.throttle,throttleRate,dt);
    this._steerState=expStep(this._steerState,this.input.steer,7.5,dt);

    // Strong steering around town, progressively calmer at speed. The previous model still
    // allowed ~16 degrees at very high speed, which could turn tyre grip into a rollover.
    const steerScale=clamp(1-speed/160,.26,1);
    const steer=this._steerState*this.maxSteer*steerScale;
    this.vehicle.setSteeringValue(steer,0);this.vehicle.setSteeringValue(steer,1);

    const wantsForward=this._throttleState>.05,wantsReverse=this._throttleState<-.05;
    let drive=0,brake=0;
    if(wantsForward){
      const powerCurve=clamp(1.08-speed/190,.42,1);
      drive=this.engineForce*this._throttleState*powerCurve;
      if(speed>165)drive*=clamp((188-speed)/23,0,1);
    }
    if(wantsReverse){if(speed>7)brake=10;else drive=-this.reverseForce*Math.abs(this._throttleState)}

    this.nitroActive=Boolean(this.input.nitro&&wantsForward&&speed>22&&this.nitro>.02);
    this._nitroBlend=expStep(this._nitroBlend,this.nitroActive?1:0,this.nitroActive?3.2:6.5,dt);
    if(this.nitroActive){this.nitro=Math.max(0,this.nitro-dt*.17)}else this.nitro=Math.min(1,this.nitro+dt*.075);
    drive*=1+.35*this._nitroBlend;
    this.nitroGlow.visible=this._nitroBlend>.04;
    if(this.nitroGlow.visible){this.nitroGlow.scale.z=1+Math.sin(performance.now()*.04)*.24*this._nitroBlend;this.underglow.material.opacity=.16+.07*this._nitroBlend}else this.underglow.material.opacity=.16;

    this.vehicle.applyEngineForce(drive,2);this.vehicle.applyEngineForce(drive,3);
    this.vehicle.setBrake(brake,0);this.vehicle.setBrake(brake,1);
    const rearBrake=this.input.handbrake?15:brake;
    this.vehicle.setBrake(rearBrake,2);this.vehicle.setBrake(rearBrake,3);
    this.vehicle.wheelInfos[2].frictionSlip=this.input.handbrake?1.3:3.45;
    this.vehicle.wheelInfos[3].frictionSlip=this.input.handbrake?1.3:3.45;
    this.vehicle.wheelInfos[0].frictionSlip=this.input.handbrake?2.85:3.45;
    this.vehicle.wheelInfos[1].frictionSlip=this.input.handbrake?2.85:3.45;

    this._stabilityAssist(dt,speed);

    const right=new CANNON.Vec3(1,0,0);this.chassisBody.quaternion.vmult(right,right);
    const lateral=Math.abs(this.chassisBody.velocity.dot(right));
    this.driftIntensity=clamp((lateral-.9)/6.5,0,1)*clamp(speed/50,0,1);
    this.isDrifting=speed>26&&this.driftIntensity>.08&&(this.input.handbrake||Math.abs(this._steerState)>.5);

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
    this.nitro=1;this._throttleState=0;this._steerState=0;this._nitroBlend=0;this.nitroActive=false;
    this.input={throttle:0,steer:0,handbrake:false,nitro:false};
  }

  get speedKmh(){return Math.abs(this.vehicle.currentVehicleSpeedKmHour||0)}
  get position(){return this.chassisBody.position}
  get quaternion(){return this.chassisBody.quaternion}
  get velocity(){return this.chassisBody.velocity}
}
