import * as THREE from 'three';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=n=>Number.isFinite(Number(n));
const lerpAngle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;

export class GhostReplay{
  constructor(game){
    this.game=game;
    this.profile='ghost-replay-v1';
    this.storageKey='neon-racer-ghosts-v1';
    this.sampleInterval=.2;
    this.maxSamples=900;
    this.store=this._readStore();
    this.routeName=null;
    this.ghost=null;
    this.recording=[];
    this.startedAt=0;
    this.nextSampleAt=0;
    this.playIndex=0;
    this.matchIndex=0;
    this.delta=null;
    this.deltaEl=document.getElementById('ghostDelta');
    const geo=new THREE.BoxGeometry(1.72,.58,3.55);
    const mat=new THREE.MeshBasicMaterial({color:0x7ff6ff,transparent:true,opacity:.2,depthWrite:false,toneMapped:false});
    this.mesh=new THREE.Mesh(geo,mat);
    this.mesh.name='PersonalBestGhost';
    this.mesh.visible=false;
    this.mesh.renderOrder=3;
    this.mesh.frustumCulled=true;
    game.scene.add(this.mesh);
  }

  _readStore(){
    const empty={version:1,routes:{}};
    try{
      const raw=JSON.parse(localStorage.getItem(this.storageKey)||'{}');
      const routes={};
      if(raw.routes&&typeof raw.routes==='object'){
        for(const [name,value] of Object.entries(raw.routes)){
          const samples=Array.isArray(value?.samples)?value.samples.filter(s=>finite(s?.t)&&finite(s?.x)&&finite(s?.y)&&finite(s?.z)&&finite(s?.yaw)).slice(0,this.maxSamples).map(s=>({t:Number(s.t),x:Number(s.x),y:Number(s.y),z:Number(s.z),yaw:Number(s.yaw)})):[];
          const duration=Number(value?.duration||0);
          if(samples.length>=2&&duration>0)routes[name]={duration,samples};
        }
      }
      return{version:1,routes};
    }catch{return empty}
  }

  _save(){
    try{localStorage.setItem(this.storageKey,JSON.stringify(this.store))}catch{}
  }

  _yaw(){
    const q=this.game.vehicle.quaternion;
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion(q.x,q.y,q.z,q.w));
    return Math.atan2(-forward.x,-forward.z);
  }

  _sample(t){
    const p=this.game.vehicle.position;
    return{t:Number(t.toFixed(3)),x:Number(p.x.toFixed(2)),y:Number(p.y.toFixed(2)),z:Number(p.z.toFixed(2)),yaw:Number(this._yaw().toFixed(4))};
  }

  start(routeName){
    this.routeName=routeName||null;
    this.ghost=this.routeName?this.store.routes[this.routeName]||null:null;
    this.recording=[];
    this.startedAt=performance.now();
    this.nextSampleAt=0;
    this.playIndex=0;
    this.matchIndex=0;
    this.delta=null;
    this.mesh.visible=Boolean(this.ghost?.samples?.length>=2);
    if(this.deltaEl){
      this.deltaEl.classList.toggle('hidden',!this.ghost);
      this.deltaEl.classList.remove('ahead','behind');
      this.deltaEl.textContent=this.ghost?'GHOST · PB READY':'GHOST · NO PB';
    }
    this.recording.push(this._sample(0));
  }

  hide(){
    this.mesh.visible=false;
    this.delta=null;
    if(this.deltaEl)this.deltaEl.classList.add('hidden');
  }

  finish(summary,saveBest=false){
    if(this.routeName&&summary?.routeName===this.routeName){
      const t=Math.max(0,Number(summary.time||0));
      if(this.recording.length<this.maxSamples)this.recording.push(this._sample(t));
      if(saveBest&&this.recording.length>=2&&t>0){
        this.store.routes[this.routeName]={duration:Number(t.toFixed(3)),samples:this.recording.slice(0,this.maxSamples)};
        this._save();
      }
    }
    this.hide();
  }

  _play(elapsed){
    const samples=this.ghost?.samples;
    if(!samples?.length)return;
    while(this.playIndex<samples.length-2&&samples[this.playIndex+1].t<elapsed)this.playIndex++;
    const a=samples[this.playIndex],b=samples[Math.min(samples.length-1,this.playIndex+1)];
    const span=Math.max(.001,b.t-a.t),u=clamp((elapsed-a.t)/span,0,1);
    this.mesh.position.set(THREE.MathUtils.lerp(a.x,b.x,u),THREE.MathUtils.lerp(a.y,b.y,u)+.1,THREE.MathUtils.lerp(a.z,b.z,u));
    this.mesh.rotation.set(0,lerpAngle(a.yaw,b.yaw,u),0);
    this.mesh.visible=elapsed<=Number(this.ghost.duration||b.t)+.35;
  }

  _matchDelta(elapsed){
    const samples=this.ghost?.samples;
    if(!samples?.length)return null;
    const p=this.game.vehicle.position;
    const start=Math.max(0,this.matchIndex-6),end=Math.min(samples.length-1,this.matchIndex+70);
    let best=this.matchIndex,bestD=Infinity;
    for(let i=start;i<=end;i++){
      const s=samples[i],d=(s.x-p.x)*(s.x-p.x)+(s.z-p.z)*(s.z-p.z);
      if(d<bestD){bestD=d;best=i}
    }
    if(bestD>35*35)return null;
    this.matchIndex=Math.max(this.matchIndex,best);
    return elapsed-samples[this.matchIndex].t;
  }

  update(){
    if(this.game.state!=='running')return;
    const elapsed=Math.max(0,(performance.now()-this.startedAt)/1000);
    if(elapsed+1e-6>=this.nextSampleAt&&this.recording.length<this.maxSamples){
      this.recording.push(this._sample(elapsed));
      this.nextSampleAt=elapsed+this.sampleInterval;
    }
    if(!this.ghost)return;
    this._play(elapsed);
    this.delta=this._matchDelta(elapsed);
    if(this.deltaEl&&this.delta!==null){
      const ahead=this.delta<-.05,behind=this.delta>.05;
      this.deltaEl.classList.remove('ahead','behind');
      if(ahead)this.deltaEl.classList.add('ahead');
      if(behind)this.deltaEl.classList.add('behind');
      const sign=this.delta>0?'+':this.delta<0?'−':'±';
      this.deltaEl.textContent=`GHOST · ${sign}${Math.abs(this.delta).toFixed(1)}s · ${ahead?'AHEAD':behind?'BEHIND':'EVEN'}`;
    }
  }

  snapshot(){
    return{
      profile:this.profile,
      routeName:this.routeName,
      available:Boolean(this.ghost),
      visible:Boolean(this.mesh.visible),
      delta:this.delta,
      recordingSamples:this.recording.length,
      ghostSamples:this.ghost?.samples?.length||0,
      storedRoutes:Object.keys(this.store.routes).length,
      renderObjects:1
    };
  }
}
