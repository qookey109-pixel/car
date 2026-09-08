import * as THREE from 'three';
import * as CANNON from 'cannon-es';

function rng(seed=7331){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}

export class CityWorld{
  constructor(scene,physics){this.scene=scene;this.physics=physics;this.rand=rng();this.staticBodies=[];this.cameraOccluders=[];this.group=new THREE.Group();this.group.name='SanchongLuzhouCity';scene.add(this.group);this._lights();this._ground();this._roads();this._buildings();this._streetDetails();this._river();this._sky();this._bounds()}

  _lights(){
    this.hemi=new THREE.HemisphereLight(0x9fc4ee,0x16202b,2.05);this.scene.add(this.hemi);
    this.ambient=new THREE.AmbientLight(0x31465d,.48);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight(0xffd3aa,2.05);this.sun.position.set(-90,140,60);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.camera.left=-160;this.sun.shadow.camera.right=160;this.sun.shadow.camera.top=160;this.sun.shadow.camera.bottom=-160;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=330;this.scene.add(this.sun);
    this.rim=new THREE.DirectionalLight(0x4ebeff,.88);this.rim.position.set(80,65,-120);this.scene.add(this.rim);
    this.fill=new THREE.DirectionalLight(0x7a84ff,.34);this.fill.position.set(20,40,120);this.scene.add(this.fill);
  }

