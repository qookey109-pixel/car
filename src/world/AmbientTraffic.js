import * as THREE from 'three';

const wrap=(v,min,max)=>{const span=max-min;return ((v-min)%span+span)%span+min};

export class AmbientTraffic{
  constructor(game){
    this.game=game;
    this.profile='ambient-traffic-v1';
    this.elapsed=0;
    this.exclusionRadius=24;
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
      this.records.push({id:id++,vertical,road,lane,direction,phase,speed,color:palette[i%palette.length]});
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
    this.dummy=new THREE.Object3D();
    this.color=new THREE.Color();
    this.visibleCount=0;
    this.records.forEach((r,i)=>this.mesh.setColorAt(i,this.color.setHex(r.color)));
    if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
    game.city.group.add(this.mesh);
    this.update(0,true);
    game.city.stats={
      ...(game.city.stats||{}),
      ambientTrafficProfile:this.profile,
      ambientTrafficCars:this.records.length,
      ambientTrafficRenderGroups:1,
      ambientTrafficPhysicsBodies:0,
      ambientTrafficExclusionRadius:this.exclusionRadius
    };
  }

  _pose(record){
    const t=wrap(record.phase+this.elapsed*record.speed*record.direction,this.bounds.min,this.bounds.max);
    if(record.vertical)return{x:record.road+record.lane,z:t,yaw:record.direction>0?0:Math.PI};
    return{x:t,z:record.road+record.lane,yaw:record.direction>0?Math.PI/2:-Math.PI/2};
  }

  update(dt=0,force=false){
    this.elapsed+=Math.max(0,Number(dt)||0);
    const p=this.game.vehicle?.position||{x:9999,z:9999};
    let visible=0;
    for(let i=0;i<this.records.length;i++){
      const pose=this._pose(this.records[i]);
      const dx=pose.x-p.x,dz=pose.z-p.z;
      const nearPlayer=dx*dx+dz*dz<this.exclusionRadius*this.exclusionRadius;
      this.dummy.position.set(pose.x,nearPlayer?-12:.42,pose.z);
      this.dummy.rotation.set(0,pose.yaw,0);
      this.dummy.scale.set(1,1,1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i,this.dummy.matrix);
      if(!nearPlayer)visible++;
    }
    this.visibleCount=visible;
    this.mesh.instanceMatrix.needsUpdate=true;
    if(force)this.mesh.computeBoundingSphere?.();
    if(this.game.city.stats)this.game.city.stats.ambientTrafficVisible=visible;
  }

  snapshot(){
    return{
      profile:this.profile,
      cars:this.records.length,
      visible:this.visibleCount,
      renderGroups:1,
      physicsBodies:0,
      exclusionRadius:this.exclusionRadius,
      elapsed:this.elapsed
    };
  }
}
