import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DRIVABLE=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','unclassified','residential','living_street','service','road']);
const REGION_RADIUS=3000, GRID_SIZE=90;

let capturedScene=null,capturedWorld=null,capturedVehicle=null;
const nativeSceneAdd=THREE.Scene.prototype.add,nativeAddBody=CANNON.World.prototype.addBody,nativeVehicleAdd=CANNON.RaycastVehicle.prototype.addToWorld;
THREE.Scene.prototype.add=function(...objects){if(!capturedScene)capturedScene=this;return nativeSceneAdd.apply(this,objects)};
CANNON.World.prototype.addBody=function(body){if(!capturedWorld)capturedWorld=this;return nativeAddBody.call(this,body)};
CANNON.RaycastVehicle.prototype.addToWorld=function(world){capturedVehicle=this;capturedWorld=world;return nativeVehicleAdd.call(this,world)};
await import('../raycast-vehicle-cannon-v0.1/app-v5.js');
THREE.Scene.prototype.add=nativeSceneAdd;CANNON.World.prototype.addBody=nativeAddBody;CANNON.RaycastVehicle.prototype.addToWorld=nativeVehicleAdd;

const scene=capturedScene,world=capturedWorld,vehicle=capturedVehicle,chassis=vehicle?.chassisBody;
if(!scene||!world||!vehicle||!chassis)throw new Error('SanchongLuzhouV06 failed to capture V5 Raycast runtime');
for(const obj of [...scene.children])if(obj.isMesh){scene.remove(obj);obj.geometry?.dispose?.();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose?.());else obj.material?.dispose?.()}
for(const body of [...world.bodies])if(body.mass===0)world.removeBody(body);

// Taipei morning 08:00 look: warm low sun, blue sky, long soft shadows.
scene.background=new THREE.Color(0xb8d8ef);scene.fog=new THREE.FogExp2(0xc8ddec,0.00055);
scene.children.filter(o=>o.isLight).forEach(o=>scene.remove(o));
scene.add(new THREE.HemisphereLight(0xd9efff,0x78856c,1.7));
const sun=new THREE.DirectionalLight(0xffe1ad,3.5);sun.position.set(-260,180,-120);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-380;sun.shadow.camera.right=380;sun.shadow.camera.top=380;sun.shadow.camera.bottom=-380;scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(7600,7600),new THREE.MeshStandardMaterial({color:0x7f9675,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.055;ground.receiveShadow=true;scene.add(ground);
const physicsGround=new CANNON.Body({mass:0});physicsGround.addShape(new CANNON.Plane());physicsGround.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(physicsGround);

const roadGroup=new THREE.Group();scene.add(roadGroup);
let segments=[],grid=new Map(),mapOrigin={lat:25.0731,lon:121.4810},ready=false,sourceMode='--',surface='road',surfaceInfo=null,lastNow=performance.now();
const el={status:document.getElementById('status'),surface:document.getElementById('surface'),roadDistance:document.getElementById('roadDistance'),source:document.getElementById('source'),loading:document.getElementById('loading'),lat:document.getElementById('lat'),lon:document.getElementById('lon')};

function llToLocal(lat,lon){const latRad=mapOrigin.lat*Math.PI/180;return new THREE.Vector2((lon-mapOrigin.lon)*111320*Math.cos(latRad),-(lat-mapOrigin.lat)*111320)}
function inferredLanes(tags={}){const n=parseInt(tags.lanes,10);if(Number.isFinite(n)&&n>0)return clamp(n,1,8);if(['motorway','trunk'].includes(tags.highway))return 4;if(['primary','secondary'].includes(tags.highway))return 4;if(tags.highway==='tertiary')return 2;return 2}
function roadWidth(tags={}){const type=tags.highway||'',lanes=inferredLanes(tags),laneW=['motorway','trunk','primary','secondary'].includes(type)?3.35:3.05;const min=({motorway:12,trunk:11,primary:10.5,secondary:9,tertiary:7,residential:5.8,service:4.2,living_street:4.8}[type]||5.4);return Math.max(min,lanes*laneW)}
function key(ix,iz){return `${ix},${iz}`}
function indexSeg(s){const m=s.width*.5+5,minX=Math.floor((Math.min(s.ax,s.bx)-m)/GRID_SIZE),maxX=Math.floor((Math.max(s.ax,s.bx)+m)/GRID_SIZE),minZ=Math.floor((Math.min(s.az,s.bz)-m)/GRID_SIZE),maxZ=Math.floor((Math.max(s.az,s.bz)+m)/GRID_SIZE);for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const k=key(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s)}}
function addSegment(ax,az,bx,bz,width,tags){const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);if(len<1)return;const s={ax,az,bx,bz,width,tags,len,angle:Math.atan2(dx,dz),lanes:inferredLanes(tags)};segments.push(s);indexSeg(s)}
function nearestOnSegment(px,pz,s){const vx=s.bx-s.ax,vz=s.bz-s.az,l2=vx*vx+vz*vz||1,t=clamp(((px-s.ax)*vx+(pz-s.az)*vz)/l2,0,1),x=s.ax+vx*t,z=s.az+vz*t;return{distance:Math.hypot(px-x,pz-z),x,z,t,segment:s}}
function nearestRoad(px,pz){if(!segments.length)return null;const ix=Math.floor(px/GRID_SIZE),iz=Math.floor(pz/GRID_SIZE);let best=null;for(let r=0;r<=4;r++){for(let x=ix-r;x<=ix+r;x++)for(let z=iz-r;z<=iz+r;z++){const list=grid.get(key(x,z));if(!list)continue;for(const s of list){const q=nearestOnSegment(px,pz,s);if(!best||q.distance<best.distance)best=q}}if(best)break}return best}
function clearRoads(){roadGroup.clear();segments=[];grid=new Map()}

