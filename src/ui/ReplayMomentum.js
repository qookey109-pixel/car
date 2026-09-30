const $=id=>document.getElementById(id);

const RANK_TARGETS={C:{rank:'B',score:4501},B:{rank:'A',score:6501},A:{rank:'S',score:9001}};

export class ReplayMomentum{
  constructor(game){
    this.game=game;this.profile='replay-momentum-v2';this.renderCount=0;this.last=null;
    this.el={root:$('replayMomentum'),tour:$('replayTour'),pips:$('replayPips'),target:$('replayTarget'),playAgain:$('playAgain'),record:$('finalRecord'),score:$('finalScore'),combo:$('finalCombo'),rank:$('finalRank'),time:$('finalTime')};
    this._onFeedback=e=>{if(e?.detail?.kind!=='milestone')return;queueMicrotask(()=>{if(this.game.state==='complete')this.render()})};
    addEventListener('neon-racer-feedback',this._onFeedback);
  }

  _number(text='0'){const value=Number(String(text).replace(/[^0-9.-]/g,''));return Number.isFinite(value)?value:0}
  _formatTime(time=0){const m=Math.floor(time/60),s=Math.floor(time%60);return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  _target({cleared,total,nextCleared,nextName,currentName,rank,score,combo,time,routeBest,routeResult}){
    if(cleared<total&&!nextCleared)return`NEXT TARGET · NEW ROUTE · ${nextName}`;
    const rankTarget=RANK_TARGETS[rank];
    if(rankTarget)return`NEXT TARGET · ${rankTarget.rank} RANK · ${rankTarget.score.toLocaleString()}+ pts`;
    if(!routeBest)return`ROUTE PB · ${currentName} · SET A BENCHMARK`;
    if(routeResult?.first)return`ROUTE PB · ${currentName} · NEW BENCHMARK`;
    const fresh=[];if(routeResult?.newScore)fresh.push('SCORE');if(routeResult?.newTime)fresh.push('TIME');if(routeResult?.newCombo)fresh.push('COMBO');
    if(fresh.length)return`ROUTE PB · ${currentName} · NEW ${fresh.join('+')}`;
    const scoreGap=Math.max(0,Number(routeBest.bestScore||0)-score);
    if(scoreGap>0)return`ROUTE PB · ${currentName} · SCORE +${Math.ceil(scoreGap).toLocaleString()}`;
    const comboGap=Math.max(0,Number(routeBest.bestCombo||1)-combo);
    if(comboGap>.04)return`ROUTE PB · ${currentName} · COMBO +${comboGap.toFixed(1)}`;
    if(Number(routeBest.bestTime||0)>0&&time>Number(routeBest.bestTime||0)+.05)return`ROUTE PB · ${currentName} · BEAT ${this._formatTime(routeBest.bestTime)}`;
    return`ROUTE PB · ${currentName} · DEFEND S`;
  }

  render(){
    const routes=Array.isArray(this.game.challenges?.routes)?this.game.challenges.routes:[];
    if(!this.el.root||!routes.length)return null;
    const total=routes.length,current=((Number(this.game.challenges.routeIndex)||0)%total+total)%total,nextIndex=(current+1)%total,next=routes[nextIndex];
    const records=this.game.records||{},routeCounts=records.routes||{};
    const states=routes.map((route,index)=>({name:route.name,index,cleared:Number(routeCounts[route.name]||0)>0,next:index===nextIndex}));
    const cleared=states.filter(route=>route.cleared).length,nextCleared=Boolean(states[nextIndex]?.cleared);
    const currentName=routes[current].name,rank=String(this.el.rank?.textContent||'C').trim().toUpperCase(),score=this._number(this.el.score?.textContent),combo=this._number(this.el.combo?.textContent),time=this._number(this.el.time?.textContent?.replace(':','.'));
    const timeParts=String(this.el.time?.textContent||'00:00').split(':').map(Number),elapsed=(Number(timeParts[0])||0)*60+(Number(timeParts[1])||0);
    const routeBest=records.routeBests?.[currentName]||null,routeResult=this.game.lastRouteResult?.routeName===currentName?this.game.lastRouteResult:null;
    const target=this._target({cleared,total,nextCleared,nextName:next.name,currentName,rank,score,combo,time:elapsed,routeBest,routeResult});

    this.el.tour.textContent=`CITY TOUR · ${cleared}/${total} ROUTES CLEARED`;
    this.el.target.textContent=target;
    this.el.playAgain.textContent=`挑戰 ${next.name} →`;
    const dots=states.map(route=>{const dot=document.createElement('i'),best=records.routeBests?.[route.name];dot.classList.toggle('cleared',route.cleared);dot.classList.toggle('next',route.next);dot.title=`${route.name} · ${route.cleared?'CLEARED':'UNCLEARED'}${route.next?' · NEXT':''}${best?` · PB ${Number(best.bestScore||0).toLocaleString()} pts / ${this._formatTime(best.bestTime||0)}`:''}`;return dot});
    this.el.pips.replaceChildren(...dots);
    this.el.root.dataset.profile=this.profile;this.el.root.dataset.cleared=String(cleared);this.el.root.dataset.total=String(total);this.el.root.dataset.nextRoute=next.name;this.el.root.dataset.nextCleared=String(nextCleared);this.el.root.dataset.target=target;
    this.renderCount++;
    this.last={profile:this.profile,cleared,total,currentRoute:currentName,nextRoute:next.name,nextRouteCleared:nextCleared,target,rank,routeBest:routeBest?{...routeBest}:null,routeResult:routeResult?{...routeResult,best:{...routeResult.best}}:null,renderCount:this.renderCount,routes:states.map(route=>({...route,best:records.routeBests?.[route.name]?{...records.routeBests[route.name]}:null}))};
    return this.last;
  }

  snapshot(){return this.last?{...this.last,routes:this.last.routes.map(route=>({...route}))}:{profile:this.profile,cleared:0,total:this.game.challenges?.routes?.length||0,currentRoute:this.game.challenges?.routeName||null,nextRoute:null,nextRouteCleared:false,target:null,rank:null,routeBest:null,routeResult:null,renderCount:this.renderCount,routes:[]}}
}
