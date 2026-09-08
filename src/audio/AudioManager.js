const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class AudioManager{
  constructor(){
    this.ctx=null;this.master=null;this.limiter=null;this.enabled=true;this.noiseBuffer=null;this.vehicle=null;
    this.engineFundamental=null;this.engineHarmonic=null;this.engineSub=null;this.engineGain=null;this.engineFilter=null;this.harmonicGain=null;this.subGain=null;
    this.wind=null;this.windGain=null;this.windFilter=null;this.skid=null;this.skidGain=null;this.skidFilter=null;this.nitroAir=null;this.nitroGain=null;this.nitroFilter=null;
    this.state={initialized:false,engineHz:0,engineGain:0,skidGain:0,nitroGain:0,windGain:0,drift:0};
  }

  attachVehicle(vehicle){this.vehicle=vehicle;return this}

  async init(){
    if(this.ctx){if(this.ctx.state==='suspended')await this.ctx.resume();return}
    const C=window.AudioContext||window.webkitAudioContext;if(!C){this.enabled=false;return}
    this.ctx=new C();const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=.42;
    this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-10;this.limiter.knee.value=12;this.limiter.ratio.value=7;this.limiter.attack.value=.003;this.limiter.release.value=.16;
    this.master.connect(this.limiter);this.limiter.connect(c.destination);
    this.noiseBuffer=this._noiseBuffer(2);
    this._engine();this._wind();this._skid();this._nitro();
    this.state.initialized=true;
    if(c.state==='suspended')await c.resume();
  }

  _noiseBuffer(seconds=2){const c=this.ctx,buffer=c.createBuffer(1,Math.max(1,Math.floor(c.sampleRate*seconds)),c.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=last*.985+white*.015;data[i]=white*.72+last*.28}return buffer}
  _loopNoise(){const s=this.ctx.createBufferSource();s.buffer=this.noiseBuffer;s.loop=true;return s}

  _engine(){
    const c=this.ctx;this.engineGain=c.createGain();this.engineGain.gain.value=.0001;this.engineFilter=c.createBiquadFilter();this.engineFilter.type='lowpass';this.engineFilter.frequency.value=620;this.engineFilter.Q.value=.65;
    this.engineFundamental=c.createOscillator();this.engineFundamental.type='triangle';this.engineFundamental.frequency.value=58;
    this.engineHarmonic=c.createOscillator();this.engineHarmonic.type='sawtooth';this.engineHarmonic.frequency.value=116;this.harmonicGain=c.createGain();this.harmonicGain.gain.value=.045;
    this.engineSub=c.createOscillator();this.engineSub.type='sine';this.engineSub.frequency.value=29;this.subGain=c.createGain();this.subGain.gain.value=.05;
    this.engineFundamental.connect(this.engineFilter);this.engineHarmonic.connect(this.harmonicGain);this.harmonicGain.connect(this.engineFilter);this.engineSub.connect(this.subGain);this.subGain.connect(this.engineFilter);this.engineFilter.connect(this.engineGain);this.engineGain.connect(this.master);
    this.engineFundamental.start();this.engineHarmonic.start();this.engineSub.start();
  }

  _wind(){const c=this.ctx;this.wind=this._loopNoise();this.windFilter=c.createBiquadFilter();this.windFilter.type='highpass';this.windFilter.frequency.value=780;this.windGain=c.createGain();this.windGain.gain.value=.0001;this.wind.connect(this.windFilter);this.windFilter.connect(this.windGain);this.windGain.connect(this.master);this.wind.start()}
  _skid(){const c=this.ctx;this.skid=this._loopNoise();this.skidFilter=c.createBiquadFilter();this.skidFilter.type='bandpass';this.skidFilter.frequency.value=1250;this.skidFilter.Q.value=.75;this.skidGain=c.createGain();this.skidGain.gain.value=.0001;this.skid.connect(this.skidFilter);this.skidFilter.connect(this.skidGain);this.skidGain.connect(this.master);this.skid.start()}
  _nitro(){const c=this.ctx;this.nitroAir=this._loopNoise();this.nitroFilter=c.createBiquadFilter();this.nitroFilter.type='bandpass';this.nitroFilter.frequency.value=920;this.nitroFilter.Q.value=.42;this.nitroGain=c.createGain();this.nitroGain.gain.value=.0001;this.nitroAir.connect(this.nitroFilter);this.nitroFilter.connect(this.nitroGain);this.nitroGain.connect(this.master);this.nitroAir.start()}

  update(speed=0,throttle=0,nitro=false,driftIntensity=null){
    if(!this.ctx||!this.enabled)return;
    const c=this.ctx,t=c.currentTime,s=Math.max(0,Number(speed)||0),load=clamp(Math.abs(Number(throttle)||0),0,1),drift=clamp(driftIntensity==null?(Number(this.vehicle?.driftIntensity)||0):(Number(driftIntensity)||0),0,1),boost=nitro?1:0;
    const engineHz=52+Math.min(212,s*1.34)+load*34;
    this.engineFundamental.frequency.setTargetAtTime(engineHz,t,.038);this.engineHarmonic.frequency.setTargetAtTime(engineHz*2.015,t,.04);this.engineSub.frequency.setTargetAtTime(engineHz*.5,t,.06);
    this.engineFilter.frequency.setTargetAtTime(clamp(430+s*8.5+load*950+boost*320,430,3200),t,.055);
    const engineGain=.028+Math.min(.085,s/1550)+load*.044+boost*.018;this.engineGain.gain.setTargetAtTime(engineGain,t,.055);
    this.harmonicGain.gain.setTargetAtTime(.028+load*.034+Math.min(.018,s/7000),t,.06);this.subGain.gain.setTargetAtTime(.04+(1-load)*.012,t,.08);
    const windGain=Math.max(.0001,Math.min(.065,(s-28)/1650));this.windGain.gain.setTargetAtTime(windGain,t,.11);this.windFilter.frequency.setTargetAtTime(720+Math.min(720,s*4.2),t,.12);
    const skidGain=drift>.025?.008+drift*.105*clamp(s/55,.18,1):.0001;this.skidGain.gain.setTargetAtTime(skidGain,t,.035);this.skidFilter.frequency.setTargetAtTime(1000+Math.min(850,s*4.5),t,.06);
    const nitroGain=boost?.058+.02*clamp(s/120,0,1):.0001;this.nitroGain.gain.setTargetAtTime(nitroGain,t,.045);this.nitroFilter.frequency.setTargetAtTime(820+Math.min(700,s*4.5),t,.07);
    this.state={initialized:true,engineHz,engineGain,skidGain,nitroGain,windGain,drift};
  }

  beep(freq=660,dur=.08,gain=.065){if(!this.ctx||!this.enabled)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*1.16,t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02)}

  impact(intensity=.5){
    if(!this.ctx||!this.enabled)return;const c=this.ctx,t=c.currentTime,k=clamp(intensity,0,1);
    const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(105+k*35,t);o.frequency.exponentialRampToValueAtTime(31,t+.16);g.gain.setValueAtTime(.025+.07*k,t);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.19);
    if(this.noiseBuffer){const n=c.createBufferSource(),f=c.createBiquadFilter(),ng=c.createGain();n.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=420+k*520;ng.gain.setValueAtTime(.018+.055*k,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.11);n.connect(f);f.connect(ng);ng.connect(this.master);n.start(t);n.stop(t+.12)}
  }

  success(){this.beep(610,.07,.06);setTimeout(()=>this.beep(805,.08,.055),78);setTimeout(()=>this.beep(1040,.11,.05),158)}
  setVolume(v){if(this.master&&this.ctx)this.master.gain.setTargetAtTime(clamp(Number(v)||0,0,1),this.ctx.currentTime,.05)}
  snapshot(){return{enabled:this.enabled,contextState:this.ctx?.state||'uninitialized',...this.state}}
}
