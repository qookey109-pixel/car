import * as THREE from 'three';

const wrap=(v,min,max)=>{const span=max-min;return ((v-min)%span+span)%span+min};
const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);

export class AmbientTraffic{
  constructor(game){
    this.game=game;
    this.profile='ambient-traffic-v3';
    this.elapsed=0;
    this.exclusionRadius=24;
    this.stopLineOffset=12;
    this.safeGap=7.5;
    this.followDistance=24;
    this.bounds={min:-202,max:202};
    this.records=[];

    const lanes=[
      {vertical:true,road:-120,direction:1},
      {vertical:true,road:-60,direction:-1},
      {vertical:true,road:0,direction:1},
      {vertical:true,road:60,direction:-1},
      {vertical:true,road:120,direction:1},
      {vertical:false,road:-120,direction:1},
      {vertical:false,road:-60,direction:-1},
      {vertical:false,road:0,direction:1},
      {vertical:false,road:60,direction:-1}
    ];
    const palette=[0x8ebed0,0xc8a87b,0x8da59a,0xb996a3,0x8796b5,0xb8b4a5];
    let id=0;
    lanes.forEach((lane,laneIndex)=>{
      for(let pair=0;pair<2;pair++){
        const direction=lane.direction,laneOffset=direction>0?-3.7:3.7;
        const phase=wrap(-178+laneIndex*41+pair*96,this.bounds.min,this.bounds.max);
        const speed=8.5+(id%5)*1.15;
        this.records.push({
          id,
          vertical:lane.vertical,
          road:lane.road,
          lane:laneOffset,
          direction,
          laneKey:`${lane.vertical?'V':'H'}:${lane.road}:${direction}`,
          phase,
          position:phase,
          speed,
          velocity:speed,
          color:palette[id%palette.length],
          stopped:false,
          queued:false,
          braking:false
        });
        id++;
      }
    });

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
    this.tailLights=new THREE.InstancedMesh(lightGeo,new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,vertexColors:true,transparent:true,opacity:.96}),this.records.length*2);
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
    this.lightColor=new THREE.Color();
    this.visibleCount=0;
    this.stoppedCount=0;
    this.queuedCount=0;
    this.brakingCount=0;
    this.records.forEach((r,i)=>{
      this.mesh.setColorAt(i,this.color.setHex(r.color));
      this._setTailColor(i,false);
    });
    if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
    if(this.tailLights.instanceColor){
      this.tailLights.instanceColor.setUsage(THREE.DynamicDrawUsage);
      this.tailLights.instanceColor.needsUpdate=true;
    }

    game.city.group.add(this.mesh,this.headLights,this.tailLights);
    this.update(0,true);
    game.city.stats={
      ...(game.city.stats||{}),
      ambientTrafficProfile:this.profile,
      ambientTrafficCars:this.records.length,
      ambientTrafficLanes:lanes.length,
      ambientTrafficRenderGroups:3,
      ambientTrafficPhysicsBodies:0,
      ambientTrafficExclusionRadius:this.exclusionRadius,
      ambientTrafficSignalAware:true,
      ambientTrafficCarFollowing:true,
      ambientTrafficSafeGap:this.safeGap,
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

  _leaderGap(record){
    const span=this.bounds.max-this.bounds.min;
    let gap=Infinity;
    for(const other of this.records){
      if(other===record||other.laneKey!==record.laneKey)continue;
      const forward=wrap((other.position-record.position)*record.direction,0,span);
      if(forward>.01&&forward<gap)gap=forward;
    }
    return gap;
  }

  _targetSpeed(record){
    const signal=this._nextSignal(record);
    const gap=this._leaderGap(record);
    let speed=record.speed,signalLimited=false,following=false;

    if(signal&&!signal.green&&signal.distance<=34){
      const d=signal.stopDistance;
      const signalSpeed=d<=.8?0:Math.min(record.speed,Math.max(0,(d-.8)*.58));
      if(signalSpeed<speed){speed=signalSpeed;signalLimited=true}
    }

    if(gap<this.followDistance){
      const followSpeed=Math.max(0,(gap-this.safeGap)*.72);
      if(followSpeed<speed){speed=followSpeed;following=true}
    }

    return{speed,signal,gap,signalLimited,following};
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

  _setTailColor(index,braking){
    const base=index*2,color=braking?0xff4055:0x7a1c2b;
    this.lightColor.setHex(color);
    this.tailLights.setColorAt(base,this.lightColor);
    this.tailLights.setColorAt(base+1,this.lightColor);
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
    this._setTailColor(index,record.braking);
  }

  update(dt=0,force=false){
    const step=Math.min(.1,Math.max(0,Number(dt)||0));
    this.elapsed+=step;
    const p=this.game.vehicle?.position||{x:9999,z:9999};
    const targets=this.records.map(record=>this._targetSpeed(record));
    let visible=0,stopped=0,queued=0,braking=0;

    for(let i=0;i<this.records.length;i++){
      const record=this.records[i],target=targets[i];
      const before=record.velocity;
      record.velocity=approach(record.velocity,target.speed,(target.speed<record.velocity?8.5:4.2)*step);
      record.queued=Boolean(target.following&&target.gap<this.followDistance);
      record.stopped=Boolean(record.velocity<.55&&(
        (target.signalLimited&&target.signal&&!target.signal.green&&target.signal.stopDistance<=2.2)||
        (target.following&&target.gap<=this.safeGap+1.15)
      ));
      record.braking=Boolean(record.stopped||record.queued||target.speed<before-.35);
      if(record.stopped)stopped++;
      if(record.queued)queued++;
      if(record.braking)braking++;

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
    this.queuedCount=queued;
    this.brakingCount=braking;
    this.mesh.instanceMatrix.needsUpdate=true;
    this.headLights.instanceMatrix.needsUpdate=true;
    this.tailLights.instanceMatrix.needsUpdate=true;
    if(this.tailLights.instanceColor)this.tailLights.instanceColor.needsUpdate=true;
    if(force){
      this.mesh.computeBoundingSphere?.();
      this.headLights.computeBoundingSphere?.();
      this.tailLights.computeBoundingSphere?.();
    }
    if(this.game.city.stats){
      this.game.city.stats.ambientTrafficVisible=visible;
      this.game.city.stats.ambientTrafficStopped=stopped;
      this.game.city.stats.ambientTrafficQueued=queued;
      this.game.city.stats.ambientTrafficBraking=braking;
    }
  }

  snapshot(){
    return{
      profile:this.profile,
      cars:this.records.length,
      lanes:new Set(this.records.map(r=>r.laneKey)).size,
      visible:this.visibleCount,
      stopped:this.stoppedCount,
      queued:this.queuedCount,
      braking:this.brakingCount,
      renderGroups:3,
      lightGroups:2,
      physicsBodies:0,
      signalAware:true,
      carFollowing:true,
      safeGap:this.safeGap,
      exclusionRadius:this.exclusionRadius,
      elapsed:this.elapsed
    };
  }
}
