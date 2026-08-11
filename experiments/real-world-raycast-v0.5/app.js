import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DRIVABLE=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','unclassified','residential','living_street','service','road']);
const RADIUS_METERS=1200,GRID_SIZE=90;

let capturedScene=null,capturedWorld=null,capturedVehicle=null;
const nativeSceneAdd=THREE.Scene.prototype.add;
const nativeAddBody=CANNON.World.prototype.addBody;
const nativeVehicleAddToWorld=CANNON.RaycastVehicle.prototype.addToWorld;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return nativeSceneAdd.apply(this,objects)};
CANNON.World.prototype.addBody=function(body){if(!capturedWorld)capturedWorld=this;return nativeAddBody.call(this,body)};
CANNON.RaycastVehicle.prototype.addToWorld=function(world){capturedVehicle=this;capturedWorld=world;return nativeVehicleAddToWorld.call(this,world)};

await import('../raycast-vehicle-cannon-v0.1/app-v5.js');
THREE.Scene.prototype.add=nativeSceneAdd;
CANNON.World.prototype.addBody=nativeAddBody;
CANNON.RaycastVehicle.prototype.addToWorld=nativeVehicleAddToWorld;

const scene=capturedScene,world=capturedWorld,vehicle=capturedVehicle,chassis=vehicle?.chassisBody;
if(!scene||!world||!vehicle||!chassis)throw new Error('RealWorldRaycastV05 failed to capture V5 Raycast runtime');

// Replace only the V5 lab scenery. Vehicle groups, lights and validated RaycastVehicle remain untouched.
for(const obj of [...scene.children])if(obj.isMesh){scene.remove(obj);obj.geometry?.dispose?.();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose?.());else obj.material?.dispose?.()}
for(const body of [...world.bodies])if(body.mass===0)world.removeBody(body);

scene.background=new THREE.Color(0x9db7ca);scene.fog=new THREE.Fog(0x9db7ca,420,1600);
const baseGroundMat=new THREE.MeshLambertMaterial({color:0x789167});
const baseGround=new THREE.Mesh(new THREE.PlaneGeometry(3200,3200),baseGroundMat);baseGround.rotation.x=-Math.PI/2;baseGround.position.y=-.045;baseGround.receiveShadow=true;scene.add(baseGround);
const physicsGround=new CANNON.Body({mass:0});physicsGround.addShape(new CANNON.Plane());physicsGround.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(physicsGround);

const roadGroup=new THREE.Group();scene.add(roadGroup);
let roadMesh=null,markMesh=null,segments=[],grid=new Map(),mapOrigin={lat:25.033964,lon:121.564468},ready=false,sourceMode='--',surface='road',surfaceInfo=null,lastNow=performance.now();

const el={status:document.getElementById('status'),surface:document.getElementById('surface'),roadDistance:document.getElementById('roadDistance'),source:document.getElementById('source'),loading:document.getElementById('loading'),lat:document.getElementById('lat'),lon:document.getElementById('lon')};

function llToLocal(lat,lon){const latRad=mapOrigin.lat*Math.PI/180;return new THREE.Vector2((lon-mapOrigin.lon)*111320*Math.cos(latRad),-(lat-mapOrigin.lat)*111320)}
function inferredLanes(tags={}){const n=parseInt(tags.lanes,10);if(Number.isFinite(n)&&n>0)return clamp(n,1,8);if(['motorway','trunk'].includes(tags.highway))return 4;if(['primary','secondary'].includes(tags.highway))return 2;return 2}
function roadWidth(tags={}){const type=tags.highway||'',lanes=inferredLanes(tags),laneWidth=['motorway','trunk','primary'].includes(type)?3.45:3.15;const min=({motorway:11,trunk:10,primary:8,secondary:7,tertiary:6,residential:5.7,service:4.2,living_street:4.5}[type]||5.2);return Math.max(min,lanes*laneWidth)}
function gridKey(ix,iz){return `${ix},${iz}`}
function indexSegment(s){const m=s.width*.5+5,minX=Math.floor((Math.min(s.ax,s.bx)-m)/GRID_SIZE),maxX=Math.floor((Math.max(s.ax,s.bx)+m)/GRID_SIZE),minZ=Math.floor((Math.min(s.az,s.bz)-m)/GRID_SIZE),maxZ=Math.floor((Math.max(s.az,s.bz)+m)/GRID_SIZE);for(let ix=minX;ix<=maxX;ix++)for(let iz=minZ;iz<=maxZ;iz++){const k=gridKey(ix,iz);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s)}}
function nearestOnSegment(px,pz,s){const vx=s.bx-s.ax,vz=s.bz-s.az,len2=vx*vx+vz*vz||1,t=clamp(((px-s.ax)*vx+(pz-s.az)*vz)/len2,0,1),x=s.ax+vx*t,z=s.az+vz*t;return{distance:Math.hypot(px-x,pz-z),x,z,t,segment:s}}
function nearestRoad(px,pz){if(!segments.length)return null;const ix=Math.floor(px/GRID_SIZE),iz=Math.floor(pz/GRID_SIZE);let best=null;for(let r=0;r<=3&&!best;r++)for(let x=ix-r;x<=ix+r;x++)for(let z=iz-r;z<=iz+r;z++){const list=grid.get(gridKey(x,z));if(!list)continue;for(const s of list){const q=nearestOnSegment(px,pz,s);if(!best||q.distance<best.distance)best=q}}return best}
function clearRoads(){roadGroup.clear();roadMesh?.geometry.dispose();roadMesh?.material.dispose();markMesh?.geometry.dispose();markMesh?.material.dispose();roadMesh=markMesh=null;segments=[];grid=new Map()}

