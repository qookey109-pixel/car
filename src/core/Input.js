const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class Input{
  constructor(){this.keys=new Set();this.touch={left:false,right:false,gas:false,brake:false,drift:false,nitro:false};this.camera={x:0,y:0};this._bind()}
  _bind(){
    addEventListener('keydown',e=>{this.keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()},{passive:false});
    addEventListener('keyup',e=>this.keys.delete(e.code));
    document.querySelectorAll('[data-control]').forEach(btn=>{
      const key=btn.dataset.control;
      const set=v=>{this.touch[key]=v;btn.classList.toggle('active',v)};
      btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture?.(e.pointerId);set(true)});
      ['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(type=>btn.addEventListener(type,e=>{e.preventDefault();set(false)}));
    });
  }
  sample(){
    let throttle=(this.keys.has('KeyW')||this.keys.has('ArrowUp')||this.touch.gas?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')||this.touch.brake?1:0);
    let steer=(this.keys.has('KeyD')||this.keys.has('ArrowRight')||this.touch.right?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')||this.touch.left?1:0);
    let handbrake=this.keys.has('Space')||this.touch.drift,nitro=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')||this.touch.nitro;
    let cameraX=0,cameraY=0;
    const pads=navigator.getGamepads?.()||[];const p=[...pads].find(Boolean);
    if(p){
      const dz=v=>Math.abs(v)<.12?0:v;
      steer=clamp(dz(p.axes[0]||0),-1,1);
      cameraX=clamp(dz(p.axes[2]||0),-1,1);cameraY=clamp(dz(p.axes[3]||0),-1,1);
      const gas=Math.max(p.buttons[7]?.value||0,p.buttons[0]?.pressed ? .7 : 0);
      const brake=Math.max(p.buttons[6]?.value||0,p.buttons[1]?.pressed ? .7 : 0);
      if(gas>.05||brake>.05)throttle=gas-brake;
      handbrake=handbrake||Boolean(p.buttons[2]?.pressed||p.buttons[4]?.pressed);nitro=nitro||Boolean(p.buttons[5]?.pressed||p.buttons[3]?.pressed)
    }
    this.camera.x=cameraX;this.camera.y=cameraY;
    return{throttle:clamp(throttle,-1,1),steer:clamp(steer,-1,1),handbrake,nitro,cameraX,cameraY}
  }
}
