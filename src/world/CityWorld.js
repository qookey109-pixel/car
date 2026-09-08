import * as THREE from 'three';
import * as CANNON from 'cannon-es';

function rng(seed=7331){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}

export class CityWorld{
  constructor(scene,physics){this.scene=scene;this.physics=physics;this.rand=rng();this.staticBodies=[];this.group=new THREE.Group();this.group.name='SanchongLuzhouCity';scene.add(this.group);this._lights();this._ground();this._roads();this._buildings();this._streetDetails();this._river();this._sky();this._bounds()}

  _lights(){
    this.hemi=new THREE.HemisphereLight(0x7da9d8,0x09131d,1.3);this.scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight(0xffd2aa,2.35);this.sun.position.set(-90,140,60);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1536,1536);this.sun.shadow.camera.left=-180;this.sun.shadow.camera.right=180;this.sun.shadow.camera.top=180;this.sun.shadow.camera.bottom=-180;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=360;this.scene.add(this.sun);
    this.rim=new THREE.DirectionalLight(0x48b7ff,.8);this.rim.position.set(80,65,-120);this.scene.add(this.rim);
  }

  _ground(){
    const groundMat=new THREE.MeshStandardMaterial({color:0x091017,roughness:.93,metalness:.04});
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(720,720),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.02;ground.receiveShadow=true;this.group.add(ground);
    const physMat=new CANNON.Material('asphalt');this.groundBody=new CANNON.Body({mass:0,material:physMat,shape:new CANNON.Plane()});this.groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);this.physics.addBody(this.groundBody);
  }

  _roads(){
    const roadMat=new THREE.MeshStandardMaterial({color:0x111820,roughness:.82,metalness:.08});
    const curbMat=new THREE.MeshStandardMaterial({color:0x6d7377,roughness:.8});
    const roadPositions=[-180,-120,-60,0,60,120,180];
    for(const p of roadPositions){
      const a=new THREE.Mesh(new THREE.BoxGeometry(18,.035,420),roadMat);a.position.set(p,.018,0);a.receiveShadow=true;this.group.add(a);
      const b=new THREE.Mesh(new THREE.BoxGeometry(420,.035,18),roadMat);b.position.set(0,.019,p);b.receiveShadow=true;this.group.add(b);
      for(const side of [-1,1]){
        const ca=new THREE.Mesh(new THREE.BoxGeometry(.45,.12,420),curbMat);ca.position.set(p+side*9.2,.06,0);this.group.add(ca);
        const cb=new THREE.Mesh(new THREE.BoxGeometry(420,.12,.45),curbMat);cb.position.set(0,.06,p+side*9.2);this.group.add(cb);
      }
    }
    const dashGeo=new THREE.BoxGeometry(.16,.025,4.2),dashMat=new THREE.MeshBasicMaterial({color:0xd8e1df});
    const marks=[];
    for(const p of roadPositions){for(let z=-200;z<=200;z+=12){marks.push([p,.045,z,0])}for(let x=-200;x<=200;x+=12){marks.push([x,.046,p,Math.PI/2])}}
    const inst=new THREE.InstancedMesh(dashGeo,dashMat,marks.length);const dummy=new THREE.Object3D();marks.forEach((m,i)=>{dummy.position.set(m[0],m[1],m[2]);dummy.rotation.y=m[3];dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});inst.instanceMatrix.needsUpdate=true;this.group.add(inst);
    this.roadPositions=roadPositions;
  }

  _buildings(){
    const bodyGeo=new THREE.BoxGeometry(1,1,1);const bodyMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.68,metalness:.08,vertexColors:true});
    const windowGeo=new THREE.BoxGeometry(1,.12,.05);const windowMat=new THREE.MeshStandardMaterial({color:0x83d6ff,emissive:0x4aa8ff,emissiveIntensity:1.45,roughness:.4});
    const signGeo=new THREE.BoxGeometry(1,1,.08);const signMat=new THREE.MeshStandardMaterial({color:0xff5cb8,emissive:0xff278d,emissiveIntensity:1.8,roughness:.35});
    const records=[];const windows=[];const signs=[];const r=this.rand;
    const centers=[-150,-90,-30,30,90,150];
    const palette=[0xb8b8ad,0xaeb8ba,0xc3b5a4,0x9ba9a5,0xb6a6a1,0x8f989f];
    for(const bx of centers)for(const bz of centers){
      const count=2+Math.floor(r()*3);
      for(let j=0;j<count;j++){
        const w=10+r()*15,d=10+r()*15,h=12+r()*50;
        const x=bx+(r()-.5)*26,z=bz+(r()-.5)*26;
        records.push({x,z,w,d,h,color:palette[Math.floor(r()*palette.length)]});
        const floors=Math.max(2,Math.min(7,Math.floor(h/5)));
        for(let f=1;f<=floors;f++) if(r()>.22) windows.push({x,y:2.3+f*(h/(floors+1)),z:z-d/2-.06,w:w*.72,rot:0});
        if(r()>.55)signs.push({x:x+(r()-.5)*w*.5,y:3.1+r()*4,z:z-d/2-.11,w:2.2+r()*3,h:1+r()*1.8});
      }
    }
    const bInst=new THREE.InstancedMesh(bodyGeo,bodyMat,records.length);const dmy=new THREE.Object3D();const col=new THREE.Color();
    records.forEach((b,i)=>{dmy.position.set(b.x,b.h/2,b.z);dmy.scale.set(b.w,b.h,b.d);dmy.rotation.y=(r()-.5)*.05;dmy.updateMatrix();bInst.setMatrixAt(i,dmy.matrix);bInst.setColorAt(i,col.setHex(b.color));this._buildingCollider(b)});bInst.castShadow=true;bInst.receiveShadow=true;bInst.instanceMatrix.needsUpdate=true;bInst.instanceColor.needsUpdate=true;this.group.add(bInst);
    const wInst=new THREE.InstancedMesh(windowGeo,windowMat,windows.length);windows.forEach((w,i)=>{dmy.position.set(w.x,w.y,w.z);dmy.scale.set(w.w,1,1);dmy.rotation.set(0,w.rot,0);dmy.updateMatrix();wInst.setMatrixAt(i,dmy.matrix)});wInst.instanceMatrix.needsUpdate=true;this.group.add(wInst);
    const sInst=new THREE.InstancedMesh(signGeo,signMat,signs.length);signs.forEach((s,i)=>{dmy.position.set(s.x,s.y,s.z);dmy.scale.set(s.w,s.h,1);dmy.updateMatrix();sInst.setMatrixAt(i,dmy.matrix)});sInst.instanceMatrix.needsUpdate=true;this.group.add(sInst);
    this.stats={buildings:records.length,windows:windows.length,signs:signs.length};
  }

  _buildingCollider(b){const body=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(b.w*.5,b.h*.5,b.d*.5)),position:new CANNON.Vec3(b.x,b.h*.5,b.z)});this.physics.addBody(body);this.staticBodies.push(body)}

  _streetDetails(){
    const r=this.rand,dummy=new THREE.Object3D();
    const poleGeo=new THREE.CylinderGeometry(.07,.09,4.8,6),poleMat=new THREE.MeshStandardMaterial({color:0x34424d,metalness:.7,roughness:.45});
    const bulbGeo=new THREE.SphereGeometry(.17,8,6),bulbMat=new THREE.MeshStandardMaterial({color:0xffdb9b,emissive:0xffa23d,emissiveIntensity:3});
    const lampPos=[];for(const road of this.roadPositions){for(let q=-195;q<=195;q+=24){lampPos.push([road+7.7,2.4,q]);lampPos.push([q,2.4,road+7.7])}}
    const poles=new THREE.InstancedMesh(poleGeo,poleMat,lampPos.length),bulbs=new THREE.InstancedMesh(bulbGeo,bulbMat,lampPos.length);
    lampPos.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);dummy.position.set(p[0],4.72,p[2]);dummy.updateMatrix();bulbs.setMatrixAt(i,dummy.matrix)});poles.instanceMatrix.needsUpdate=true;bulbs.instanceMatrix.needsUpdate=true;this.group.add(poles,bulbs);
    const trunkGeo=new THREE.CylinderGeometry(.12,.16,1.6,6),trunkMat=new THREE.MeshStandardMaterial({color:0x473527,roughness:1});
    const crownGeo=new THREE.IcosahedronGeometry(1.15,1),crownMat=new THREE.MeshStandardMaterial({color:0x1e5e45,roughness:.95});
    const treePos=[];for(let i=0;i<85;i++){const road=this.roadPositions[Math.floor(r()*this.roadPositions.length)],along=-190+r()*380;if(r()>.5)treePos.push([road-7.6,.8,along]);else treePos.push([along,.8,road-7.6])}
    const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,treePos.length),crowns=new THREE.InstancedMesh(crownGeo,crownMat,treePos.length);treePos.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.set(p[0],2.25,p[2]);dummy.scale.set(.85+r()*.5,.85+r()*.5,.85+r()*.5);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);dummy.scale.set(1,1,1)});trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;trunks.castShadow=true;crowns.castShadow=true;this.group.add(trunks,crowns);
  }

  _river(){
    const waterMat=new THREE.MeshPhysicalMaterial({color:0x082840,roughness:.24,metalness:.25,transmission:.08,transparent:true,opacity:.9});
    const river=new THREE.Mesh(new THREE.PlaneGeometry(620,76),waterMat);river.rotation.x=-Math.PI/2;river.position.set(0,.06,-244);this.group.add(river);
    const bankMat=new THREE.MeshStandardMaterial({color:0x294435,roughness:.95});
    [-1,1].forEach(s=>{const bank=new THREE.Mesh(new THREE.BoxGeometry(620,.18,10),bankMat);bank.position.set(0,.08,-244+s*43);bank.receiveShadow=true;this.group.add(bank)});
    const bridgeMat=new THREE.MeshStandardMaterial({color:0x202a33,roughness:.76,metalness:.15});const bridge=new THREE.Mesh(new THREE.BoxGeometry(19,.75,96),bridgeMat);bridge.position.set(0,.46,-244);bridge.receiveShadow=true;bridge.castShadow=true;this.group.add(bridge);
    const railMat=new THREE.MeshStandardMaterial({color:0x7f9199,metalness:.7,roughness:.35});[-9.2,9.2].forEach(x=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(.22,1.05,96),railMat);rail.position.set(x,1.15,-244);this.group.add(rail)});
  }

  _sky(){
    this.scene.background=new THREE.Color(0x050912);this.scene.fog=new THREE.FogExp2(0x07101a,.0045);
    const geo=new THREE.BufferGeometry();const count=900,pos=new Float32Array(count*3),r=this.rand;for(let i=0;i<count;i++){const rad=260+r()*420,theta=r()*Math.PI*2,phi=Math.acos(2*r()-1);pos[i*3]=Math.sin(phi)*Math.cos(theta)*rad;pos[i*3+1]=Math.abs(Math.cos(phi))*rad*.8+30;pos[i*3+2]=Math.sin(phi)*Math.sin(theta)*rad}geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xbfd8ff,size:1.15,sizeAttenuation:true,transparent:true,opacity:.78}));this.group.add(stars);
    const moon=new THREE.Mesh(new THREE.SphereGeometry(12,24,16),new THREE.MeshBasicMaterial({color:0xffe5ba}));moon.position.set(-170,120,-270);this.group.add(moon);
  }

  _bounds(){
    const walls=[[0,3,-215,430,6,2],[0,3,215,430,6,2],[-215,3,0,2,6,430],[215,3,0,2,6,430]];
    for(const [x,y,z,sx,sy,sz] of walls){const body=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(sx/2,sy/2,sz/2)),position:new CANNON.Vec3(x,y,z)});this.physics.addBody(body);this.staticBodies.push(body)}
  }

  setShadowQuality(enabled,size=1024){this.sun.castShadow=enabled;this.sun.shadow.mapSize.set(size,size);this.sun.shadow.map?.dispose?.();this.group.traverse(o=>{if(o.isMesh||o.isInstancedMesh)o.castShadow=enabled&&o.castShadow})}
}
