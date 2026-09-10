import * as THREE from 'three';
import {districtFor} from './DistrictMap.js';

export class CityAtmosphere{
  constructor(city){
    this.city=city;
    this.group=new THREE.Group();
    this.group.name='CityAtmosphere';
    city.group.add(this.group);
    this._nightDepth();
    this._roadReadability();
    this._streetEdgeDetail();
    this._trafficSignals();
    this._facadeLightRhythm();
  }

  _nightDepth(){
    const scene=this.city.scene;
    if(scene.background?.isColor)scene.background.setHex(0x06111e);
    if(scene.fog?.isFogExp2){scene.fog.color.setHex(0x10283b);scene.fog.density=.00245}

    if(this.city.hemi){this.city.hemi.color.setHex(0xa5cff2);this.city.hemi.groundColor.setHex(0x13202d);this.city.hemi.intensity=2.15}
    if(this.city.ambient){this.city.ambient.color.setHex(0x39516c);this.city.ambient.intensity=.52}
    if(this.city.sun){this.city.sun.color.setHex(0xffcba5);this.city.sun.intensity=1.78}
    if(this.city.rim){this.city.rim.color.setHex(0x4ecbff);this.city.rim.intensity=1.04}
    if(this.city.fill){this.city.fill.color.setHex(0x7488ff);this.city.fill.intensity=.42}

    let streetGlowGroups=0,skyDomes=0,starFields=0,moons=0;
    this.city.group.traverse(obj=>{
      const mat=obj?.material;
      if(mat?.uniforms?.top?.value?.isColor&&mat?.uniforms?.bottom?.value?.isColor){
        mat.uniforms.top.value.setHex(0x040b18);mat.uniforms.bottom.value.setHex(0x1b3e5c);skyDomes++;
      }
      if(obj?.isPoints&&mat?.color?.getHex?.()===0xd6e7ff){mat.opacity=.82;starFields++}
      if(obj?.isInstancedMesh&&mat?.color?.getHex?.()===0xffb259&&mat?.transparent){mat.opacity=.16;streetGlowGroups++}
      if(obj?.isMesh&&mat?.color?.getHex?.()===0xffe7be){mat.color.setHex(0xffedcf);moons++}
    });

    this.nightDepth={
      profile:'cool-amber-v1',
      fogDensity:scene.fog?.density||0,
      fogColor:scene.fog?.color?.getHex?.()||0,
      background:scene.background?.getHex?.()||0,
      streetGlowGroups,
      streetGlowOpacity:.16,
      skyLayers:skyDomes+starFields+moons
    };
    this.city.stats={...(this.city.stats||{}),nightDepthProfile:this.nightDepth.profile,nightFogDensity:this.nightDepth.fogDensity,nightStreetGlowGroups:streetGlowGroups,nightSkyLayers:this.nightDepth.skyLayers};
  }

  _roadReadability(){
    // Rebalance only the six existing InstancedMesh road layers. No geometry, transforms,
    // colliders or draw groups change: the goal is simply a clearer night hierarchy where
    // lane dashes lead the eye, edges define the corridor, and crossings stay readable
    // without becoming the brightest object at every intersection.
    const groups={road:0,curb:0,walk:0,edge:0,dash:0,cross:0};
    this.city.group.traverse(obj=>{
      if(!obj?.isInstancedMesh||!obj.material?.color)return;
      const mat=obj.material,hex=mat.color.getHex();
      if(hex===0x172734){
        groups.road++;mat.color.setHex(0x142633);mat.roughness=.52;mat.metalness=.16;
        if(mat.emissive?.isColor){mat.emissive.setHex(0x081722);mat.emissiveIntensity=.14}
      }else if(hex===0x89939a){
        groups.curb++;mat.color.setHex(0x93a1a8)
      }else if(hex===0x303a43){
        groups.walk++;mat.color.setHex(0x2b3740)
      }else if(hex===0xaacbd5){
        groups.edge++;mat.color.setHex(0xb8dce2);mat.opacity=.86
      }else if(hex===0xe7f0ed){
        groups.dash++;mat.color.setHex(0xf4f6e9)
      }else if(hex===0xf0f4ee){
        groups.cross++;mat.color.setHex(0xe5ece8);mat.opacity=.82
      }
    });
    const count=Object.values(groups).reduce((sum,n)=>sum+n,0);
    this.roadReadability={
      profile:'road-rush-v1',
      groups:count,
      layers:groups,
      edgeOpacity:.86,
      crossOpacity:.82,
      dashColor:0xf4f6e9,
      edgeColor:0xb8dce2
    };
    this.city.stats={...(this.city.stats||{}),roadReadabilityProfile:this.roadReadability.profile,roadReadabilityGroups:count};
  }

