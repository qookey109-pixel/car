export class StageTransition{
  constructor(hud){
    this.hud=hud;this.toast=hud?.el?.toast||document.getElementById('challengeToast');this.objectivePanel=document.querySelector('.hud-top-left');
    this.timer=0;this.state={profile:'stage-transition-v1',active:false,count:0,lastFrom:null,lastTo:null,lastText:''};
    this._listener=e=>this._handle(e?.detail||{});window.addEventListener('neon-racer-feedback',this._listener);
  }

  _transitionFor(text=''){
    const value=String(text);
    if(/^Time Attack 完成/i.test(value))return{from:'TIME ATTACK',to:'DRIFT RUN',next:'drift'};
    if(/^Drift Run 完成/i.test(value))return{from:'DRIFT RUN',to:'SPEED TRAP',next:'speed'};
    return null;
  }

  _clear(){
    clearTimeout(this.timer);this.toast?.classList.remove('stage-transition');this.objectivePanel?.classList.remove('stage-transition');
    if(this.toast){delete this.toast.dataset.phase;delete this.toast.dataset.nextStage}
    this.state.active=false;
  }

  _handle(detail={}){
    const transition=detail.kind==='milestone'?this._transitionFor(detail.text):null;
    if(!transition){this._clear();return}
    this._clear();
    const display=`${transition.from} ✓ → ${transition.to}`;
    if(this.toast){this.toast.textContent=display;this.toast.dataset.phase='transition';this.toast.dataset.nextStage=transition.next;void this.toast.offsetWidth;this.toast.classList.add('stage-transition')}
    if(this.objectivePanel){void this.objectivePanel.offsetWidth;this.objectivePanel.classList.add('stage-transition')}
    this.state={...this.state,active:true,count:this.state.count+1,lastFrom:transition.from,lastTo:transition.to,lastText:display};
    this.timer=setTimeout(()=>{this.toast?.classList.remove('stage-transition');this.objectivePanel?.classList.remove('stage-transition');this.state.active=false},760);
  }

  snapshot(){return{...this.state}}
}
