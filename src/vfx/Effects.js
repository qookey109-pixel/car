import * as THREE from 'three';

export class Effects{
  constructor(scene){
    this.scene=scene;this.capacity=180;this.cursor=0;
    this.positions=new Float32Array(this.capacity*3);this.life=new Float32Array(this.capacity);this.velocity=Array.from({length:this.capacity},()=>new THREE.Vector3());
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    this.points=new THREE.Points(geo,new THREE.PointsMaterial({color:0x7beeff,size:.42,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.points.frustumCulled=false;scene.add(this.points);
    this.speedLines=new THREE.Group();const mat=new THREE.LineBasicMaterial({color:0x7defff,transparent:true,opacity:.12});
    for(let i=0;i<20;i++){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1)]);const l=new THREE.Line(g,mat.clone());l.visible=false;this.speedLines.add(l)}scene.add(this.speedLines)
  }
  burst(position,velocity,intensity=1,color){
    if(color)this.points.material.color.set(color);
    const count=Math.max(1,Math.floor(3+intensity*7));
    for(let n=0;n<count;n++){const i=this.cursor++%this.capacity,o=i*3;this.positions[o]=position.x+(Math.random()-.5)*1.4;this.positions[o+1]=position.y+.15+Math.random()*.4;this.positions[o+2]=position.z+(Math.random()-.5)*1.4;this.life[i]=.25+Math.random()*.5;this.velocity[i].set((Math.random()-.5)*2.5,.35+Math.random()*1.1,(Math.random()-.5)*2.5).addScaledVector(velocity,-.018)}this.points.geometry.attributes.position.needsUpdate=true
  }
  update(dt,vehicle,camera){
    for(let i=0;i<this.capacity;i++){if(this.life[i]<=0)continue;this.life[i]-=dt;const o=i*3;this.positions[o]+=this.velocity[i].x*dt;this.positions[o+1]+=this.velocity[i].y*dt;this.positions[o+2]+=this.velocity[i].z*dt;this.velocity[i].y-=1.4*dt;if(this.life[i]<=0)this.positions[o+1]=-999}this.points.geometry.attributes.position.needsUpdate=true;
    if(vehicle.isDrifting)this.burst(vehicle.position,vehicle.velocity,vehicle.driftIntensity*.7,0xffd36e);
    if(vehicle.nitroActive)this.burst(vehicle.position,vehicle.velocity,.45,0x69f5ff);
    const active=vehicle.speedKmh>105||vehicle.nitroActive;this.speedLines.visible=active;if(active){const f=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);this.speedLines.position.copy(camera.position);this.speedLines.children.forEach((l,i)=>{l.visible=true;l.position.set((i%5-2)*3+(Math.random()-.5),((i/5|0)-1.5)*2.2+(Math.random()-.5),-4-Math.random()*8);l.scale.z=3+vehicle.speedKmh/55;l.material.opacity=.07+Math.min(.16,vehicle.speedKmh/900)})}
  }
}