  _streetEdgeDetail(){
    // One shared visual-only InstancedMesh. V2 keeps the storefront bay rhythm, while
    // district-rhythm-v1 gives the same instances distinct spatial identities without
    // adding geometry, draw groups, colliders or camera occluders.
    const records=[];
    const counts={awnings:0,bladeSigns:0,curbProps:0,shopMullions:0,entryFrames:0};
    const districtInstances={core:0,avenue:0,edge:0};
    const districtBuildings={core:0,avenue:0,edge:0};
    const palettes={
      core:{
        neon:[0xffb761,0xff5fae,0x74e6ff,0xffdf7a],
        frame:[0x3d6275,0x5b5367,0x3f665c],
        props:[0x5d6970,0x536878,0x4f705f]
      },
      avenue:{
        neon:[0x72d9ff,0xffc16e,0x76ffc4,0xc4a0ff],
        frame:[0x315c70,0x59616c,0x3c6259],
        props:[0x4f6470,0x455f72,0x496b58]
      },
      edge:{
        neon:[0x7094a6,0x987f94,0x719385,0xa39b78],
        frame:[0x324a58,0x48535c,0x38544d],
        props:[0x465862,0x3f5263,0x435b50]
      }
    };
    const add=(x,y,z,sx,sy,sz,rotY,color,kind,district)=>{
      records.push({x,y,z,sx,sy,sz,rotY,color,kind,district});
      counts[kind]++;
      districtInstances[district]++;
    };
    const buildings=this.city.staticBodies.slice(0,this.city.stats?.buildings||0);

    buildings.forEach((body,i)=>{
      const shape=body?.shapes?.[0],he=shape?.halfExtents;
      if(!he)return;
      const x=body.position.x,z=body.position.z,district=districtFor(x,z),palette=palettes[district];
      districtBuildings[district]++;
      const frontSpan=Math.max(3.6,he.x*1.18),sideSpan=Math.max(3.6,he.z*1.14);
      const awningY=district==='core'?2.78:(district==='edge'?2.62:2.72);
      const awningH=district==='core'?.18:(district==='edge'?.13:.16);
      const c=palette.neon[i%palette.neon.length],frame=palette.frame[i%palette.frame.length];
      add(x,awningY,z-he.z-.18,frontSpan,awningH,.38,0,c,'awnings',district);
      add(x,awningY,z+he.z+.18,frontSpan,awningH,.38,0,palette.neon[(i+1)%palette.neon.length],'awnings',district);
      if(i%3!==1){
        add(x-he.x-.18,awningY,z,sideSpan,awningH,.38,Math.PI/2,palette.neon[(i+2)%palette.neon.length],'awnings',district);
        add(x+he.x+.18,awningY,z,sideSpan,awningH,.38,Math.PI/2,palette.neon[(i+3)%palette.neon.length],'awnings',district);
      }
      if((i&1)===0){
        const side=(i&2)?1:-1;
        const signH=district==='core'?1.5:(district==='edge'?1.08:1.35);
        const signW=district==='core'?.25:(district==='edge'?.18:.22);
        add(x+side*(he.x+.24),3.6,z-he.z*.5,signW,signH,.52,0,palette.neon[(i+2)%palette.neon.length],'bladeSigns',district);
      }

      const bayCount=he.x>8?3:2;
      for(let b=1;b<bayCount;b++){
        const ox=-he.x+(he.x*2*b/bayCount);
        add(x+ox,1.34,z-he.z-.135,.105,2.22,.14,0,frame,'shopMullions',district);
        add(x+ox,1.34,z+he.z+.135,.105,2.22,.14,0,frame,'shopMullions',district);
      }
      if((i&1)===0){
        const doorX=x+Math.min(he.x*.32,2.4)*(i%4<2?-1:1),frontZ=z-he.z-.145;
        add(doorX-.72,1.15,frontZ,.11,2.08,.15,0,frame,'entryFrames',district);
        add(doorX+.72,1.15,frontZ,.11,2.08,.15,0,frame,'entryFrames',district);
        add(doorX,2.18,frontZ,1.55,.11,.15,0,frame,'entryFrames',district);
      }
    });

    const roads=this.city.roadPositions||[];
    const nearestIntersection=q=>roads.length?Math.min(...roads.map(p=>Math.abs(q-p))):999;
    roads.forEach((road,ri)=>{
      let step=0;
      for(let q=-186;q<=186;q+=30,step++){
        if(nearestIntersection(q)<15)continue;
        const side=((step+ri)&1)?1:-1,type=(step+ri)%3;
        const dims=type===0?[.18,.72,.18]:type===1?[.55,1.02,.38]:[1.18,.38,.54];
        const verticalDistrict=districtFor(road+side*11.45,q);
        const horizontalDistrict=districtFor(q,road-side*11.45);
        add(road+side*11.45,dims[1]*.5,q,dims[0],dims[1],dims[2],0,palettes[verticalDistrict].props[type],'curbProps',verticalDistrict);
        add(q,dims[1]*.5,road-side*11.45,dims[0],dims[1],dims[2],Math.PI/2,palettes[horizontalDistrict].props[type],'curbProps',horizontalDistrict);
      }
    });

    const geo=new THREE.BoxGeometry(1,1,1);
    const mat=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x101820,emissiveIntensity:.18});
    const mesh=new THREE.InstancedMesh(geo,mat,records.length);
    mesh.name='CityStreetEdgeDetails';
    const dummy=new THREE.Object3D(),color=new THREE.Color();
    records.forEach((p,i)=>{
      dummy.position.set(p.x,p.y,p.z);
      dummy.rotation.set(0,p.rotY,0);
      dummy.scale.set(p.sx,p.sy,p.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      mesh.setColorAt(i,color.setHex(p.color));
    });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=false;
    mesh.receiveShadow=false;
    this.group.add(mesh);

    this.streetEdgeDetails=mesh;
    this.streetEdgeProfile='near-street-v2';
    this.streetEdgeRenderGroups=1;
    this.streetEdgeCounts={...counts,total:records.length};
    this.districtProfile='district-rhythm-v1';
    this.districtInstanceCounts={...districtInstances};
    this.districtBuildingCounts={...districtBuildings};
    this.districtPalettes={
      core:palettes.core.neon.slice(),
      avenue:palettes.avenue.neon.slice(),
      edge:palettes.edge.neon.slice()
    };
    this.city.stats={
      ...(this.city.stats||{}),
      streetEdgeProfile:this.streetEdgeProfile,
      streetEdgeRenderGroups:this.streetEdgeRenderGroups,
      streetEdgeInstances:records.length,
      streetEdgeAwnings:counts.awnings,
      streetEdgeBladeSigns:counts.bladeSigns,
      streetEdgeCurbProps:counts.curbProps,
      streetEdgeShopMullions:counts.shopMullions,
      streetEdgeEntryFrames:counts.entryFrames,
      districtProfile:this.districtProfile,
      districtCoreInstances:districtInstances.core,
      districtAvenueInstances:districtInstances.avenue,
      districtEdgeInstances:districtInstances.edge,
      districtCoreBuildings:districtBuildings.core,
      districtAvenueBuildings:districtBuildings.avenue,
      districtEdgeBuildings:districtBuildings.edge
    };
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
      const isGreen=next?!signal.greenPhase0:signal.greenPhase0;
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

  _facadeLightRhythm(){
    const targets={windows:null,signs:null,shops:null};
    const expected={windows:this.city.stats?.windows||0,signs:this.city.stats?.signs||0,shops:this.city.stats?.shopfronts||0};
    const colors={windows:0x8bdcff,signs:0xff5fb8,shops:0xffc46b};
    this.city.group.traverse(obj=>{
      if(!obj?.isInstancedMesh||!obj.material?.color)return;
      const hex=obj.material.color.getHex();
      for(const key of Object.keys(targets)){
        if(expected[key]>0&&!targets[key]&&obj.count===expected[key]&&hex===colors[key])targets[key]=obj;
      }
    });
    this.facadeLights=targets;
    this.facadeLightGroups=Object.values(targets).filter(Boolean).length;
    this.facadeLightCycle=0;
    this.facadeLightIntervalMs=1800;
    this._facadeColor=new THREE.Color();
    this.setFacadeLightCycle(0,true);
    this.city.stats={...(this.city.stats||{}),facadeLightGroups:this.facadeLightGroups,facadeLightCycle:this.facadeLightCycle};
    this._facadeTimer=setInterval(()=>this.setFacadeLightCycle((this.facadeLightCycle+1)&3),this.facadeLightIntervalMs);
  }

  _applyFacadeBrightness(mesh,phase,step,dim){
    if(!mesh)return;
    for(let i=0;i<mesh.count;i++){
      const low=((i*step+phase*3)%11)===0;
      const soft=((i*(step+2)+phase)%17)===0;
      const brightness=low?dim:(soft?.82:1);
      this._facadeColor.setRGB(brightness,brightness,brightness);
      mesh.setColorAt(i,this._facadeColor);
    }
    if(mesh.instanceColor){
      if(mesh.instanceColor.usage!==THREE.DynamicDrawUsage)mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceColor.needsUpdate=true;
    }
  }

  setFacadeLightCycle(cycle,force=false){
    const next=(Number(cycle)||0)&3;
    if(!force&&next===this.facadeLightCycle)return;
    this._applyFacadeBrightness(this.facadeLights.windows,next,5,.58);
    this._applyFacadeBrightness(this.facadeLights.signs,next+1,7,.7);
    this._applyFacadeBrightness(this.facadeLights.shops,next+2,9,.84);
    this.facadeLightCycle=next;
    if(this.city.stats)this.city.stats.facadeLightCycle=next;
  }
}
