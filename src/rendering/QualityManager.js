export class QualityManager{
  constructor(renderer,world,bloomPass,onChange=()=>{}){
    this.renderer=renderer;this.world=world;this.bloomPass=bloomPass;this.onChange=onChange;
    this.requested='auto';this.resolution=1;this.bloom=true;this.shadows=true;this.samples=[];this.lastDecision=performance.now();this.slowStreak=0;
    this.rendererName=this._rendererName();this.softwareRenderer=/swiftshader|llvmpipe|software rasterizer|software renderer/i.test(this.rendererName);
    this.effective=this.softwareRenderer?'low':'high';
    this.apply({quality:'auto',resolution:1,bloom:true,shadows:true});
  }

  _rendererName(){
    try{
      const gl=this.renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');
      return String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||'unknown');
    }catch{return'unknown'}
  }

  apply(s){
    this.requested=s.quality||this.requested;this.resolution=s.resolution??this.resolution;this.bloom=s.bloom??this.bloom;this.shadows=s.shadows??this.shadows;
    if(this.requested!=='auto')this.effective=this.requested;else if(this.softwareRenderer)this.effective='low';
    this._sync();
  }

  _sync(){
    const dpr=Math.min(window.devicePixelRatio||1,this.effective==='high'?1.6:this.effective==='medium'?1.25:1);
    const qualityScale=this.effective==='low'?(this.softwareRenderer?.45:.82):1;const scale=this.resolution*qualityScale;
    const minRatio=this.softwareRenderer?.45:.6;
    this.renderer.setPixelRatio(Math.max(minRatio,dpr*scale));
    this.renderer.shadowMap.enabled=this.shadows&&this.effective!=='low';
    if(this.world?.sun){this.world.sun.castShadow=this.renderer.shadowMap.enabled;const size=this.effective==='high'?1024:this.effective==='medium'?768:512;this.world.sun.shadow.mapSize.set(size,size)}
    if(this.bloomPass){this.bloomPass.enabled=this.bloom&&this.effective!=='low';this.bloomPass.strength=this.effective==='high'?.5:.34}
    const suffix=this.softwareRenderer&&this.requested==='auto'?' · SOFTWARE':'';
    this.onChange(this.requested==='auto'?`AUTO · ${this.effective}${suffix}`:this.effective);
  }

  tick(dt){
    if(this.requested!=='auto'||dt<=0||this.softwareRenderer)return;
    const fps=1/Math.max(1/240,Math.min(dt,1));this.samples.push(fps);if(this.samples.length>120)this.samples.shift();
    this.slowStreak=fps<24?this.slowStreak+1:Math.max(0,this.slowStreak-1);
    const now=performance.now();
    if(this.slowStreak>=6&&now-this.lastDecision>1500){
      const next=this.effective==='high'?'medium':this.effective==='medium'?'low':'low';
      if(next!==this.effective){this.effective=next;this._sync();this.samples.length=0}
      this.slowStreak=0;this.lastDecision=now;return;
    }
    if(this.samples.length<60||now-this.lastDecision<3500)return;
    const avg=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;let next=this.effective;
    if(avg<42){if(next==='high')next='medium';else if(next==='medium')next='low'}
    else if(avg>57&&now-this.lastDecision>8000){if(next==='low')next='medium';else if(next==='medium')next='high'}
    if(next!==this.effective){this.effective=next;this._sync();this.samples.length=0}
    this.lastDecision=now;
  }
}
