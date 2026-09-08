import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {VehicleController} from '../vehicle/VehicleController.js';
import {CityWorld} from '../world/CityWorld.js';
import {ChallengeSystem} from '../gameplay/ChallengeSystem.js';
import {AudioManager} from '../audio/AudioManager.js';
import {QualityManager} from '../rendering/QualityManager.js';
import {Effects} from '../vfx/Effects.js';
import {Input} from './Input.js';
import {HUD} from '../ui/HUD.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const damp=(a,b,lambda,dt)=>THREE.MathUtils.lerp(a,b,1-Math.exp(-lambda*dt));

export class Game{
  constructor(container){
    this.container=container;this.state='menu';this.clock=new THREE.Clock();this.accumulator=0;this.fixedDt=1/60;this.frame=0;this.cameraYaw=0;this.cameraPitch=.13;this.cameraImpulse=0;this.lastCollisionAt=0;
    this._renderer();this._physics();this._world();this._systems();this._events();this._restoreSettings();this._resize();
    this._debug();this._loop=()=>this._tick();requestAnimationFrame(this._loop);
  }

  _renderer(){
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.08,900);this.camera.position.set(0,5.5,32);
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.setSize(innerWidth,innerHeight);this.container.appendChild(this.renderer.domElement);
    this.composer=new EffectComposer(this.renderer);this.renderPass=new RenderPass(this.scene,this.camera);this.composer.addPass(this.renderPass);
    this.bloomPass=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.48,.32,.84);this.composer.addPass(this.bloomPass);
  }

  _physics(){
    this.physics=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});this.physics.allowSleep=true;this.physics.broadphase=new CANNON.SAPBroadphase(this.physics);
    this.carMaterial=new CANNON.Material('car');this.asphaltMaterial=new CANNON.Material('asphalt');
    this.physics.addContactMaterial(new CANNON.ContactMaterial(this.carMaterial,this.asphaltMaterial,{friction:.34,restitution:.02,contactEquationStiffness:1e7,contactEquationRelaxation:3}));
  }

  _world(){
    this.city=new CityWorld(this.scene,this.physics);
    this.physics.defaultContactMaterial.friction=.28;this.physics.defaultContactMaterial.restitution=.015;
    this.vehicle=new VehicleController(this.scene,this.physics);
  }

  _systems(){
    this.hud=new HUD();this.input=new Input();this.audio=new AudioManager();this.effects=new Effects(this.scene);
    this.challenges=new ChallengeSystem(this.scene,{onToast:t=>{this.hud.toast(t);this.audio.success();this.cameraImpulse=Math.min(.42,this.cameraImpulse+.13)},onComplete:s=>this._complete(s)});
    this.quality=new QualityManager(this.renderer,this.city,this.bloomPass,label=>{this.hud.qualityLabel(label);this._resize()});
    this.raycaster=new THREE.Raycaster();
    this.vehicle.chassisBody.addEventListener('collide',e=>this._collision(e));
  }

  _events(){
    this.hud.on('start',()=>this.start()).on('resume',()=>this.resume()).on('restart',()=>this.restart()).on('menu',()=>this.menu()).on('settingsPreview',s=>this.applySettings(s)).on('settings',s=>{this.applySettings(s);localStorage.setItem('neon-racer-settings',JSON.stringify(s))});
    addEventListener('resize',()=>this._resize());
    addEventListener('keydown',e=>{
      if(e.code==='Escape'){e.preventDefault();if(this.state==='running')this.pause();else if(this.state==='paused')this.resume()}
      if(e.code==='KeyR'&&this.state==='running')this.resetVehicle();
      if(e.code==='F3')this.toggleDebug();
    });
    let dragging=false,lastX=0,lastY=0;
    this.renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){dragging=true;lastX=e.clientX;lastY=e.clientY}});
    addEventListener('pointerup',()=>dragging=false);
    addEventListener('pointermove',e=>{if(!dragging||this.state!=='running')return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;this.cameraYaw=clamp(this.cameraYaw-dx*.0045,-1.1,1.1);this.cameraPitch=clamp(this.cameraPitch+dy*.003,-.05,.42)});
  }

  async start(){
    this.hud.showLoading('點火中…','啟動程序化引擎聲、物理與城市挑戰');
    try{await this.audio.init()}catch(e){console.warn('Audio init unavailable',e)}
    this.restart();
  }

  restart(){
    this.vehicle.reset({x:0,y:1.2,z:24},0);this.challenges.reset();this.state='running';this.clock.getDelta();this.accumulator=0;this.cameraYaw=0;this.cameraPitch=.13;this.hud.showGame();this.hud.toast('CITY JOURNEY · START');
  }
  pause(){if(this.state!=='running')return;this.state='paused';this.vehicle.setInput({throttle:0,steer:0,handbrake:true,nitro:false});this.hud.showPause()}
  resume(){if(this.state!=='paused')return;this.state='running';this.clock.getDelta();this.hud.hidePause();this.hud.showGame()}
  menu(){this.state='menu';this.vehicle.setInput({throttle:0,steer:0,handbrake:true,nitro:false});this.hud.hideGame();this.hud.showOnly('boot')}
  _complete(summary){this.state='complete';this.vehicle.setInput({throttle:0,steer:0,handbrake:false,nitro:false});this.hud.showComplete(summary);this.audio.success()}
  resetVehicle(){this.vehicle.reset({x:0,y:1.3,z:24},0);this.hud.toast('車輛已重置')}

  applySettings(s){this.motionEffects=s.motion;this.quality.apply(s);this._resize()}
  _restoreSettings(){let s={quality:'auto',resolution:1,bloom:true,shadows:true,motion:true};try{s={...s,...JSON.parse(localStorage.getItem('neon-racer-settings')||'{}')}}catch{}this.hud.setSettings(s);this.applySettings(s)}

  _collision(event){
    const now=performance.now();if(now-this.lastCollisionAt<220)return;this.lastCollisionAt=now;
    const impact=Math.min(1,this.vehicle.velocity.length()/22);if(impact<.14)return;
    this.audio.impact(impact);this.cameraImpulse=Math.min(.55,this.cameraImpulse+.12*impact);this.challenges.combo=1;if(impact>.4)this.hud.toast('碰撞 · Combo Reset')
  }

  _tick(){
    requestAnimationFrame(this._loop);
    const rawDt=Math.max(1/240,Math.min(.25,this.clock.getDelta()||1/60));const visualDt=Math.min(.05,rawDt);this.frame++;
    if(this.state==='running')this._update(visualDt,rawDt);else this._ambient(visualDt);
    this._camera(visualDt);this.effects.update(visualDt,this.vehicle,this.camera);this.quality.tick(rawDt);this._render();this._updateDebug(rawDt);
  }

  _update(visualDt,elapsedDt=visualDt){
    const input=this.input.sample();this.vehicle.setInput(input);
    this.accumulator=Math.min(.25,this.accumulator+Math.min(.25,elapsedDt));let steps=0;
    while(this.accumulator>=this.fixedDt&&steps<15){this.vehicle.update(this.fixedDt);this.physics.step(this.fixedDt);this.accumulator-=this.fixedDt;steps++}
    if(steps>=15&&this.accumulator>=this.fixedDt)this.accumulator%=this.fixedDt;
    const simDt=Math.max(visualDt,steps*this.fixedDt);
    this.vehicle._syncVisuals();this.challenges.update(simDt,this.vehicle);this.audio.update(this.vehicle.speedKmh,input.throttle,this.vehicle.nitroActive);this.hud.update(this.vehicle,this.challenges);
    this.cameraYaw=damp(this.cameraYaw,input.cameraX*.8,2.4,visualDt);this.cameraPitch=damp(this.cameraPitch,.13+input.cameraY*.14,2.2,visualDt);
    if(this.vehicle.position.y<-4||Math.abs(this.vehicle.position.x)>225||Math.abs(this.vehicle.position.z)>225)this.resetVehicle();
  }

  _ambient(dt){
    if(this.state==='menu'){const t=performance.now()*.00016;this.camera.position.set(Math.sin(t)*45,25,Math.cos(t)*45+10);this.camera.lookAt(0,4,0)}
    this.audio.update(0,0,false);
  }

  _camera(dt){
    if(this.state==='menu')return;
    const carPos=new THREE.Vector3(this.vehicle.position.x,this.vehicle.position.y,this.vehicle.position.z);
    const carQ=new THREE.Quaternion(this.vehicle.quaternion.x,this.vehicle.quaternion.y,this.vehicle.quaternion.z,this.vehicle.quaternion.w);
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(carQ).normalize();const right=new THREE.Vector3(1,0,0).applyQuaternion(carQ).normalize();
    const speed=this.vehicle.speedKmh;const zoom=7.2+clamp(speed/55,0,3.1)+(this.vehicle.nitroActive?1.1:0);
    const yawOffset=right.multiplyScalar(Math.sin(this.cameraYaw)*zoom*.72);const behind=forward.clone().multiplyScalar(-Math.cos(this.cameraYaw)*zoom);
    const desired=carPos.clone().add(behind).add(yawOffset);desired.y+=3.1+speed/115+this.cameraPitch*5;
    if(this.motionEffects!==false&&this.cameraImpulse>.002){desired.x+=(Math.random()-.5)*this.cameraImpulse;desired.y+=(Math.random()-.5)*this.cameraImpulse*.45;this.cameraImpulse*=Math.exp(-9*dt)}
    const safe=this._cameraCollision(carPos,desired);this.camera.position.lerp(safe,1-Math.exp(-7.5*dt));
    const look=carPos.clone().add(forward.multiplyScalar(4.3+speed*.025));look.y+=.7;this._lookTarget=this._lookTarget||look.clone();this._lookTarget.lerp(look,1-Math.exp(-8*dt));this.camera.lookAt(this._lookTarget);
    const targetFov=62+clamp(speed/28,0,8)+(this.vehicle.nitroActive?3:0);this.camera.fov=damp(this.camera.fov,targetFov,4,dt);this.camera.updateProjectionMatrix();
  }

  _cameraCollision(origin,desired){
    if(this.frame%3!==0&&this._lastSafeCamera)return this._lastSafeCamera.clone();
    const dir=desired.clone().sub(origin),len=dir.length();if(len<.1)return desired;dir.normalize();this.raycaster.set(origin.clone().add(new THREE.Vector3(0,1,0)),dir);this.raycaster.far=len;
    const targets=this.city.cameraOccluders?.length?this.city.cameraOccluders:this.city.group.children;
    const hits=this.raycaster.intersectObjects(targets,false).filter(h=>h.object.visible&&h.distance>.4);
    let safe=desired;if(hits.length&&hits[0].distance<len-1){safe=origin.clone().add(dir.multiplyScalar(Math.max(2.3,hits[0].distance-.6)));safe.y=Math.max(safe.y,origin.y+1.15)}
    this._lastSafeCamera=safe.clone();return safe;
  }

  _render(){if(this.bloomPass.enabled)this.composer.render();else this.renderer.render(this.scene,this.camera)}
  _resize(){const w=innerWidth,h=innerHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.composer.setSize(w,h)}

  _debug(){
    this.debugVisible=new URLSearchParams(location.search).has('debug');this.debug=document.createElement('pre');this.debug.style.cssText='position:fixed;z-index:90;left:8px;top:8px;margin:0;padding:8px 10px;border-radius:9px;background:#000a;color:#9ff;font:10px/1.45 ui-monospace,monospace;pointer-events:none;white-space:pre-wrap';document.body.appendChild(this.debug);this.debug.style.display=this.debugVisible?'block':'none';this.fpsAvg=60
  }
  toggleDebug(){this.debugVisible=!this.debugVisible;this.debug.style.display=this.debugVisible?'block':'none'}
  _updateDebug(dt){if(!this.debugVisible)return;this.fpsAvg=damp(this.fpsAvg,1/Math.max(.001,dt),2,Math.min(.05,dt));const info=this.renderer.info.render;this.debug.textContent=`V0.8.0 DEBUG\nFPS ${this.fpsAvg.toFixed(0)} · calls ${info.calls} · tris ${info.triangles}\nspeed ${this.vehicle.speedKmh.toFixed(0)} km/h · nitro ${(this.vehicle.nitro*100).toFixed(0)}%\npos ${this.vehicle.position.x.toFixed(1)}, ${this.vehicle.position.y.toFixed(1)}, ${this.vehicle.position.z.toFixed(1)}\nchallenge ${this.challenges.challengeIndex+1}/3 · score ${Math.round(this.challenges.score)}\nquality ${this.quality.requested}/${this.quality.effective}\nGPU ${this.quality.rendererName}`}
}
