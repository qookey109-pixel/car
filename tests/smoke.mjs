import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const required=[
  'index.html','package.json','vite.config.js','src/main.js','src/core/Game.js','src/core/Input.js',
  'src/vehicle/VehicleController.js','src/world/CityWorld.js','src/world/CityAtmosphere.js','src/gameplay/ChallengeSystem.js',
  'src/rendering/QualityManager.js','src/audio/AudioManager.js','src/vfx/Effects.js','src/ui/HUD.js',
  'THIRD_PARTY_ASSETS.md','docs/RESOURCE_HUB_INTEGRATION.md'
];
for(const file of required){if(!fs.existsSync(file))throw new Error(`Missing required file: ${file}`)}

const jsFiles=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);const s=fs.statSync(p);if(s.isDirectory())walk(p);else if(p.endsWith('.js')||p.endsWith('.mjs'))jsFiles.push(p)}}
walk('src');
for(const file of jsFiles){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0)throw new Error(`Syntax check failed: ${file}\n${r.stderr||r.stdout}`)}

const input=fs.readFileSync('src/core/Input.js','utf8');
for(const token of ['cameraX','cameraY','pointerdown','navigator.getGamepads'])if(!input.includes(token))throw new Error(`Input contract missing ${token}`);
const game=fs.readFileSync('src/core/Game.js','utf8');
for(const token of ['Raycaster','EffectComposer','UnrealBloomPass','this.physics.step','this.challenges.update','this.quality.tick'])if(!game.includes(token))throw new Error(`Game loop contract missing ${token}`);
const challenge=fs.readFileSync('src/gameplay/ChallengeSystem.js','utf8');
for(const id of ["id:'sprint'","id:'drift'","id:'speed'"])if(!challenge.includes(id))throw new Error(`Challenge contract missing ${id}`);
if(challenge.includes('dtForMission'))throw new Error('Legacy fixed drift mission timestep must not return');
const atmosphere=fs.readFileSync('src/world/CityAtmosphere.js','utf8');
for(const token of ['InstancedMesh','trafficSignals','CityTrafficSignalRed','CityTrafficSignalGreen'])if(!atmosphere.includes(token))throw new Error(`City atmosphere contract missing ${token}`);

console.log(`V0.8.0 static smoke PASS · ${jsFiles.length} JS modules checked`);
