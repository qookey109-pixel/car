import './styles.css';
import './replay.css';
import {Game} from './core/Game.js';

const app=document.getElementById('app');
const game=new Game(app);
window.__NEON_RACER__={
  version:'0.8.0',
  game,
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
    recovery:{flipTimer:game.flipTimer,cooldown:game.recoveryCooldown},
    quality:{requested:game.quality.requested,effective:game.quality.effective},
    city:game.city.stats,
    renderer:{calls:game.renderer.info.render.calls,triangles:game.renderer.info.render.triangles}
  })
};