function addSegment(ax,az,bx,bz,width,tags){const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);if(len<1)return;const s={ax,az,bx,bz,width,tags,len,angle:Math.atan2(dx,dz)};segments.push(s);indexSegment(s)}
function parseOverpass(data){for(const way of data.elements||[]){const t=way.tags||{};if(!DRIVABLE.has(t.highway)||t.motor_vehicle==='no'||t.motorcar==='no'||t.access==='no'||t.access==='private')continue;const g=way.geometry||[];const w=roadWidth(t);for(let i=1;i<g.length;i++){const a=llToLocal(g[i-1].lat,g[i-1].lon),b=llToLocal(g[i].lat,g[i].lon);addSegment(a.x,a.y,b.x,b.y,w,t)}}}
function fixtureRoads(){
  const roads=[
    {tags:{highway:'primary',lanes:'4'},pts:[[0,85],[0,55],[0,30],[4,0],[18,-32],[38,-68],[58,-105]]},
    {tags:{highway:'secondary',lanes:'2'},pts:[[-105,24],[-58,22],[0,20],[56,18],[110,14]]},
    {tags:{highway:'residential',lanes:'2'},pts:[[-48,82],[-34,54],[-18,32],[0,20],[28,5],[55,-15]]}
  ];
  for(const r of roads){const w=roadWidth(r.tags);for(let i=1;i<r.pts.length;i++)addSegment(r.pts[i-1][0],r.pts[i-1][1],r.pts[i][0],r.pts[i][1],w,r.tags)}
}

function buildMeshes(){
  if(!segments.length)throw new Error('No drivable OSM segments');
  const roadGeo=new THREE.BoxGeometry(1,.055,1),roadMat=new THREE.MeshStandardMaterial({color:0x282d31,roughness:.94,metalness:.01});
  roadMesh=new THREE.InstancedMesh(roadGeo,roadMat,segments.length);roadMesh.receiveShadow=true;
  const markGeo=new THREE.BoxGeometry(.12,.018,1),markMat=new THREE.MeshBasicMaterial({color:0xe9e6c9});markMesh=new THREE.InstancedMesh(markGeo,markMat,segments.length);
  const dummy=new THREE.Object3D();
  segments.forEach((s,i)=>{const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2;dummy.position.set(mx,.01,mz);dummy.rotation.set(0,s.angle,0);dummy.scale.set(s.width,1,s.len+.35);dummy.updateMatrix();roadMesh.setMatrixAt(i,dummy.matrix);dummy.position.y=.045;dummy.scale.set(1,1,Math.max(1,s.len*.58));dummy.updateMatrix();markMesh.setMatrixAt(i,dummy.matrix)});
  roadMesh.instanceMatrix.needsUpdate=true;markMesh.instanceMatrix.needsUpdate=true;roadGroup.add(roadMesh,markMesh)
}

