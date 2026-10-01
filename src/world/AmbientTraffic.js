import * as THREE from 'three';

const wrap=(v,min,max)=>{const span=max-min;return ((v-min)%span+span)%span+min};
const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);

export class AmbientTraffic{
  constructor(game){
    this.game=game;
    this.profile='ambient-traffic-v2';
    this.elapsed=0;
    this.exclusionRadius=24;
    this.stopLineOffset=12;
    this.bounds={min:-202,max:202};
    this.records=[];
    const roads=[-180,-120,-60,0,60,120,180];
    const palette=[0x8ebed0,0xc8a87b,0x8da59a,0xb996a3,0x8796b5,0xb8b4a5];
    let id=0;
    for(let i=0;i<18;i++){
      const vertical=(i&1)===0;
      const road=roads[(i*3+2)%roads.length];
      const direction=(i%4<2)?1:-1;
      const lane=direction>0?-3.7:3.7;
      const phase=-190+((i*67)%380);
      const speed=8.5+(i%5)*1.15;
      this.records.push({id:id++,vertical,road,lane,direction,phase,position:phase,speed,velocity:speed,color:palette[i%palette.length],stopped:false});
    }

    const geo=new THREE.BoxGeometry(1.58,.62,3.35);
    const mat=new THREE.MeshLambertMaterial({
      color:0xffffff,
      emissive:0x0a1820,
      emissiveIntensity:.34,
      vertexColors:true,
      transparent:true,
      opacity:.88
    });
    this.mesh=new THREE.InstancedMesh(geo,mat,this.records.length);
    this.mesh.name='AmbientTrafficBatch';
    this.mesh.castShadow=false;
    this.mesh.receiveShadow=false;
    this.mesh.frustumCulled=false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const lightGeo=new THREE.BoxGeometry(.16,.11,.08);
    this.headLights=new THREE.InstancedMesh(lightGeo,new THREE.MeshBasicMaterial({color:0xe8fbff,toneMapped:false,transparent:true,opacity:.96}),this.records.length*2);
    this.tailLights=new THREE.InstancedMesh(lightGeo,new THREE.MeshBasicMaterial({color:0xff4f65,toneMapped:false,transparent:true,opacity:.94}),this.records.length*2);
    this.headLights.name='AmbientTrafficHeadLights';
    this.tailLights.name='AmbientTrafficTailLights';
    for(const lights of [this.headLights,this.tailLights]){
      lights.castShadow=false;
      lights.receiveShadow=false;
      lights.frustumCulled=false;
      lights.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    this.dummy=new THREE.Object3D();
    this.color=new THREE.Color();
    this.visibleCount=0;
    this.stoppedCount=0;
    this.records.forEach((r,i)=>this.mesh.setColorAt(i,this.color.setHex(r.color)));
    if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
    game.city.group.add(this.mesh,this.headLights,this.tailLights);
    this.update(0,true);
    game.city.stats={
      ...(game.city.stats||{}),
      ambientTrafficProfile:this.profile,
      ambientTrafficCars:this.records.length,
      ambientTrafficRenderGroups:3,
      ambientTrafficPhysicsBodies:0,
      ambientTrafficExclusionRadius:this.exclusionRadius,
      ambientTrafficSignalAware:true,
      ambientTrafficLightGroups:2
    };
  }

  _nextSignal(record){
    const atmosphere=this.game.cityAtmosphere;
    const roads=atmosphere?.signalRoads;
    if(!roads?.includes(record.road)||typeof atmosphere?.isSignalGreen!=='function')return null;
    let crossing=null,distance=Infinity;
    for(const q of roads){
      const d=(q-record.position)*record.direction;
      if(d>=0&&d<distance){distance=d;crossing=q}
    }
    if(crossing===null)return null;
    return{
      crossing,
      distance,
      stopDistance:distance-this.stopLineOffset,
      green:atmosphere.isSignalGreen(record.vertical,record.road,crossing)
    };
  }

  _targetSpeed(record){
    const signal=this._nextSignal(record);
    if(!signal||signal.green||signal.distance>34)return{speed:record.speed,signal};
    const d=signal.stopDistance;
    if(d<=.8)return{speed:0,signal};
    return{speed:Math.min(record.speed,Math.max(0,(d-.8)*.58)),signal};
  }

  _pose(record){
    if(record.vertical)return{x:record.road+record.lane,z:record.position,yaw:record.direction>0?0:Math.PI};
    return{x:record.position,z:record.road+record.lane,yaw:record.direction>0?Math.PI/2:-Math.PI/2};
  }

  _setLight(mesh,index,x,y,z,yaw){
    this.dummy.position.set(x,y,z);
    this.dummy.rotation.set(0,yaw,0);
    this.dummy.scale.set(1,1,1);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index,this.dummy.matrix);
  }

