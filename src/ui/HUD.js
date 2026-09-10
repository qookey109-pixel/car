import {DISTRICTS,observedDistrict} from '../world/DistrictMap.js';

const $=id=>document.getElementById(id);

export class HUD{
  constructor(){
    this.el={boot:$('boot'),loading:$('loading'),hud:$('hud'),pause:$('pause'),settings:$('settings'),controls:$('controlsModal'),complete:$('complete'),speed:$('speed'),gear:$('gear'),nitro:$('nitroBar'),score:$('score'),combo:$('combo'),objectiveTitle:$('objectiveTitle'),objectiveText:$('objectiveText'),progress:$('progressBar'),toast:$('challengeToast'),quality:$('qualityBadge'),mobile:$('mobileControls'),resolution:$('resolutionScale'),resolutionValue:$('resolutionValue'),qualitySelect:$('qualitySelect'),bloom:$('bloomToggle'),shadow:$('shadowToggle'),motion:$('motionToggle'),bootRecord:$('bootRecord'),finalRecord:$('finalRecord'),finalRoute:$('finalRoute')};
    this.toastTimer=0;this.handlers={};this._bind();
    this.districtLabel=$('districtLabel');this.districtTarget=$('districtTarget');this.district=null;this.targetDistrict=null;
    this.navigationTargetKey=null;this.navigationDistance=null;this.navigationTrend=null;
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
    this.updateDistrict(vehicle.position,challenges.targetDistrict,challenges.navigationTarget);
    const signedSpeed=vehicle.vehicle?.currentVehicleSpeedKmHour||0;
    this.el.speed.textContent=Math.round(vehicle.speedKmh);this.el.gear.textContent=this._gear(vehicle.speedKmh,signedSpeed,vehicle.input.throttle);this.el.nitro.style.width=`${Math.round(vehicle.nitro*100)}%`;
    this.el.score.textContent=Math.round(challenges.score).toLocaleString();this.el.combo.textContent=`x${challenges.combo.toFixed(1)}`;
    const o=challenges.objective;this.el.objectiveTitle.textContent=o.title;this.el.objectiveText.textContent=o.text;this.el.progress.style.width=`${Math.round(challenges.progress*100)}%`;
    if(vehicle.nitroActive)this.el.nitro.style.filter='brightness(1.5) drop-shadow(0 0 5px #6ff)';else this.el.nitro.style.filter='none';
  }

  _navigationStatus(position,target){
    if(!target){this.navigationTargetKey=null;this.navigationDistance=null;this.navigationTrend=null;return null}
    const key=target.key||`${target.kind||'target'}:${target.x}:${target.z}`;
    const radius=Math.max(0,Number(target.arrivalRadius)||0);
    const remaining=Math.max(0,Math.hypot(target.x-position.x,target.z-position.z)-radius);
    let trend=remaining<=.5?'arrived':'steady';
    if(this.navigationTargetKey===key&&this.navigationDistance!==null&&remaining>.5){
      const delta=this.navigationDistance-remaining;
      trend=delta>.06?'approaching':delta<-.06?'receding':'steady';
    }
    this.navigationTargetKey=key;this.navigationDistance=remaining;this.navigationTrend=trend;
    const labels={approaching:'接近',receding:'遠離',steady:'穩定',arrived:'抵達'};
    return{distance:Math.round(remaining),trend,label:labels[trend]};
  }

