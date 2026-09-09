import * as THREE from 'three';

export class CityAtmosphere{
  constructor(city){
    this.city=city;
    this.group=new THREE.Group();
    this.group.name='CityAtmosphere';
    city.group.add(this.group);
    this._trafficSignals();
  }

  _trafficSignals(){
    const roads=this.city.roadPositions.filter(p=>Math.abs(p)<=120);
    const poleGeo=new THREE.BoxGeometry(.12,3.7,.12);
    const headGeo=new THREE.BoxGeometry(.38,.8,.18);
    const lensGeo=new THREE.CircleGeometry(.11,8);
    const poleMat=new THREE.MeshLambertMaterial({color:0x46545f,emissive:0x101820,emissiveIntensity:.2});
    const headMat=new THREE.MeshLambertMaterial({color:0x121a20,emissive:0x05080a,emissiveIntensity:.14});
    const redMat=new THREE.MeshBasicMaterial({color:0xff4055,toneMapped:false});
    const greenMat=new THREE.MeshBasicMaterial({color:0x5dff9b,toneMapped:false});
    const poles=[],heads=[],signals=[];

    const pushSignal=(x,z,rot,greenPhase0)=>{
      poles.push({x,y:1.9,z,rot:0});
      heads.push({x,y:3.36,z,rot});
      const forwardX=Math.sin(rot)*.101,forwardZ=Math.cos(rot)*.101;
      signals.push({x:x+forwardX,y:3.36,z:z+forwardZ,rot,greenPhase0});
    };

    roads.forEach((x,ix)=>roads.forEach((z,iz)=>{
      const verticalGreen=((ix+iz)&1)===0;
      pushSignal(x-10.1,z-8.8,0,verticalGreen);
      pushSignal(x+10.1,z+8.8,Math.PI,verticalGreen);
      pushSignal(x-8.8,z+10.1,Math.PI/2,!verticalGreen);
      pushSignal(x+8.8,z-10.1,-Math.PI/2,!verticalGreen);
    }));

    this._signalDummy=new THREE.Object3D();
    const makeInst=(geo,mat,records,name)=>{
      const mesh=new THREE.InstancedMesh(geo,mat,records.length);
      mesh.name=name;
      records.forEach((p,i)=>this._setInstance(mesh,i,p));
      mesh.instanceMatrix.needsUpdate=true;
      mesh.castShadow=false;
      mesh.receiveShadow=false;
      this.group.add(mesh);
      return mesh;
    };

    this.poles=makeInst(poleGeo,poleMat,poles,'CityTrafficSignalPoles');
    this.heads=makeInst(headGeo,headMat,heads,'CityTrafficSignalHeads');
    this._signals=signals;
    const red0=signals.filter(s=>!s.greenPhase0),green0=signals.filter(s=>s.greenPhase0);
    this.redLights=makeInst(lensGeo,redMat,red0,'CityTrafficSignalRed');
    this.greenLights=makeInst(lensGeo,greenMat,green0,'CityTrafficSignalGreen');
    this.signalPhase=0;
    this.phaseIntervalMs=6000;
    this.renderGroups=4;
    this.signalCount=heads.length;
    this.city.stats={...(this.city.stats||{}),trafficSignals:this.signalCount,atmosphereRenderGroups:this.renderGroups,trafficSignalPhase:this.signalPhase};
    this._phaseTimer=setInterval(()=>this.setSignalPhase(this.signalPhase^1),this.phaseIntervalMs);
  }

  _setInstance(mesh,index,p){
    this._signalDummy.position.set(p.x,p.y,p.z);
    this._signalDummy.rotation.set(0,p.rot,0);
    this._signalDummy.scale.set(1,1,1);
    this._signalDummy.updateMatrix();
    mesh.setMatrixAt(index,this._signalDummy.matrix);
  }

  setSignalPhase(phase){
    const next=phase?1:0;
    if(next===this.signalPhase)return;
    const red=[],green=[];
    this._signals.forEach(signal=>{
      const isGreen=next? !signal.greenPhase0:signal.greenPhase0;
      (isGreen?green:red).push(signal);
    });
    red.forEach((p,i)=>this._setInstance(this.redLights,i,p));
    green.forEach((p,i)=>this._setInstance(this.greenLights,i,p));
    this.redLights.count=red.length;
    this.greenLights.count=green.length;
    this.redLights.instanceMatrix.needsUpdate=true;
    this.greenLights.instanceMatrix.needsUpdate=true;
    this.signalPhase=next;
    this.city.stats.trafficSignalPhase=next;
  }
}
