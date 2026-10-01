import './styles.css';
import './replay.css';
import './objective-compass.css';
import './district.css';
import './checkpoint-feedback.css';
import {Game} from './core/Game.js';
import {ObjectiveCompass} from './ui/ObjectiveCompass.js';
import {StageTransition} from './ui/StageTransition.js';
import {ReplayMomentum} from './ui/ReplayMomentum.js';
import {CityAtmosphere} from './world/CityAtmosphere.js';

const app=document.getElementById('app');
const game=new Game(app);
game.audio.attachVehicle(game.vehicle);
const stageTransition=new StageTransition(game.hud);
game.stageTransition=stageTransition;
const replayMomentum=new ReplayMomentum(game);
game.replayMomentum=replayMomentum;
const atmosphere=new CityAtmosphere(game.city);
game.cityAtmosphere=atmosphere;
const compass=new ObjectiveCompass(game);
window.__NEON_RACER__={
  version:'0.8.0',
  game,
  compass,
  snapshot:()=>({
    version:'0.8.0',
    state:game.state,
    speedKmh:game.vehicle.speedKmh,
    position:{x:game.vehicle.position.x,y:game.vehicle.position.y,z:game.vehicle.position.z},
    nitro:game.vehicle.nitro,
    drifting:game.vehicle.isDrifting,
    challengeIndex:game.challenges.challengeIndex,
    challengeId:game.challenges.current?.id||null,
    routeIndex:game.challenges.routeIndex,
    routeName:game.challenges.routeName,
    score:Math.round(game.challenges.score),
    completed:game.challenges.completed,
    records:{...game.records},
    replay:replayMomentum.snapshot(),
    recovery:{flipTimer:game.flipTimer,cooldown:game.recoveryCooldown},
    navigation:compass.snapshot(),
    stageTransition:stageTransition.snapshot(),
    district:{profile:'district-awareness-v3',current:game.hud.district,target:game.challenges.targetDistrict,objective:{key:game.hud.navigationTargetKey,distance:game.hud.navigationDistance,trend:game.hud.navigationTrend},route:{...game.challenges.routeDistricts,checkpoints:[...game.challenges.routeDistricts.checkpoints]}},
    audio:game.audio.snapshot(),
    quality:{requested:game.quality.requested,effective:game.quality.effective},
    city:game.city.stats,
    renderer:{calls:game.renderer.info.render.calls,triangles:game.renderer.info.render.triangles}
  })
};