function segmentDirection(s){const dx=s.bx-s.ax,dz=s.bz-s.az,l=Math.hypot(dx,dz)||1;return{x:dx/l,z:dz/l}}
function spawnOnRoad(){const q=nearestRoad(0,30)||nearestRoad(0,0);if(!q)return;const d=segmentDirection(q.segment),yaw=Math.atan2(-d.x,-d.z);chassis.position.set(q.x,1.25,q.z);chassis.quaternion.setFromEuler(0,yaw,0);chassis.velocity.setZero();chassis.angularVelocity.setZero();chassis.force.setZero();chassis.torque.setZero();vehicle.applyEngineForce(0,2);vehicle.applyEngineForce(0,3);for(let i=0;i<4;i++){vehicle.setBrake(0,i);vehicle.setSteeringValue(0,i)}}

function updateSurface(now){const dt=Math.min((now-lastNow)/1000,.05);lastNow=now;const q=nearestRoad(chassis.position.x,chassis.position.z);surfaceInfo=q;if(!q){surface='offroad'}else{const edge=q.distance-q.segment.width*.5;if(edge<=.35)surface='road';else if(edge<=3)surface='shoulder';else surface='offroad'}
  // Do not wrap or scale RaycastVehicle engine force. Offroad behavior is additive drag only.
  const drag=surface==='road'?1:surface==='shoulder'?Math.exp(-1.0*dt):Math.exp(-2.9*dt);chassis.velocity.x*=drag;chassis.velocity.z*=drag;if(surface==='offroad')chassis.angularVelocity.y*=Math.exp(-1.1*dt);
  el.surface.textContent=surface==='road'?'道路':surface==='shoulder'?'路肩':'離路';el.surface.className=`chip ${surface==='road'?'good':surface==='shoulder'?'warn':'bad'}`;el.roadDistance.textContent=`中心線 ${q?q.distance.toFixed(1):'--'} m`;el.source.textContent=`OSM ${sourceMode}`;
}

async function fetchLive(lat,lon){const q=`[out:json][timeout:20];way(around:${RADIUS_METERS},${lat},${lon})[highway];out geom tags;`,endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr=null;for(const url of endpoints){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(q)}`});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return await r.json()}catch(e){lastErr=e}}throw lastErr||new Error('Overpass unavailable')}
async function loadRoads(){
  const fixture=new URLSearchParams(location.search).get('fixture')==='1';el.loading.classList.add('show');ready=false;clearRoads();
  try{mapOrigin={lat:Number(el.lat.value)||25.033964,lon:Number(el.lon.value)||121.564468};if(fixture){fixtureRoads();sourceMode='fixture'}else{const data=await fetchLive(mapOrigin.lat,mapOrigin.lon);parseOverpass(data);sourceMode='live'}buildMeshes();spawnOnRoad();ready=true;el.status.textContent=`${sourceMode==='live'?'OpenStreetMap':'Deterministic fixture'}：${segments.length} 個可駕駛道路 segment。Raycast 四輪懸吊已接入。`}
  catch(err){clearRoads();fixtureRoads();buildMeshes();sourceMode='fallback';spawnOnRoad();ready=true;el.status.textContent=`Overpass 載入失敗，已切 deterministic fallback：${err.message}`;console.warn('OSM live load fallback',err)}finally{el.loading.classList.remove('show')}
}

document.getElementById('loadRoads').addEventListener('click',loadRoads);
addEventListener('keydown',e=>{if(e.code==='KeyR')setTimeout(spawnOnRoad,0)},true);
document.querySelector('[data-action="reset"]')?.addEventListener('pointerdown',()=>setTimeout(spawnOnRoad,0),true);

const baseLab=window.__RAYCAST_LAB__,baseSnapshot=baseLab.snapshot.bind(baseLab);
baseLab.snapshot=()=>({...baseSnapshot(),worldRoadSource:sourceMode,worldSurface:surface,worldRoadDistance:surfaceInfo?.distance??null,worldRoadSegments:segments.length,worldReady:ready});
function worldSnapshot(){const s=baseLab.snapshot();return{ready,source:sourceMode,segments:segments.length,surface,distance:s.worldRoadDistance,speedKmh:s.speedKmh,grounded:s.grounded,wheels:s.wheels,driftState:s.driftState,visualVersion:s.visualVersion,position:s.position}}
window.__REAL_WORLD_RAYCAST__={snapshot:worldSnapshot,reload:loadRoads,spawn:spawnOnRoad,teleport:(x,z)=>{chassis.position.set(x,1.25,z);chassis.velocity.setZero();chassis.angularVelocity.setZero()}};

function loop(now){requestAnimationFrame(loop);if(ready)updateSurface(now)}requestAnimationFrame(loop);
loadRoads();