function parseOverpass(data){for(const way of data.elements||[]){const t=way.tags||{};if(!DRIVABLE.has(t.highway)||t.motor_vehicle==='no'||t.motorcar==='no'||t.access==='no'||t.access==='private')continue;const g=way.geometry||[],w=roadWidth(t);for(let i=1;i<g.length;i++){const a=llToLocal(g[i-1].lat,g[i-1].lon),b=llToLocal(g[i].lat,g[i].lon);addSegment(a.x,a.y,b.x,b.y,w,t)}}}
function fixtureRoads(){const roads=[{tags:{highway:'primary',lanes:'4'},pts:[[0,120],[0,55],[0,0],[8,-50],[22,-110]]},{tags:{highway:'secondary',lanes:'4'},pts:[[-150,25],[-70,24],[0,22],[70,18],[150,12]]},{tags:{highway:'residential',lanes:'2'},pts:[[-70,100],[-45,65],[-20,35],[0,22],[40,0],[90,-20]]}];for(const r of roads){const w=roadWidth(r.tags);for(let i=1;i<r.pts.length;i++)addSegment(r.pts[i-1][0],r.pts[i-1][1],r.pts[i][0],r.pts[i][1],w,r.tags)}}

function makeInstancedBox(count,mat){return new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,count)}
function place(dummy,mesh,i,x,y,z,angle,w,h,d){dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
function buildMeshes(){
  if(!segments.length)throw new Error('No drivable Sanchong/Luzhou roads');
  const asphalt=new THREE.MeshStandardMaterial({color:0x303438,roughness:.92,metalness:.02});
  const shoulderMat=new THREE.MeshStandardMaterial({color:0x5a5c59,roughness:1});
  const white=new THREE.MeshBasicMaterial({color:0xf4f2e8}),yellow=new THREE.MeshBasicMaterial({color:0xf5c640});
  const road=makeInstancedBox(segments.length,asphalt),leftEdge=makeInstancedBox(segments.length,white),rightEdge=makeInstancedBox(segments.length,white),shoulderL=makeInstancedBox(segments.length,shoulderMat),shoulderR=makeInstancedBox(segments.length,shoulderMat);
  const centerYellow=makeInstancedBox(segments.length*2,yellow);
  const laneInstances=[];let laneCount=0;for(const s of segments)laneCount+=Math.max(0,s.lanes-1);const lanes=makeInstancedBox(Math.max(1,laneCount),white);
  const dummy=new THREE.Object3D();let yi=0,li=0;
  segments.forEach((s,i)=>{const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2,edge=s.width*.5,shoulder=.7;place(dummy,road,i,mx,.015,mz,s.angle,s.width,.055,s.len+.5);place(dummy,shoulderL,i,mx+Math.cos(s.angle)*(-edge-shoulder*.5),.005,mz-Math.sin(s.angle)*(-edge-shoulder*.5),s.angle,shoulder,.025,s.len+.2);place(dummy,shoulderR,i,mx+Math.cos(s.angle)*(edge+shoulder*.5),.005,mz-Math.sin(s.angle)*(edge+shoulder*.5),s.angle,shoulder,.025,s.len+.2);place(dummy,leftEdge,i,mx+Math.cos(s.angle)*(-edge+.18),.052,mz-Math.sin(s.angle)*(-edge+.18),s.angle,.10,.012,s.len*.92);place(dummy,rightEdge,i,mx+Math.cos(s.angle)*(edge-.18),.052,mz-Math.sin(s.angle)*(edge-.18),s.angle,.10,.012,s.len*.92);
    const twoWay=s.tags.oneway!=='yes'&&s.lanes>=2; if(twoWay){for(const off of [-.10,.10])place(dummy,centerYellow,yi++,mx+Math.cos(s.angle)*off,.055,mz-Math.sin(s.angle)*off,s.angle,.055,.014,s.len*.78)}
    if(s.lanes>1){const laneW=s.width/s.lanes;for(let n=1;n<s.lanes;n++){const off=-edge+laneW*n;if(Math.abs(off)<.3&&twoWay)continue;place(dummy,lanes,li++,mx+Math.cos(s.angle)*off,.056,mz-Math.sin(s.angle)*off,s.angle,.075,.014,Math.max(1,s.len*.48))}}
  });
  [road,leftEdge,rightEdge,shoulderL,shoulderR,centerYellow,lanes].forEach(m=>{m.instanceMatrix.needsUpdate=true;m.receiveShadow=true;roadGroup.add(m)});
  // Intersection pads remove visible cracks where many OSM segments meet.
  const nodeMap=new Map();for(const s of segments){for(const p of [[s.ax,s.az],[s.bx,s.bz]]){const k=`${Math.round(p[0])},${Math.round(p[1])}`;const v=nodeMap.get(k)||{x:p[0],z:p[1],count:0,w:0};v.count++;v.w=Math.max(v.w,s.width);nodeMap.set(k,v)}}
  const junctions=[...nodeMap.values()].filter(n=>n.count>=3);for(const j of junctions){const pad=new THREE.Mesh(new THREE.CircleGeometry(j.w*.72,14),asphalt);pad.rotation.x=-Math.PI/2;pad.position.set(j.x,.048,j.z);pad.receiveShadow=true;roadGroup.add(pad)}
}

function segmentDirection(s){const dx=s.bx-s.ax,dz=s.bz-s.az,l=Math.hypot(dx,dz)||1;return{x:dx/l,z:dz/l}}
function spawnOnRoad(){const q=nearestRoad(0,20)||nearestRoad(0,0);if(!q)return;const d=segmentDirection(q.segment),yaw=Math.atan2(-d.x,-d.z);chassis.position.set(q.x,1.25,q.z);chassis.quaternion.setFromEuler(0,yaw,0);chassis.velocity.setZero();chassis.angularVelocity.setZero();vehicle.applyEngineForce(0,2);vehicle.applyEngineForce(0,3);for(let i=0;i<4;i++){vehicle.setBrake(0,i);vehicle.setSteeringValue(0,i)}}
function updateSurface(now){const dt=Math.min((now-lastNow)/1000,.05);lastNow=now;const q=nearestRoad(chassis.position.x,chassis.position.z);surfaceInfo=q;if(!q)surface='offroad';else{const edge=q.distance-q.segment.width*.5;surface=edge<=.35?'road':edge<=3?'shoulder':'offroad'}const drag=surface==='road'?1:surface==='shoulder'?Math.exp(-1*dt):Math.exp(-2.9*dt);chassis.velocity.x*=drag;chassis.velocity.z*=drag;if(surface==='offroad')chassis.angularVelocity.y*=Math.exp(-1.1*dt);el.surface.textContent=surface==='road'?'道路':surface==='shoulder'?'路肩':'離路';el.surface.className=`chip ${surface==='road'?'good':surface==='shoulder'?'warn':'bad'}`;el.roadDistance.textContent=`中心線 ${q?q.distance.toFixed(1):'--'} m`;el.source.textContent=`三蘆 OSM ${sourceMode}`}

async function fetchLive(lat,lon){const q=`[out:json][timeout:30];way(around:${REGION_RADIUS},${lat},${lon})[highway];out geom tags;`,eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr;for(const url of eps){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(q)}`});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return await r.json()}catch(e){lastErr=e}}throw lastErr||new Error('Overpass unavailable')}
async function loadRoads(){const fixture=new URLSearchParams(location.search).get('fixture')==='1';el.loading.classList.add('show');ready=false;clearRoads();try{mapOrigin={lat:Number(el.lat.value)||25.0731,lon:Number(el.lon.value)||121.4810};if(fixture){fixtureRoads();sourceMode='fixture'}else{const data=await fetchLive(mapOrigin.lat,mapOrigin.lon);parseOverpass(data);sourceMode='live'}buildMeshes();spawnOnRoad();ready=true;el.status.textContent=`三重＋蘆洲 Morning World：${segments.length} 個道路 segment。多車道線、雙黃線、白邊線、路肩與路口補面已啟用。`}catch(err){clearRoads();fixtureRoads();buildMeshes();sourceMode='fallback';spawnOnRoad();ready=true;el.status.textContent=`Overpass 載入失敗，已切 deterministic fallback：${err.message}`;console.warn(err)}finally{el.loading.classList.remove('show')}}

document.getElementById('loadRoads').addEventListener('click',loadRoads);addEventListener('keydown',e=>{if(e.code==='KeyR')setTimeout(spawnOnRoad,0)},true);document.querySelector('[data-action="reset"]')?.addEventListener('pointerdown',()=>setTimeout(spawnOnRoad,0),true);
const baseLab=window.__RAYCAST_LAB__,baseSnapshot=baseLab.snapshot.bind(baseLab);baseLab.snapshot=()=>({...baseSnapshot(),worldRegion:'Sanchong-Luzhou',worldMorning:true,worldRoadSource:sourceMode,worldSurface:surface,worldRoadDistance:surfaceInfo?.distance??null,worldRoadSegments:segments.length,worldReady:ready});window.__REAL_WORLD_RAYCAST__={snapshot:()=>baseLab.snapshot(),reload:loadRoads,spawn:spawnOnRoad,teleport:(x,z)=>{chassis.position.set(x,1.25,z);chassis.velocity.setZero();chassis.angularVelocity.setZero()}};
function loop(now){requestAnimationFrame(loop);if(ready)updateSurface(now)}requestAnimationFrame(loop);loadRoads();