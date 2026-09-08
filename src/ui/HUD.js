const $=id=>document.getElementById(id);

export class HUD{
  constructor(){
    this.el={boot:$('boot'),loading:$('loading'),hud:$('hud'),pause:$('pause'),settings:$('settings'),controls:$('controlsModal'),complete:$('complete'),speed:$('speed'),gear:$('gear'),nitro:$('nitroBar'),score:$('score'),combo:$('combo'),objectiveTitle:$('objectiveTitle'),objectiveText:$('objectiveText'),progress:$('progressBar'),toast:$('challengeToast'),quality:$('qualityBadge'),mobile:$('mobileControls'),resolution:$('resolutionScale'),resolutionValue:$('resolutionValue'),qualitySelect:$('qualitySelect'),bloom:$('bloomToggle'),shadow:$('shadowToggle'),motion:$('motionToggle')};
    this.toastTimer=0;this.handlers={};this._bind();
  }

  _bind(){
    const on=(id,event,fn)=>$(id)?.addEventListener(event,fn);
    on('startGame','click',()=>this.emit('start'));on('resumeGame','click',()=>this.emit('resume'));on('restartGame','click',()=>this.emit('restart'));on('playAgain','click',()=>this.emit('restart'));
    on('backToMenu','click',()=>this.emit('menu'));on('completeMenu','click',()=>this.emit('menu'));
    on('openSettings','click',()=>this.openSettings());on('pauseSettings','click',()=>this.openSettings(true));on('closeSettings','click',()=>{this.closeSettings();this.emit('settings',this.readSettings())});
    on('openControls','click',()=>this.showOnly('controls'));on('closeControls','click',()=>this.showOnly('boot'));
    this.el.resolution?.addEventListener('input',()=>this.el.resolutionValue.textContent=`${this.el.resolution.value}%`);
    ['qualitySelect','resolutionScale','bloomToggle','shadowToggle','motionToggle'].forEach(id=>$(id)?.addEventListener('change',()=>this.emit('settingsPreview',this.readSettings())));
  }

  on(name,fn){(this.handlers[name]||(this.handlers[name]=[])).push(fn);return this}
  emit(name,payload){for(const fn of this.handlers[name]||[])fn(payload)}

  showOnly(name){
    const map={boot:this.el.boot,loading:this.el.loading,pause:this.el.pause,settings:this.el.settings,controls:this.el.controls,complete:this.el.complete};
    Object.values(map).forEach(e=>e?.classList.remove('visible','screen-visible'));
    map[name]?.classList.add('visible');
  }

  showLoading(title='正在建立三蘆夜景…',detail='道路、建築、車輛與挑戰系統'){$('loadingTitle').textContent=title;$('loadingDetail').textContent=detail;this.showOnly('loading')}
  showGame(){['boot','loading','pause','settings','controls','complete'].forEach(n=>this.el[n]?.classList.remove('visible','screen-visible'));this.el.hud.classList.remove('hidden');this.el.mobile.classList.remove('hidden')}
  hideGame(){this.el.hud.classList.add('hidden');this.el.mobile.classList.add('hidden')}
  showPause(){this.showOnly('pause')}
  hidePause(){this.el.pause.classList.remove('visible')}
  openSettings(fromPause=false){this.settingsReturn=fromPause?'pause':'boot';this.showOnly('settings')}
  closeSettings(){this.showOnly(this.settingsReturn||'boot')}

  update(vehicle,challenges){
    this.el.speed.textContent=Math.round(vehicle.speedKmh);this.el.gear.textContent=this._gear(vehicle.speedKmh,vehicle.input.throttle);this.el.nitro.style.width=`${Math.round(vehicle.nitro*100)}%`;
    this.el.score.textContent=Math.round(challenges.score).toLocaleString();this.el.combo.textContent=`x${challenges.combo.toFixed(1)}`;
    const o=challenges.objective;this.el.objectiveTitle.textContent=o.title;this.el.objectiveText.textContent=o.text;this.el.progress.style.width=`${Math.round(challenges.progress*100)}%`;
    if(vehicle.nitroActive)this.el.nitro.style.filter='brightness(1.5) drop-shadow(0 0 5px #6ff)';else this.el.nitro.style.filter='none';
  }

  _gear(speed,throttle){if(speed<2&&Math.abs(throttle)<.05)return'N';if(throttle<-.05&&speed<8)return'R';return String(Math.max(1,Math.min(6,Math.floor(speed/38)+1)))}
  toast(text){this.el.toast.textContent=text;this.el.toast.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.el.toast.classList.remove('show'),2200)}
  qualityLabel(text){this.el.quality.textContent=String(text).toUpperCase()}

  showComplete(summary){
    this.hideGame();$('finalRank').textContent=summary.rank;$('finalScore').textContent=summary.score.toLocaleString();$('finalCombo').textContent=`x${summary.bestCombo.toFixed(1)}`;const m=Math.floor(summary.time/60),s=Math.floor(summary.time%60);$('finalTime').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;this.showOnly('complete')
  }

  readSettings(){return{quality:this.el.qualitySelect.value,resolution:Number(this.el.resolution.value)/100,bloom:this.el.bloom.checked,shadows:this.el.shadow.checked,motion:this.el.motion.checked}}
  setSettings(v){if(v.quality)this.el.qualitySelect.value=v.quality;if(v.resolution){this.el.resolution.value=Math.round(v.resolution*100);this.el.resolutionValue.textContent=`${Math.round(v.resolution*100)}%`}if(typeof v.bloom==='boolean')this.el.bloom.checked=v.bloom;if(typeof v.shadows==='boolean')this.el.shadow.checked=v.shadows;if(typeof v.motion==='boolean')this.el.motion.checked=v.motion}
}
