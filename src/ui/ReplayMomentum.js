const $=id=>document.getElementById(id);

const RANK_TARGETS={C:{rank:'B',score:4501},B:{rank:'A',score:6501},A:{rank:'S',score:9001}};

export class ReplayMomentum{
  constructor(game){
    this.game=game;this.profile='replay-momentum-v1';this.renderCount=0;this.last=null;
    this.el={root:$('replayMomentum'),tour:$('replayTour'),pips:$('replayPips'),target:$('replayTarget'),playAgain:$('playAgain'),record:$('finalRecord'),score:$('finalScore'),combo:$('finalCombo'),rank:$('finalRank')};
    this._onFeedback=e=>{if(e?.detail?.kind!=='milestone')return;queueMicrotask(()=>{if(this.game.state==='complete')this.render()})};
    addEventListener('neon-racer-feedback',this._onFeedback);
  }

  _number(text='0'){const value=Number(String(text).replace(/[^0-9.-]/g,''));return Number.isFinite(value)?value:0}
  _formatTime(time=0){const m=Math.floor(time/60),s=Math.floor(time%60);return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  _target({cleared,total,nextCleared,nextName,rank,score,combo,records,newBest}){
    if(cleared<total&&!nextCleared)return`NEXT TARGET · NEW ROUTE · ${nextName}`;
    const rankTarget=RANK_TARGETS[rank];
    if(rankTarget)return`NEXT TARGET · ${rankTarget.rank} RANK · ${rankTarget.score.toLocaleString()}+ pts`;
    if(newBest)return'PB HUNT · NEW BEST SET · DEFEND S';
    const scoreGap=Math.max(0,Number(records.bestScore||0)-score);
    if(scoreGap>0)return`PB HUNT · SCORE +${Math.ceil(scoreGap).toLocaleString()} TO PB`;
    const comboGap=Math.max(0,Number(records.bestCombo||1)-combo);
    if(comboGap>.04)return`PB HUNT · COMBO +${comboGap.toFixed(1)} TO PB`;
    return`PB HUNT · BEAT ${this._formatTime(records.bestTime||0)} · KEEP S`;
  }

  render(){
    const routes=Array.isArray(this.game.challenges?.routes)?this.game.challenges.routes:[];
    if(!this.el.root||!routes.length)return null;
    const total=routes.length,current=((Number(this.game.challenges.routeIndex)||0)%total+total)%total,nextIndex=(current+1)%total,next=routes[nextIndex];
    const records=this.game.records||{},routeCounts=records.routes||{};
    const states=routes.map((route,index)=>({name:route.name,index,cleared:Number(routeCounts[route.name]||0)>0,next:index===nextIndex}));
    const cleared=states.filter(route=>route.cleared).length,nextCleared=Boolean(states[nextIndex]?.cleared);
    const rank=String(this.el.rank?.textContent||'C').trim().toUpperCase(),score=this._number(this.el.score?.textContent),combo=this._number(this.el.combo?.textContent);
    const newBest=Boolean(this.el.record?.classList.contains('new-best'));
    const target=this._target({cleared,total,nextCleared,nextName:next.name,rank,score,combo,records,newBest});

    this.el.tour.textContent=`CITY TOUR · ${cleared}/${total} ROUTES CLEARED`;
    this.el.target.textContent=target;
    this.el.playAgain.textContent=`挑戰 ${next.name} →`;
    const dots=states.map(route=>{const dot=document.createElement('i');dot.classList.toggle('cleared',route.cleared);dot.classList.toggle('next',route.next);dot.title=`${route.name} · ${route.cleared?'CLEARED':'UNCLEARED'}${route.next?' · NEXT':''}`;return dot});
    this.el.pips.replaceChildren(...dots);
    this.el.root.dataset.profile=this.profile;this.el.root.dataset.cleared=String(cleared);this.el.root.dataset.total=String(total);this.el.root.dataset.nextRoute=next.name;this.el.root.dataset.nextCleared=String(nextCleared);this.el.root.dataset.target=target;
    this.renderCount++;
    this.last={profile:this.profile,cleared,total,currentRoute:routes[current].name,nextRoute:next.name,nextRouteCleared:nextCleared,target,rank,renderCount:this.renderCount,routes:states.map(route=>({...route}))};
    return this.last;
  }

  snapshot(){return this.last?{...this.last,routes:this.last.routes.map(route=>({...route}))}:{profile:this.profile,cleared:0,total:this.game.challenges?.routes?.length||0,currentRoute:this.game.challenges?.routeName||null,nextRoute:null,nextRouteCleared:false,target:null,rank:null,renderCount:this.renderCount,routes:[]}}
}
