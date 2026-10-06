const COPY={
  launch:{kicker:'FIRST 30 SECONDS',title:'GO',line:'跟著青色 Gate，把第一段路跑乾淨。'},
  speed:{kicker:'BUILD THE FLOW',title:'KEEP IT CLEAN',line:'直線可用 N₂O；先守住路線，再追速度。'},
  checkpoint:{kicker:'FIRST GATE',title:'CLEAN',line:'就是這個節奏。下一個 Gate 在前面。'}
};

export class FirstRunDirector{
  constructor(game){
    this.game=game;
    this.profile='first-30-seconds-v1';
    this.active=false;
    this.completed=false;
    this.startedAt=0;
    this.stage='idle';
    this.shown=[];
    this.firstCheckpoint=false;
    this.seenThisSession=false;
    this.timer=0;
    this.root=document.createElement('div');
    this.root.className='first-run-director';
    this.root.innerHTML=`
      <section class="first-run-cue" aria-live="polite">
        <div class="first-run-kicker"></div>
        <div class="first-run-title"></div>
        <div class="first-run-line"></div>
      </section>
    `;
    document.body.appendChild(this.root);
    this.cue=this.root.querySelector('.first-run-cue');
    this._onFeedback=e=>{
      if(!this.active||e?.detail?.kind!=='checkpoint')return;
      if(!this.firstCheckpoint){
        this.firstCheckpoint=true;
        this._show('checkpoint',1300);
        setTimeout(()=>this.finish(),1350);
      }
    };
    addEventListener('neon-racer-feedback',this._onFeedback);
  }

  begin({firstRun=false}={}){
    clearTimeout(this.timer);
    this.hide();
    this.completed=false;
    this.firstCheckpoint=false;
    this.startedAt=performance.now();
    this.active=Boolean(firstRun&&!this.seenThisSession);
    if(firstRun)this.seenThisSession=true;
    this.stage=this.active?'armed':'returning';
    this.shown=[];
    if(!this.active)return;
    this.timer=setTimeout(()=>this._show('launch',1700),2900);
  }

  _show(stage,hold=1600){
    if(!this.active)return;
    const base=COPY[stage]||COPY.launch;
    const touch=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
    const copy={...base};
    if(stage==='launch')copy.line=touch?'按住 GAS，跟著青色 Gate。':'按住 W / ↑，跟著青色 Gate。';
    if(stage==='speed')copy.line=touch?'直線按 N₂O；先守住路線，再追速度。':'直線按 Shift；先守住路線，再追速度。';
    this.stage=stage;
    if(!this.shown.includes(stage))this.shown.push(stage);
    this.root.querySelector('.first-run-kicker').textContent=copy.kicker;
    this.root.querySelector('.first-run-title').textContent=copy.title;
    this.root.querySelector('.first-run-line').textContent=copy.line;
    this.cue.classList.remove('show');
    void this.cue.offsetWidth;
    this.cue.classList.add('show');
    clearTimeout(this.timer);
    if(stage!=='checkpoint')this.timer=setTimeout(()=>this.cue.classList.remove('show'),hold);
  }

  update(speedKmh=0,challengeIndex=0,sprintIndex=0){
    if(!this.active||this.completed||this.firstCheckpoint)return;
    const elapsed=(performance.now()-this.startedAt)/1000;
    if(elapsed<4.6)return;
    if(this.stage==='launch'&&speedKmh>28){
      this._show('speed',2200);
      return;
    }
    if(elapsed>11&&!this.firstCheckpoint)this.finish();
  }

  finish(){
    clearTimeout(this.timer);
    this.active=false;
    this.completed=true;
    this.stage='done';
    this.cue.classList.remove('show');
  }

  hide(){
    clearTimeout(this.timer);
    this.cue.classList.remove('show');
  }

  snapshot(){
    return{
      profile:this.profile,
      active:this.active,
      completed:this.completed,
      stage:this.stage,
      firstCheckpoint:this.firstCheckpoint,
      shown:[...this.shown],
      seenThisSession:this.seenThisSession,
      renderGroups:0
    };
  }
}