  updateDistrict(position,target,navigationTarget=null){
    const district=observedDistrict(position.x,position.z,this.district);
    const districtChanged=district!==this.district;
    const targetChanged=target!==this.targetDistrict;
    if(districtChanged){
      this.district=district;const info=DISTRICTS[district];
      this.districtLabel.textContent=`${info.label} · ${info.name}`;this.districtLabel.dataset.district=district;
      this.districtLabel.classList.remove('district-enter');
      void this.districtLabel.offsetWidth;
      this.districtLabel.classList.add('district-enter');
    }
    if(targetChanged)this.targetDistrict=target;
    const nav=this._navigationStatus(position,navigationTarget);
    if(!target){
      this.districtTarget.textContent='';delete this.districtTarget.dataset.district;delete this.districtTarget.dataset.state;delete this.districtTarget.dataset.trend;delete this.districtTarget.dataset.distance;
      return;
    }
    const info=DISTRICTS[target],arrived=district===target;
    const navCopy=nav?` · 目標 ${nav.distance}m · ${nav.label}`:'';
    const copy=`${arrived?'已抵達':'前往'} · ${info.label} · ${info.name}${navCopy}`;
    if(this.districtTarget.textContent!==copy)this.districtTarget.textContent=copy;
    this.districtTarget.dataset.district=target;this.districtTarget.dataset.state=arrived?'arrived':'travel';
    if(nav){this.districtTarget.dataset.trend=nav.trend;this.districtTarget.dataset.distance=String(nav.distance)}else{delete this.districtTarget.dataset.trend;delete this.districtTarget.dataset.distance}
  }

  _gear(speed,signedSpeed,throttle){if(speed<2&&Math.abs(throttle)<.05)return'N';if(signedSpeed>1.5||(throttle<-.05&&speed<2))return'R';return String(Math.max(1,Math.min(6,Math.floor(speed/38)+1)))}
  _formatTime(time=0){const m=Math.floor(time/60),s=Math.floor(time%60);return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  toast(text){this.el.toast.textContent=text;this.el.toast.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.el.toast.classList.remove('show'),2200)}
  qualityLabel(text){this.el.quality.textContent=String(text).toUpperCase()}

  setRecords(records={}){
    if(!this.el.bootRecord)return;
    if(!(records.runs>0)){this.el.bootRecord.textContent='PERSONAL BEST · 尚未建立';return}
    this.el.bootRecord.textContent=`PERSONAL BEST · ${Number(records.bestScore||0).toLocaleString()} pts · ${this._formatTime(records.bestTime)} · x${Number(records.bestCombo||1).toFixed(1)} · ${records.runs} clears`;
  }

  showComplete(summary){
    this.hideGame();$('finalRank').textContent=summary.rank;$('finalScore').textContent=summary.score.toLocaleString();$('finalCombo').textContent=`x${summary.bestCombo.toFixed(1)}`;$('finalTime').textContent=this._formatTime(summary.time);if(this.el.finalRoute)this.el.finalRoute.textContent=`ROUTE · ${summary.routeName||'CITY LOOP'}`;
    const r=summary.records||{};if(this.el.finalRecord){const fresh=[];if(r.newScore)fresh.push('SCORE');if(r.newTime)fresh.push('TIME');if(r.newCombo)fresh.push('COMBO');this.el.finalRecord.classList.toggle('new-best',Boolean(r.first||fresh.length));this.el.finalRecord.textContent=r.first?'FIRST CLEAR · PERSONAL BEST CREATED':fresh.length?`NEW PERSONAL BEST · ${fresh.join(' · ')}`:`BEST · ${Number(r.bestScore||summary.score).toLocaleString()} pts · ${this._formatTime(r.bestTime||summary.time)} · x${Number(r.bestCombo||summary.bestCombo).toFixed(1)} · ${r.runs||1} clears`}
    this.showOnly('complete')
  }

  readSettings(){return{quality:this.el.qualitySelect.value,resolution:Number(this.el.resolution.value)/100,bloom:this.el.bloom.checked,shadows:this.el.shadow.checked,motion:this.el.motion.checked}}
  setSettings(v){if(v.quality)this.el.qualitySelect.value=v.quality;if(v.resolution){this.el.resolution.value=Math.round(v.resolution*100);this.el.resolutionValue.textContent=`${Math.round(v.resolution*100)}%`}if(typeof v.bloom==='boolean')this.el.bloom.checked=v.bloom;if(typeof v.shadows==='boolean')this.el.shadow.checked=v.shadows;if(typeof v.motion==='boolean')this.el.motion.checked=v.motion}
}
