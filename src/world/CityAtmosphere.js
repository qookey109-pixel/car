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
    const poles=[],heads=[],red=[],green=[];

    const pushSignal=(x,z,rot,lit)=>{
      poles.push({x,y:1.9,z,rot:0});
      heads.push({x,y:3.36,z,rot});
      const forwardX=Math.sin(rot)*.101,forwardZ=Math.cos(rot)*.101;
      (lit==='green'?green:red).push({x:x+forwardX,y:3.36,z:z+forwardZ,rot});
    };

    roads.forEach((x,ix)=>roads.forEach((z,iz)=>{
      const verticalGreen=((ix+iz)&1)===0;
      pushSignal(x-10.1,z-8.8,0,verticalGreen?'green':'red');
      pushSignal(x+10.1,z+8.8,Math.PI,verticalGreen?'green':'red');
      pushSignal(x-8.8,z+10.1,Math.PI/2,verticalGreen?'red':'green');
      pushSignal(x+8.8,z-10.1,-Math.PI/2,verticalGreen?'red':'green');
    }));

    const dummy=new THREE.Object3D();
    const makeInst=(geo,mat,records,name)=>{
      const mesh=new THREE.InstancedMesh(geo,mat,records.length);
      mesh.name=name;
      records.forEach((p,i)=>{
        dummy.position.set(p.x,p.y,p.z);
        dummy.rotation.set(0,p.rot,0);
        dummy.scale.set(1,1,1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      mesh.castShadow=false;
      mesh.receiveShadow=false;
      this.group.add(mesh);
      return mesh;
    };

    this.poles=makeInst(poleGeo,poleMat,poles,'CityTrafficSignalPoles');
    this.heads=makeInst(headGeo,headMat,heads,'CityTrafficSignalHeads');
    this.redLights=makeInst(lensGeo,redMat,red,'CityTrafficSignalRed');
    this.greenLights=makeInst(lensGeo,greenMat,green,'CityTrafficSignalGreen');
    this.renderGroups=4;
    this.signalCount=heads.length;
    this.city.stats={...(this.city.stats||{}),trafficSignals:this.signalCount,atmosphereRenderGroups:this.renderGroups};
  }
}
