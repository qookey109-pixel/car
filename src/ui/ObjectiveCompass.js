import * as THREE from 'three';

const fmtDistance=d=>d<1000?`${Math.round(d)} m`:`${(d/1000).toFixed(1)} km`;
const maneuverLabels={
  straight:{far:'抵達後直行',prepare:'準備直行',commit:'通過後直行'},
  right:{far:'抵達後右轉',prepare:'準備右轉',commit:'通過後右轉'},
  left:{far:'抵達後左轉',prepare:'準備左轉',commit:'通過後左轉'}
};
const turnFromAngle=angle=>{
  const a=Math.abs(angle);
  if(a<.42)return{kind:'straight'};
  return angle>0?{kind:'right'}:{kind:'left'};
};

export class ObjectiveCompass{
  constructor(game){
    this.game=game;
    this.root=document.createElement('div');
    this.root.id='objectiveCompass';
    this.root.className='objective-compass';
    this.root.setAttribute('aria-hidden','true');
    this.root.innerHTML=`
      <div class="objective-compass-arrow"><span>▲</span></div>
      <div class="objective-compass-copy">
        <b class="objective-compass-label">OBJECTIVE</b>
        <span class="objective-compass-distance">-- m</span>
      </div>`;
    (game.hud?.el?.hud||document.body).appendChild(this.root);
    this.arrow=this.root.querySelector('.objective-compass-arrow');
    this.label=this.root.querySelector('.objective-compass-label');
    this.distance=this.root.querySelector('.objective-compass-distance');
    this.last={visible:false,kind:null,label:null,distance:null,angle:null,target:null,maneuver:null,maneuverLabel:null,maneuverPhase:null};
    this._frame=()=>{this.update();requestAnimationFrame(this._frame)};
    requestAnimationFrame(this._frame);
  }

  _target(){
    const t=this.game.challenges?.navigationTarget;
    return t?{kind:t.kind,label:t.label,x:t.x,z:t.z}:null;
  }

  _plannedManeuver(target,forward,right){
    const challenges=this.game.challenges,c=challenges?.current;
    if(target?.kind!=='sprint'||c?.id!=='sprint'||!Array.isArray(c.points)||!c.points.length)return null;
    const i=Math.min(challenges.sprintIndex,c.points.length-1);
    if(i>=c.points.length-1)return{kind:'finish'};

    const p=c.points[i],next=c.points[i+1];
    const outgoing=new THREE.Vector3(next[0]-p[0],0,next[1]-p[1]);
    if(outgoing.lengthSq()<1e-6)return{kind:'straight'};
    outgoing.normalize();

    if(i===0){
      const angle=Math.atan2(outgoing.dot(right),outgoing.dot(forward));
      return turnFromAngle(angle);
    }

    const prev=c.points[i-1];
    const incoming=new THREE.Vector3(p[0]-prev[0],0,p[1]-prev[1]);
    if(incoming.lengthSq()<1e-6)return{kind:'straight'};
    incoming.normalize();
    const plannedRight=new THREE.Vector3(-incoming.z,0,incoming.x);
    const angle=Math.atan2(outgoing.dot(plannedRight),outgoing.dot(incoming));
    return turnFromAngle(angle);
  }

  _maneuverPresentation(plan,distance){
    if(!plan)return null;
    if(plan.kind==='finish')return{kind:'finish',label:'終點',phase:'finish'};
    const phase=distance<=28?'commit':distance<=70?'prepare':'far';
    return{kind:plan.kind,label:maneuverLabels[plan.kind]?.[phase]||'抵達後直行',phase};
  }

  update(){
    const target=this._target(),active=this.game.state==='running'&&Boolean(target);
    this.root.classList.toggle('visible',active);
    if(!active){this.last={visible:false,kind:null,label:null,distance:null,angle:null,target:null,maneuver:null,maneuverLabel:null,maneuverPhase:null};return}

    const pos=this.game.vehicle.position;
    const toTarget=new THREE.Vector3(target.x-pos.x,0,target.z-pos.z);
    const distance=toTarget.length();
    if(distance>.001)toTarget.multiplyScalar(1/distance);

    const q=this.game.vehicle.quaternion;
    const tq=new THREE.Quaternion(q.x,q.y,q.z,q.w);
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(tq);forward.y=0;if(forward.lengthSq()<1e-6)forward.set(0,0,-1);forward.normalize();
    const right=new THREE.Vector3(1,0,0).applyQuaternion(tq);right.y=0;if(right.lengthSq()<1e-6)right.set(1,0,0);right.normalize();
    const angle=Math.atan2(toTarget.dot(right),toTarget.dot(forward));
    const maneuver=this._maneuverPresentation(this._plannedManeuver(target,forward,right),distance);

    this.arrow.style.transform=`rotate(${angle}rad)`;
    this.label.textContent=target.label;
    this.distance.textContent=maneuver?`${fmtDistance(distance)} · ${maneuver.label}`:fmtDistance(distance);
    this.root.dataset.kind=target.kind;
    if(maneuver){this.root.dataset.maneuver=maneuver.kind;this.root.dataset.maneuverPhase=maneuver.phase}else{delete this.root.dataset.maneuver;delete this.root.dataset.maneuverPhase}
    this.root.classList.toggle('near',distance<24);
    this.last={visible:true,kind:target.kind,label:target.label,distance,angle,target:{x:target.x,z:target.z},maneuver:maneuver?.kind||null,maneuverLabel:maneuver?.label||null,maneuverPhase:maneuver?.phase||null};
  }

  snapshot(){return{...this.last,target:this.last.target?{...this.last.target}:null}}
}