  _updateLights(index,record,pose,hidden){
    const fx=record.vertical?0:record.direction,fz=record.vertical?record.direction:0;
    const rx=fz,rz=-fx;
    const y=hidden?-12:.56;
    const frontX=pose.x+fx*1.7,frontZ=pose.z+fz*1.7;
    const rearX=pose.x-fx*1.7,rearZ=pose.z-fz*1.7;
    const base=index*2;
    for(let side=0;side<2;side++){
      const s=side?1:-1,ox=rx*.48*s,oz=rz*.48*s;
      this._setLight(this.headLights,base+side,frontX+ox,y,frontZ+oz,pose.yaw);
      this._setLight(this.tailLights,base+side,rearX+ox,y,rearZ+oz,pose.yaw);
    }
  }

  update(dt=0,force=false){
    const step=Math.min(.1,Math.max(0,Number(dt)||0));
    this.elapsed+=step;
    const p=this.game.vehicle?.position||{x:9999,z:9999};
    let visible=0,stopped=0;
    for(let i=0;i<this.records.length;i++){
      const record=this.records[i];
      const target=this._targetSpeed(record);
      record.velocity=approach(record.velocity,target.speed,(target.speed<record.velocity?8.5:4.2)*step);
      record.stopped=Boolean(target.signal&&!target.signal.green&&target.signal.stopDistance<=2.2&&record.velocity<.55);
      if(record.stopped)stopped++;
      record.position=wrap(record.position+record.velocity*step*record.direction,this.bounds.min,this.bounds.max);
      const pose=this._pose(record);
      const dx=pose.x-p.x,dz=pose.z-p.z;
      const nearPlayer=dx*dx+dz*dz<this.exclusionRadius*this.exclusionRadius;
      this.dummy.position.set(pose.x,nearPlayer?-12:.42,pose.z);
      this.dummy.rotation.set(0,pose.yaw,0);
      this.dummy.scale.set(1,1,1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i,this.dummy.matrix);
      this._updateLights(i,record,pose,nearPlayer);
      if(!nearPlayer)visible++;
    }
    this.visibleCount=visible;
    this.stoppedCount=stopped;
    this.mesh.instanceMatrix.needsUpdate=true;
    this.headLights.instanceMatrix.needsUpdate=true;
    this.tailLights.instanceMatrix.needsUpdate=true;
    if(force){
      this.mesh.computeBoundingSphere?.();
      this.headLights.computeBoundingSphere?.();
      this.tailLights.computeBoundingSphere?.();
    }
    if(this.game.city.stats){
      this.game.city.stats.ambientTrafficVisible=visible;
      this.game.city.stats.ambientTrafficStopped=stopped;
    }
  }

  snapshot(){
    return{
      profile:this.profile,
      cars:this.records.length,
      visible:this.visibleCount,
      stopped:this.stoppedCount,
      renderGroups:3,
      lightGroups:2,
      physicsBodies:0,
      signalAware:true,
      exclusionRadius:this.exclusionRadius,
      elapsed:this.elapsed
    };
  }
}
