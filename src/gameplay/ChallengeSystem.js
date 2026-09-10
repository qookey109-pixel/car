import * as THREE from 'three';
import {districtFor} from '../world/DistrictMap.js';

const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class ChallengeSystem{
  constructor(scene,{onToast=()=>{},onComplete=()=>{},runOffset=0}={}){
    this.scene=scene;this.onToast=onToast;this.onComplete=onComplete;this.runOffset=Math.max(0,Math.floor(runOffset||0));this.runIndex=-1;
    this.group=new THREE.Group();this.group.name='ChallengeMarkers';scene.add(this.group);
    this.startedAt=performance.now();this.score=0;this.combo=1;this.bestCombo=1;this.totalDrift=0;this.completed=false;
    this.challengeIndex=0;this.sprintIndex=0;this.lastPosition=null;this._toastCooldown=0;this._speedHint=0;
    this.routes=[
      {name:'河岸東環',points:[[0,0],[120,0],[120,-120],[0,-120]],drift:{x:-120,z:-120,radius:72},speed:{x:0,z:-180}},
      {name:'霓虹西環',points:[[0,0],[-120,0],[-120,120],[0,120]],drift:{x:120,z:120,radius:72},speed:{x:0,z:180}},
      {name:'高架折返',points:[[0,0],[0,-120],[-120,-120],[-120,0]],drift:{x:120,z:-120,radius:72},speed:{x:0,z:-180}}
    ];
    this._applyRoute(this.runOffset%this.routes.length);
    this.challengeStartedAt=performance.now();this._buildMarkers();this._refreshMarkers();
  }

  _applyRoute(index){
    this.routeIndex=((index%this.routes.length)+this.routes.length)%this.routes.length;const r=this.routes[this.routeIndex];this.routeName=r.name;
    this.challenges=[
      {id:'sprint',title:'霓虹街廓 · Time Attack',description:'依序穿越 4 個城市 Checkpoint',limit:75,points:r.points.map(p=>[...p])},
      {id:'drift',title:'河岸反打 · Drift Run',description:'在河岸街區累積 1,800 漂移分',target:1800,zone:{...r.drift}},
      {id:'speed',title:'高架封關 · Speed Trap',description:'以至少 110 km/h 穿越終點',target:110,point:{...r.speed}}
    ];
    this.routeDistricts={
      checkpoints:r.points.map(([x,z])=>districtFor(x,z)),
      drift:districtFor(r.drift.x,r.drift.z),
      speed:districtFor(r.speed.x,r.speed.z)
    };
  }

  _material(color=0x58eeff){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.5,roughness:.28,metalness:.15,transparent:true,opacity:.9})}

  _buildMarkers(){
    this.markerMeshes=[];const mat=this._material();
    for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.26,8,32),mat.clone());ring.rotation.x=Math.PI/2;ring.position.y=.42;this.group.add(ring);this.markerMeshes.push(ring)}
    this.zoneMarker=new THREE.Mesh(new THREE.RingGeometry(58,72,64),new THREE.MeshBasicMaterial({color:0xffd766,transparent:true,opacity:.13,side:THREE.DoubleSide}));this.zoneMarker.rotation.x=-Math.PI/2;this.zoneMarker.position.y=.08;this.group.add(this.zoneMarker);
    this.speedMarker=new THREE.Group();const speedMat=this._material(0x7dffb7);for(const x of [-5,5]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.28,7,.28),speedMat);pillar.position.set(x,3.5,0);this.speedMarker.add(pillar)}const bar=new THREE.Mesh(new THREE.BoxGeometry(10.4,.3,.3),speedMat);bar.position.y=7;this.speedMarker.add(bar);this.group.add(this.speedMarker);
  }

  _refreshMarkers(){
    const c=this.current;
    this.markerMeshes.forEach((m,i)=>{m.visible=c?.id==='sprint'&&i===this.sprintIndex;if(c?.id==='sprint'){const p=c.points[i];m.position.x=p[0];m.position.z=p[1]}});
    this.zoneMarker.visible=c?.id==='drift';if(c?.id==='drift'){this.zoneMarker.position.x=c.zone.x;this.zoneMarker.position.z=c.zone.z}
    this.speedMarker.visible=c?.id==='speed';if(c?.id==='speed'){this.speedMarker.position.set(c.point.x,0,c.point.z)}
  }

  reset(){
    this.runIndex++;this._applyRoute((this.runOffset+this.runIndex)%this.routes.length);
    this.startedAt=performance.now();this.challengeStartedAt=performance.now();this.score=0;this.combo=1;this.bestCombo=1;this.totalDrift=0;this.completed=false;this.challengeIndex=0;this.sprintIndex=0;this.lastPosition=null;this._driftMission=0;this._speedHint=0;this._toastCooldown=0;this.group.visible=true;this._refreshMarkers();
  }

  update(dt,vehicle){
    if(this.completed)return;
    const pos=vehicle.position;this._toastCooldown=Math.max(0,this._toastCooldown-dt);
    if(this.lastPosition){const travelled=Math.hypot(pos.x-this.lastPosition.x,pos.z-this.lastPosition.z);this.score+=travelled*.35}
    this.lastPosition={x:pos.x,z:pos.z};

    if(vehicle.isDrifting){
      const gain=vehicle.speedKmh*(.35+vehicle.driftIntensity)*dt*.9;this.combo=clamp(this.combo+dt*.28,1,5);this.bestCombo=Math.max(this.bestCombo,this.combo);this.totalDrift+=gain;this.score+=gain*this.combo;
    }else this.combo=Math.max(1,this.combo-dt*.34);
    if(vehicle.nitroActive&&vehicle.speedKmh>70)this.score+=vehicle.speedKmh*dt*.08;

    const c=this.current;if(!c)return;
    if(c.id==='sprint')this._updateSprint(c,pos);
    if(c.id==='drift')this._updateDrift(c,pos,vehicle,dt);
    if(c.id==='speed')this._updateSpeed(c,pos,vehicle);
    this._animateMarkers(dt);
  }

  _updateSprint(c,pos){
    const elapsed=(performance.now()-this.challengeStartedAt)/1000;
    const p=c.points[this.sprintIndex];
    if(dist(pos,{x:p[0],z:p[1]})<9){
      this.sprintIndex++;this.score+=450;this.onToast(`CHECKPOINT ${this.sprintIndex}/4  +450`);
      if(this.sprintIndex>=c.points.length){
        const timeBonus=Math.max(0,(c.limit-elapsed)*20);this.score+=1200+timeBonus;this._advance('Time Attack 完成');return;
      }
      this._refreshMarkers();
    }
    if(elapsed>c.limit){this.challengeStartedAt=performance.now();this.sprintIndex=0;this.combo=1;this.onToast('Time Attack 重置 · 再試一次');this._refreshMarkers()}
  }

  _updateDrift(c,pos,vehicle,dt){
    const inside=dist(pos,c.zone)<=c.zone.radius;
    if(inside&&vehicle.isDrifting){const gain=vehicle.speedKmh*(.4+vehicle.driftIntensity)*dt;this._driftMission=(this._driftMission||0)+gain}
    if(!inside&&this._toastCooldown<=0){this._toastCooldown=3;this.onToast('進入黃色河岸區域累積漂移分')}
    if((this._driftMission||0)>=c.target){this.score+=1500;this._advance('Drift Run 完成')}
  }

  _updateSpeed(c,pos,vehicle){
    this._speedHint=vehicle.speedKmh;
    if(dist(pos,c.point)<10){
      if(vehicle.speedKmh>=c.target){this.score+=2000+Math.round((vehicle.speedKmh-c.target)*25);this._advance(`Speed Trap ${Math.round(vehicle.speedKmh)} km/h`)}
      else if(this._toastCooldown<=0){this._toastCooldown=2;this.onToast(`速度不足：${Math.round(vehicle.speedKmh)} / ${c.target} km/h`)}
    }
  }

  _advance(message){
    this.onToast(`${message}  ✓`);this.challengeIndex++;this.challengeStartedAt=performance.now();this.combo=Math.max(1,this.combo);this._driftMission=0;this._speedHint=0;
    if(this.challengeIndex>=this.challenges.length){this.completed=true;this.group.visible=false;this.onComplete(this.summary());return}
    this._refreshMarkers();
  }

  _animateMarkers(dt){const t=performance.now()*.001;for(const m of this.markerMeshes)if(m.visible){m.rotation.z+=dt*.5;m.material.emissiveIntensity=2.2+Math.sin(t*4)*.7}if(this.speedMarker.visible){this.speedMarker.position.y=Math.sin(t*2)*.18}}

  get current(){return this.challenges[this.challengeIndex]||null}
  get navigationTarget(){
    const c=this.current;if(!c)return null;
    if(c.id==='sprint'){
      const i=Math.min(this.sprintIndex,c.points.length-1),p=c.points[i];
      return{key:`${this.routeIndex}:sprint:${i}`,kind:'sprint',label:`CHECKPOINT ${i+1}/${c.points.length}`,x:p[0],z:p[1],arrivalRadius:9};
    }
    if(c.id==='drift')return{key:`${this.routeIndex}:drift`,kind:'drift',label:'DRIFT ZONE',x:c.zone.x,z:c.zone.z,arrivalRadius:c.zone.radius};
    if(c.id==='speed')return{key:`${this.routeIndex}:speed`,kind:'speed',label:'SPEED GATE',x:c.point.x,z:c.point.z,arrivalRadius:10};
    return null;
  }
  get targetDistrict(){const c=this.current;if(!c)return null;return c.id==='sprint'?this.routeDistricts.checkpoints[this.sprintIndex]||null:this.routeDistricts[c.id]||null}
  get progress(){const c=this.current;if(!c)return 1;if(c.id==='sprint')return this.sprintIndex/c.points.length;if(c.id==='drift')return clamp((this._driftMission||0)/c.target,0,1);if(c.id==='speed')return clamp((this._speedHint||0)/c.target,0,1);return 0}
  get objective(){const c=this.current;if(!c)return{title:'Journey Complete',text:`${this.routeName} · 夜行完成`};if(c.id==='sprint')return{title:c.title,text:`${this.routeName} · Checkpoint ${Math.min(this.sprintIndex+1,4)} / 4 · ${Math.max(0,c.limit-(performance.now()-this.challengeStartedAt)/1000).toFixed(0)}s`};if(c.id==='drift')return{title:c.title,text:`${this.routeName} · ${Math.round(this._driftMission||0)} / ${c.target} drift pts`};return{title:c.title,text:`${this.routeName} · ${Math.round(this._speedHint||0)} / ${c.target} km/h · 穿越綠色 Gate`}}
  summary(){const elapsed=(performance.now()-this.startedAt)/1000;const rank=this.score>9000?'S':this.score>6500?'A':this.score>4500?'B':'C';return{score:Math.round(this.score),time:elapsed,bestCombo:this.bestCombo,rank,routeIndex:this.routeIndex,routeName:this.routeName}}
}
