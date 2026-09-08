import * as THREE from 'three';

const fmtDistance=d=>d<1000?`${Math.round(d)} m`:`${(d/1000).toFixed(1)} km`;

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
    this.last={visible:false,kind:null,label:null,distance:null,angle:null,target:null};
    this._frame=()=>{this.update();requestAnimationFrame(this._frame)};
    requestAnimationFrame(this._frame);
  }

  _target(){
    const c=this.game.challenges?.current;if(!c)return null;
    if(c.id==='sprint'){
      const i=Math.min(this.game.challenges.sprintIndex,c.points.length-1),p=c.points[i];
      return{kind:'sprint',label:`CHECKPOINT ${i+1}/${c.points.length}`,x:p[0],z:p[1]};
    }
    if(c.id==='drift')return{kind:'drift',label:'DRIFT ZONE',x:c.zone.x,z:c.zone.z};
    if(c.id==='speed')return{kind:'speed',label:'SPEED GATE',x:c.point.x,z:c.point.z};
    return null;
  }

  update(){
    const target=this._target(),active=this.game.state==='running'&&Boolean(target);
    this.root.classList.toggle('visible',active);
    if(!active){this.last={visible:false,kind:null,label:null,distance:null,angle:null,target:null};return}

    const pos=this.game.vehicle.position;
    const toTarget=new THREE.Vector3(target.x-pos.x,0,target.z-pos.z);
    const distance=toTarget.length();
    if(distance>.001)toTarget.multiplyScalar(1/distance);

    const q=this.game.vehicle.quaternion;
    const tq=new THREE.Quaternion(q.x,q.y,q.z,q.w);
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(tq);forward.y=0;if(forward.lengthSq()<1e-6)forward.set(0,0,-1);forward.normalize();
    const right=new THREE.Vector3(1,0,0).applyQuaternion(tq);right.y=0;if(right.lengthSq()<1e-6)right.set(1,0,0);right.normalize();
    const angle=Math.atan2(toTarget.dot(right),toTarget.dot(forward));

    this.arrow.style.transform=`rotate(${angle}rad)`;
    this.label.textContent=target.label;
    this.distance.textContent=fmtDistance(distance);
    this.root.dataset.kind=target.kind;
    this.root.classList.toggle('near',distance<24);
    this.last={visible:true,kind:target.kind,label:target.label,distance,angle,target:{x:target.x,z:target.z}};
  }

  snapshot(){return{...this.last,target:this.last.target?{...this.last.target}:null}}
}
