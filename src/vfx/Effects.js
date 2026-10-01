import * as THREE from 'three';

export class Effects{
  constructor(scene){
    this.scene=scene;this.capacity=180;this.cursor=0;
    this.positions=new Float32Array(this.capacity*3);this.colors=new Float32Array(this.capacity*3);this.life=new Float32Array(this.capacity);this.velocity=Array.from({length:this.capacity},()=>new THREE.Vector3());
    this._particleColor=new THREE.Color(0x7beeff);
    for(let i=0;i<this.capacity;i++)this.positions[i*3+1]=-999;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.positions,3));geo.setAttribute('color',new THREE.BufferAttribute(this.colors,3));
    this.points=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,vertexColors:true,size:.42,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.points.frustumCulled=false;scene.add(this.points);

    // Keep the existing single LineSegments draw group, but bias the deterministic anchors
    // away from the objective corridor and toward the lower peripheral view. The result reads
    // as road/kerb rush instead of full-screen sci-fi streaks, especially on 844x390 mobile.
    this.speedFlowProfile='peripheral-road-rush-v1';
    this.speedLineCount=20;this.speedLinePositions=new Float32Array(this.speedLineCount*2*3);this.speedLineTime=0;
    this.speedLineSeeds=Array.from({length:this.speedLineCount},(_,i)=>{
      const lane=Math.floor(i/2)%5,side=(i&1)?1:-1,row=Math.floor(i/10);
      const jitterX=((((i*37)%101)/100)-.5)*.12,jitterY=((((i*53)%97)/96)-.5)*.22;
      return{
        x:side*(.82+lane*.37+jitterX),
        y:-.18-row*.58+jitterY,
        depth:((i*47)%89)/88,
        rate:.78+((i*29)%83)/210
      };
    });
    const speedGeo=new THREE.BufferGeometry();speedGeo.setAttribute('position',new THREE.BufferAttribute(this.speedLinePositions,3));
    const speedMat=new THREE.LineBasicMaterial({color:0x8defff,transparent:true,opacity:0,depthWrite:false});
    this.speedLines=new THREE.LineSegments(speedGeo,speedMat);this.speedLines.visible=false;this.speedLines.frustumCulled=false;scene.add(this.speedLines);
  }
  burst(position,velocity,intensity=1,color=0x7beeff){
    this._particleColor.setHex(color);
    const count=Math.max(1,Math.floor(3+intensity*7));
    for(let n=0;n<count;n++){
      const i=this.cursor++%this.capacity,o=i*3;
      this.positions[o]=position.x+(Math.random()-.5)*1.4;this.positions[o+1]=position.y+.15+Math.random()*.4;this.positions[o+2]=position.z+(Math.random()-.5)*1.4;
      this.colors[o]=this._particleColor.r;this.colors[o+1]=this._particleColor.g;this.colors[o+2]=this._particleColor.b;
      this.life[i]=.25+Math.random()*.5;this.velocity[i].set((Math.random()-.5)*2.5,.35+Math.random()*1.1,(Math.random()-.5)*2.5).addScaledVector(velocity,-.018)
    }
    this.points.geometry.attributes.position.needsUpdate=true;this.points.geometry.attributes.color.needsUpdate=true
  }
  update(dt,vehicle,camera){
    let particleMoved=false;
    for(let i=0;i<this.capacity;i++){
      if(this.life[i]<=0)continue;
      particleMoved=true;this.life[i]-=dt;const o=i*3;
      this.positions[o]+=this.velocity[i].x*dt;this.positions[o+1]+=this.velocity[i].y*dt;this.positions[o+2]+=this.velocity[i].z*dt;this.velocity[i].y-=1.4*dt;
      if(this.life[i]<=0)this.positions[o+1]=-999
    }
    if(particleMoved)this.points.geometry.attributes.position.needsUpdate=true;
    if(vehicle.isDrifting)this.burst(vehicle.position,vehicle.velocity,vehicle.driftIntensity*.7,0xffd36e);
    if(vehicle.nitroActive)this.burst(vehicle.position,vehicle.velocity,.45,0x69f5ff);

    const speed=Math.max(0,vehicle.speedKmh||0);const speedMix=THREE.MathUtils.clamp((speed-82)/98,0,1);
    const active=speedMix>.01||vehicle.nitroActive;this.speedLines.visible=active;
    if(active){
      this.speedLineTime=(this.speedLineTime+dt*(.56+speed/155+(vehicle.nitroActive?.28:0)))%10000;
      this.speedLines.position.copy(camera.position);this.speedLines.quaternion.copy(camera.quaternion);
      const length=2.35+speed*.038+(vehicle.nitroActive?1.35:0),spreadX=2.85+speedMix*.95,spreadY=1.9+speedMix*.48,depthSpan=14+speedMix*4;
      for(let i=0;i<this.speedLineCount;i++){
        const s=this.speedLineSeeds[i],phase=(s.depth+this.speedLineTime*s.rate)%1;
        const x=s.x*spreadX,y=s.y*spreadY,z=-3-(1-phase)*depthSpan,o=i*6;
        this.speedLinePositions[o]=x;this.speedLinePositions[o+1]=y;this.speedLinePositions[o+2]=z;
        this.speedLinePositions[o+3]=x;this.speedLinePositions[o+4]=y;this.speedLinePositions[o+5]=z-length;
      }
      this.speedLines.geometry.attributes.position.needsUpdate=true;
      this.speedLines.material.opacity=.018+speedMix*.17+(vehicle.nitroActive?.045:0);
    }
  }
}
