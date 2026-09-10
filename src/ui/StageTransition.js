export class StageTransition{
  constructor(hud){
    this.hud=hud;this.toast=hud?.el?.toast||document.getElementById('challengeToast');this.objectivePanel=document.querySelector('.hud-top-left');
    this.timer=0;this.pendingInfo=null;this.state={profile:'stage-transition-v1',active:false,count:0,lastFrom:null,lastTo:null,lastText:'',nextStage:null};
    this._listener=e=>this._handle(e?.detail||{});window.addEventListener('neon-racer-feedback',this._listener);
  }

  _transitionFor(text=''){
    const value=String(text);
    if(/^Time Attack 完成/i.test(value))return{from:'TIME ATTACK',to:'DRIFT RUN',next:'drift'};
    if(/^Drift Run 完成/i.test(value))return{from:'DRIFT RUN',to:'SPEED TRAP',next:'speed'};
    return null;
  }

  _clear(){
    clearTimeout(this.timer);this.timer=0;this.toast?.classList.remove('stage-transition');this.objectivePanel?.classList.remove('stage-transition');
    if(this.toast){delete this.toast.dataset.phase;delete this.toast.dataset.nextStage}
    this.pendingInfo=null;this.state.active=false;
  }

  _renderCurrent(restart=false){
    if(!this.toast||!this.state.lastText)return;
    this.toast.textContent=this.state.lastText;this.toast.dataset.feedback='milestone';this.toast.dataset.phase='transition';this.toast.dataset.nextStage=this.state.nextStage||'';
    if(restart){this.toast.classList.remove('stage-transition');void this.toast.offsetWidth}
    this.toast.classList.add('stage-transition');this.objectivePanel?.classList.add('stage-transition');
  }

  _start(transition){
    this._clear();
    const display=`${transition.from} ✓ → ${transition.to}`;
    this.state={...this.state,active:true,count:this.state.count+1,lastFrom:transition.from,lastTo:transition.to,lastText:display,nextStage:transition.next};
    this._renderCurrent(true);
    this.timer=setTimeout(()=>{
      const pending=this.pendingInfo;this._clear();
      if(pending?.text)this.hud?.toast(pending.text);
    },760);
  }

  _handle(detail={}){
    const transition=detail.kind==='milestone'?this._transitionFor(detail.text):null;
    if(transition){this._start(transition);return}
    if(this.state.active&&detail.kind==='info'){
      this.pendingInfo={kind:'info',text:String(detail.text||'')};this._renderCurrent(false);return;
    }
    this._clear();
  }

  snapshot(){return{...this.state,pendingInfo:Boolean(this.pendingInfo)}}
}