  _ground(){
    const groundMat=new THREE.MeshStandardMaterial({color:0x0c151e,roughness:.9,metalness:.05});
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(720,720),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.02;ground.receiveShadow=true;this.group.add(ground);
    const physMat=new CANNON.Material('asphalt');this.groundBody=new CANNON.Body({mass:0,material:physMat,shape:new CANNON.Plane()});this.groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);this.physics.addBody(this.groundBody);
  }

  _roads(){
    const roadMat=new THREE.MeshStandardMaterial({color:0x172734,roughness:.56,metalness:.16,emissive:0x07121d,emissiveIntensity:.1});
    const curbMat=new THREE.MeshStandardMaterial({color:0x89939a,roughness:.72,metalness:.08});
    const walkMat=new THREE.MeshStandardMaterial({color:0x2a333b,roughness:.88,metalness:.02});
    const edgeMat=new THREE.MeshBasicMaterial({color:0x9fc0c9,transparent:true,opacity:.72});
    const roadPositions=[-180,-120,-60,0,60,120,180],dummy=new THREE.Object3D();

    const roadGeo=new THREE.BoxGeometry(18,.035,420),roadInstances=[];
    const curbGeo=new THREE.BoxGeometry(.45,.12,420),curbInstances=[];
    const walkGeo=new THREE.BoxGeometry(2.3,.06,420),walkInstances=[];
    const edgeGeo=new THREE.BoxGeometry(.08,.018,420),edgeInstances=[];
    for(const p of roadPositions){
      roadInstances.push([p,.018,0,0],[0,.019,p,Math.PI/2]);
      for(const side of [-1,1]){
        curbInstances.push([p+side*9.2,.06,0,0],[0,.06,p+side*9.2,Math.PI/2]);
        walkInstances.push([p+side*10.55,.035,0,0],[0,.036,p+side*10.55,Math.PI/2]);
        edgeInstances.push([p+side*7.1,.049,0,0],[0,.05,p+side*7.1,Math.PI/2]);
      }
    }
    const makeInst=(geo,mat,records,receiveShadow=false)=>{const mesh=new THREE.InstancedMesh(geo,mat,records.length);records.forEach((m,i)=>{dummy.position.set(m[0],m[1],m[2]);dummy.rotation.set(0,m[3],0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=receiveShadow;this.group.add(mesh);return mesh};
    makeInst(roadGeo,roadMat,roadInstances,true);makeInst(curbGeo,curbMat,curbInstances);makeInst(walkGeo,walkMat,walkInstances,true);makeInst(edgeGeo,edgeMat,edgeInstances);

    const dashGeo=new THREE.BoxGeometry(.16,.025,4.2),dashMat=new THREE.MeshBasicMaterial({color:0xe7f0ed});
    const marks=[];for(const p of roadPositions){for(let z=-200;z<=200;z+=12)marks.push([p,.045,z,0]);for(let x=-200;x<=200;x+=12)marks.push([x,.046,p,Math.PI/2])}
    makeInst(dashGeo,dashMat,marks);

    const crossGeo=new THREE.BoxGeometry(.42,.025,4.8),crossMat=new THREE.MeshBasicMaterial({color:0xe9f0e8,transparent:true,opacity:.9});
    const crossings=[];for(const x of roadPositions)for(const z of roadPositions){for(let i=-4;i<=4;i++){crossings.push([x+i*1.15,.054,z-6.2,0]);crossings.push([x-6.2,.055,z+i*1.15,Math.PI/2])}}
    makeInst(crossGeo,crossMat,crossings);
    this.roadPositions=roadPositions;this.roadRenderGroups=6;
  }

  _buildings(){
    const bodyGeo=new THREE.BoxGeometry(1,1,1);
    const bodyMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72,metalness:.04,vertexColors:true,emissive:0x172331,emissiveIntensity:.28});
    const windowGeo=new THREE.BoxGeometry(1,.15,.055);const windowMat=new THREE.MeshBasicMaterial({color:0x8edfff,transparent:true,opacity:.82});
    const signGeo=new THREE.BoxGeometry(1,1,.08);const signMat=new THREE.MeshBasicMaterial({color:0xff4fae,transparent:true,opacity:.92});
    const shopGeo=new THREE.BoxGeometry(1,1,.07);const shopMat=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,opacity:.82});
    const roofGeo=new THREE.BoxGeometry(1,1,1);const roofMat=new THREE.MeshStandardMaterial({color:0x53606a,roughness:.78,metalness:.12});
    const records=[],windows=[],signs=[],shops=[],roofs=[];const r=this.rand;
    const centers=[-150,-90,-30,30,90,150];
    const palette=[0xc9c7bc,0xb9c6c8,0xd0c0ac,0xa9bbb5,0xc7b3ad,0xa9b1ba,0xc9c0b5,0x9facb7];
    const shopPalette=[0xffc46b,0x6ce7ff,0xff70bb,0xa0ffba,0xff8a69];
    for(const bx of centers)for(const bz of centers){
      const count=2+Math.floor(r()*3);
      for(let j=0;j<count;j++){
        const w=10+r()*15,d=10+r()*15,h=12+r()*50;
        const x=bx+(r()-.5)*26,z=bz+(r()-.5)*26;
        records.push({x,z,w,d,h,color:palette[Math.floor(r()*palette.length)]});
        const floors=Math.max(2,Math.min(8,Math.floor(h/5)));
        for(let f=1;f<=floors;f++)if(r()>.18){const y=2.2+f*(h/(floors+1));windows.push({x,y,z:z-d/2-.055,w:w*.72,rot:0});if(r()>.42)windows.push({x:x+w/2+.055,y,z,w:d*.68,rot:Math.PI/2})}
        if(r()>.42)signs.push({x:x+(r()-.5)*w*.5,y:3.1+r()*5,z:z-d/2-.12,w:2.2+r()*3.8,h:1+r()*2.1});
        if(r()>.28)shops.push({x,y:1.45,z:z-d/2-.09,w:w*.72,h:2.15,color:shopPalette[Math.floor(r()*shopPalette.length)]});
        if(r()>.48)roofs.push({x:x+(r()-.5)*w*.25,y:h+.45,z:z+(r()-.5)*d*.25,w:2.5+r()*4,h:.9+r()*1.3,d:2.2+r()*3.5});
      }
    }
    const bInst=new THREE.InstancedMesh(bodyGeo,bodyMat,records.length);const dmy=new THREE.Object3D();const col=new THREE.Color();
    records.forEach((b,i)=>{dmy.position.set(b.x,b.h/2,b.z);dmy.scale.set(b.w,b.h,b.d);dmy.rotation.y=(r()-.5)*.045;dmy.updateMatrix();bInst.setMatrixAt(i,dmy.matrix);bInst.setColorAt(i,col.setHex(b.color));this._buildingCollider(b)});bInst.castShadow=false;bInst.receiveShadow=true;bInst.instanceMatrix.needsUpdate=true;bInst.instanceColor.needsUpdate=true;this.group.add(bInst);this.cameraOccluders.push(bInst);
    const wInst=new THREE.InstancedMesh(windowGeo,windowMat,windows.length);windows.forEach((w,i)=>{dmy.position.set(w.x,w.y,w.z);dmy.scale.set(w.w,1,1);dmy.rotation.set(0,w.rot,0);dmy.updateMatrix();wInst.setMatrixAt(i,dmy.matrix)});wInst.instanceMatrix.needsUpdate=true;this.group.add(wInst);
    const sInst=new THREE.InstancedMesh(signGeo,signMat,signs.length);signs.forEach((s,i)=>{dmy.position.set(s.x,s.y,s.z);dmy.scale.set(s.w,s.h,1);dmy.rotation.set(0,0,0);dmy.updateMatrix();sInst.setMatrixAt(i,dmy.matrix)});sInst.instanceMatrix.needsUpdate=true;this.group.add(sInst);
    const shInst=new THREE.InstancedMesh(shopGeo,shopMat,shops.length);shops.forEach((s,i)=>{dmy.position.set(s.x,s.y,s.z);dmy.scale.set(s.w,s.h,1);dmy.rotation.set(0,0,0);dmy.updateMatrix();shInst.setMatrixAt(i,dmy.matrix);shInst.setColorAt(i,col.setHex(s.color))});shInst.instanceMatrix.needsUpdate=true;shInst.instanceColor.needsUpdate=true;this.group.add(shInst);
    const roofInst=new THREE.InstancedMesh(roofGeo,roofMat,roofs.length);roofs.forEach((s,i)=>{dmy.position.set(s.x,s.y,s.z);dmy.scale.set(s.w,s.h,s.d);dmy.rotation.set(0,0,0);dmy.updateMatrix();roofInst.setMatrixAt(i,dmy.matrix)});roofInst.instanceMatrix.needsUpdate=true;roofInst.castShadow=false;this.group.add(roofInst);
    this.stats={buildings:records.length,windows:windows.length,signs:signs.length,shopfronts:shops.length,rooftops:roofs.length};
  }

  _buildingCollider(b){const body=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(b.w*.5,b.h*.5,b.d*.5)),position:new CANNON.Vec3(b.x,b.h*.5,b.z)});this.physics.addBody(body);this.staticBodies.push(body)}

  _streetDetails(){
    const r=this.rand,dummy=new THREE.Object3D();
    const poleGeo=new THREE.CylinderGeometry(.07,.09,4.8,6),poleMat=new THREE.MeshStandardMaterial({color:0x44535e,metalness:.55,roughness:.5});
    const bulbGeo=new THREE.SphereGeometry(.17,8,6),bulbMat=new THREE.MeshBasicMaterial({color:0xffcf86});
    const poolGeo=new THREE.CircleGeometry(3.2,12),poolMat=new THREE.MeshBasicMaterial({color:0xffb259,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    const lampPos=[];for(const road of this.roadPositions){for(let q=-195;q<=195;q+=24){lampPos.push([road+7.7,2.4,q]);lampPos.push([q,2.4,road+7.7])}}
    const poles=new THREE.InstancedMesh(poleGeo,poleMat,lampPos.length),bulbs=new THREE.InstancedMesh(bulbGeo,bulbMat,lampPos.length),pools=new THREE.InstancedMesh(poolGeo,poolMat,lampPos.length);
    lampPos.forEach((p,i)=>{dummy.position.set(...p);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);dummy.position.set(p[0],4.72,p[2]);dummy.updateMatrix();bulbs.setMatrixAt(i,dummy.matrix);dummy.position.set(p[0],.075,p[2]);dummy.rotation.x=-Math.PI/2;dummy.scale.set(1.3,1.3,1.3);dummy.updateMatrix();pools.setMatrixAt(i,dummy.matrix)});poles.instanceMatrix.needsUpdate=true;bulbs.instanceMatrix.needsUpdate=true;pools.instanceMatrix.needsUpdate=true;this.group.add(poles,bulbs,pools);

    const trunkGeo=new THREE.CylinderGeometry(.12,.16,1.6,6),trunkMat=new THREE.MeshStandardMaterial({color:0x5a4130,roughness:1});
    const crownGeo=new THREE.IcosahedronGeometry(1.15,1),crownMat=new THREE.MeshStandardMaterial({color:0x2b7655,roughness:.94,emissive:0x0b2018,emissiveIntensity:.22});
    const treePos=[];for(let i=0;i<72;i++){const road=this.roadPositions[Math.floor(r()*this.roadPositions.length)],along=-190+r()*380;if(r()>.5)treePos.push([road-7.6,.8,along]);else treePos.push([along,.8,road-7.6])}
    const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,treePos.length),crowns=new THREE.InstancedMesh(crownGeo,crownMat,treePos.length);treePos.forEach((p,i)=>{dummy.position.set(...p);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.set(p[0],2.25,p[2]);dummy.scale.set(.85+r()*.5,.85+r()*.5,.85+r()*.5);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix)});trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;trunks.castShadow=false;crowns.castShadow=false;this.group.add(trunks,crowns);
    this.stats={...(this.stats||{}),streetLights:lampPos.length,trees:treePos.length,roadRenderGroups:this.roadRenderGroups};
  }

  _river(){
    const waterMat=new THREE.MeshStandardMaterial({color:0x0b3655,roughness:.34,metalness:.26,emissive:0x041524,emissiveIntensity:.48,transparent:true,opacity:.94});
    const river=new THREE.Mesh(new THREE.PlaneGeometry(620,76),waterMat);river.rotation.x=-Math.PI/2;river.position.set(0,.06,-244);this.group.add(river);
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(620,7),new THREE.MeshBasicMaterial({color:0x269ddd,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.set(0,.075,-244);this.group.add(glow);
    const bankMat=new THREE.MeshStandardMaterial({color:0x355441,roughness:.92,emissive:0x0a1c12,emissiveIntensity:.16});
    [-1,1].forEach(s=>{const bank=new THREE.Mesh(new THREE.BoxGeometry(620,.18,10),bankMat);bank.position.set(0,.08,-244+s*43);bank.receiveShadow=true;this.group.add(bank)});
    const bridgeMat=new THREE.MeshStandardMaterial({color:0x27343e,roughness:.58,metalness:.18});const bridge=new THREE.Mesh(new THREE.BoxGeometry(19,.75,96),bridgeMat);bridge.position.set(0,.46,-244);bridge.receiveShadow=true;bridge.castShadow=false;this.group.add(bridge);this.cameraOccluders.push(bridge);
    const railMat=new THREE.MeshStandardMaterial({color:0x9dadb5,metalness:.72,roughness:.32});[-9.2,9.2].forEach(x=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(.22,1.05,96),railMat);rail.position.set(x,1.15,-244);this.group.add(rail)});
  }

  _sky(){
    this.scene.background=new THREE.Color(0x07111e);this.scene.fog=new THREE.FogExp2(0x0a1824,.00325);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(700,20,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x07101f)},bottom:{value:new THREE.Color(0x18324a)}},vertexShader:'varying float vY; void main(){vY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying float vY; uniform vec3 top; uniform vec3 bottom; void main(){float h=smoothstep(-0.15,0.8,vY);gl_FragColor=vec4(mix(bottom,top,h),1.0);}'}));this.group.add(dome);
    const geo=new THREE.BufferGeometry();const count=720,pos=new Float32Array(count*3),r=this.rand;for(let i=0;i<count;i++){const rad=300+r()*320,theta=r()*Math.PI*2,phi=Math.acos(2*r()-1);pos[i*3]=Math.sin(phi)*Math.cos(theta)*rad;pos[i*3+1]=Math.abs(Math.cos(phi))*rad*.82+34;pos[i*3+2]=Math.sin(phi)*Math.sin(theta)*rad}geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xcfe2ff,size:1.05,sizeAttenuation:true,transparent:true,opacity:.72,depthWrite:false}));this.group.add(stars);
    const moon=new THREE.Mesh(new THREE.SphereGeometry(12,20,12),new THREE.MeshBasicMaterial({color:0xffe7be}));moon.position.set(-170,120,-270);this.group.add(moon);
  }

  _bounds(){
    const walls=[[0,3,-215,430,6,2],[0,3,215,430,6,2],[-215,3,0,2,6,430],[215,3,0,2,6,430]];
    for(const [x,y,z,sx,sy,sz] of walls){const body=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(sx/2,sy/2,sz/2)),position:new CANNON.Vec3(x,y,z)});this.physics.addBody(body);this.staticBodies.push(body)}
  }

  setShadowQuality(enabled,size=1024){this.sun.castShadow=enabled;this.sun.shadow.mapSize.set(size,size);this.sun.shadow.map?.dispose?.()}
}
