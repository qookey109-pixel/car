const ROUTE_COPY={
  '河岸東環':{
    kicker:'RIVER EAST LOOP',
    title:'河岸東環',
    style:'高速長彎',
    line:'沿河壓住速度，把整座夜色甩在身後。',
    accent:'FLOW'
  },
  '霓虹西環':{
    kicker:'NEON WEST LOOP',
    title:'霓虹西環',
    style:'密集轉向',
    line:'在最窄的街廓裡，切出最乾淨的節奏。',
    accent:'PRECISION'
  },
  '高架折返':{
    kicker:'VIADUCT RETURN',
    title:'高架折返',
    style:'煞車節奏',
    line:'晚一點煞車，早一點回正，在高架前封關。',
    accent:'RHYTHM'
  }
};

const FINISH_COPY={
  S:{label:'NIGHT MASTERED',line:'你不是穿過城市，是把它變成了自己的節奏。'},
  A:{label:'CITY FLOW',line:'速度、節奏與路線開始連成一條線。'},
  B:{label:'NIGHT RUN COMPLETE',line:'你已經找到這座城市的基本呼吸。'},
  C:{label:'ROUTE CLEARED',line:'路線完成；下一趟會更快、更乾淨。'}
};

export class AwardPresentation{
  constructor(game){
    this.game=game;
    this.profile='award-presentation-v1';
    this.introCount=0;this.finishCount=0;this.lastRoute=null;this.lastRank=null;this.lastPB=false;
    this.root=document.createElement('div');
    this.root.className='award-presentation';
    this.root.innerHTML=`
      <section class="award-route-card" aria-live="polite">
        <div class="award-route-kicker"></div>
        <div class="award-route-title"></div>
        <div class="award-route-style"></div>
        <div class="award-route-line"></div>
        <div class="award-route-accent"></div>
      </section>
      <section class="award-finish-card" aria-live="polite">
        <div class="award-finish-kicker">SANLU NIGHT RUN</div>
        <div class="award-finish-title"></div>
        <div class="award-finish-route"></div>
        <div class="award-finish-line"></div>
        <div class="award-finish-pb"></div>
      </section>
    `;
    document.body.appendChild(this.root);
    this.routeCard=this.root.querySelector('.award-route-card');
    this.finishCard=this.root.querySelector('.award-finish-card');
    this.routeTimer=0;this.finishTimer=0;
  }

  _restart(el,className){
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  routeIntro({name,style,focus}={}){
    clearTimeout(this.routeTimer);
    const copy=ROUTE_COPY[name]||{
      kicker:'SANLU NIGHT RUN',
      title:name||'CITY LOOP',
      style:style||focus||'CITY FLOW',
      line:'把路線跑乾淨，讓城市記住你的節奏。',
      accent:focus||'FLOW'
    };
    this.root.querySelector('.award-route-kicker').textContent=copy.kicker;
    this.root.querySelector('.award-route-title').textContent=copy.title;
    this.root.querySelector('.award-route-style').textContent=copy.style;
    this.root.querySelector('.award-route-line').textContent=copy.line;
    this.root.querySelector('.award-route-accent').textContent=copy.accent;
    this.introCount++;this.lastRoute=name||null;
    this.finishCard.classList.remove('show');
    this._restart(this.routeCard,'show');
    this.routeTimer=setTimeout(()=>this.routeCard.classList.remove('show'),2850);
  }

  finish(summary={},routeResult={}){
    clearTimeout(this.finishTimer);
    const rank=String(summary.rank||'C').toUpperCase();
    const copy=FINISH_COPY[rank]||FINISH_COPY.C;
    const fresh=Boolean(routeResult?.first||routeResult?.newScore||routeResult?.newTime||routeResult?.newCombo);
    this.root.querySelector('.award-finish-title').textContent=copy.label;
    this.root.querySelector('.award-finish-route').textContent=`${summary.routeName||'CITY LOOP'} · RANK ${rank}`;
    this.root.querySelector('.award-finish-line').textContent=copy.line;
    this.root.querySelector('.award-finish-pb').textContent=fresh?'PERSONAL BEST · NEW NIGHT RECORD':'RUN COMPLETE · CHASE THE GHOST';
    this.root.querySelector('.award-finish-pb').dataset.fresh=fresh?'true':'false';
    this.finishCount++;this.lastRank=rank;this.lastPB=fresh;
    this.routeCard.classList.remove('show');
    this._restart(this.finishCard,'show');
    this.finishTimer=setTimeout(()=>this.finishCard.classList.remove('show'),2150);
  }

  hide(){
    clearTimeout(this.routeTimer);clearTimeout(this.finishTimer);
    this.routeCard.classList.remove('show');this.finishCard.classList.remove('show');
  }

  snapshot(){
    return{
      profile:this.profile,
      introCount:this.introCount,
      finishCount:this.finishCount,
      lastRoute:this.lastRoute,
      lastRank:this.lastRank,
      lastPB:this.lastPB,
      routeVisible:this.routeCard.classList.contains('show'),
      finishVisible:this.finishCard.classList.contains('show'),
      renderGroups:0
    };
  }
}
