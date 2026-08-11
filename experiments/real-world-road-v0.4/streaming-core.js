const DEFAULT_ENDPOINTS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const DRIVABLE=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','unclassified','residential','living_street','service','road']);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class RoadChunkStreamer {
  constructor({chunkMeters=900,radius=1,maxResident=12,ttlMs=5*60_000,endpoints=DEFAULT_ENDPOINTS,onChunk=null}={}){
    this.chunkMeters=chunkMeters;
    this.radius=radius;
    this.maxResident=maxResident;
    this.ttlMs=ttlMs;
    this.endpoints=endpoints;
    this.onChunk=onChunk;
    this.origin=null;
    this.chunks=new Map();
    this.generation=0;
  }

  setOrigin(lat,lon){
    this.origin={lat,lon,cos:Math.cos(lat*Math.PI/180)};
  }

  llToMeters(lat,lon){
    if(!this.origin) this.setOrigin(lat,lon);
    return {
      x:(lon-this.origin.lon)*111320*this.origin.cos,
      z:-(lat-this.origin.lat)*111320
    };
  }

  metersToLL(x,z){
    if(!this.origin) throw new Error('origin required');
    return {
      lat:this.origin.lat-z/111320,
      lon:this.origin.lon+x/(111320*this.origin.cos)
    };
  }

  key(ix,iz){ return `${ix},${iz}`; }

  chunkForMeters(x,z){
    return {ix:Math.floor(x/this.chunkMeters),iz:Math.floor(z/this.chunkMeters)};
  }

  chunkBounds(ix,iz){
    const pad=this.chunkMeters*.08;
    const minX=ix*this.chunkMeters-pad,maxX=(ix+1)*this.chunkMeters+pad;
    const minZ=iz*this.chunkMeters-pad,maxZ=(iz+1)*this.chunkMeters+pad;
    const nw=this.metersToLL(minX,minZ),se=this.metersToLL(maxX,maxZ);
    return {
      south:Math.min(nw.lat,se.lat),west:Math.min(nw.lon,se.lon),
      north:Math.max(nw.lat,se.lat),east:Math.max(nw.lon,se.lon)
    };
  }

  desiredKeys(x,z){
    const c=this.chunkForMeters(x,z),out=[];
    for(let dx=-this.radius;dx<=this.radius;dx++) for(let dz=-this.radius;dz<=this.radius;dz++){
      out.push({ix:c.ix+dx,iz:c.iz+dz,key:this.key(c.ix+dx,c.iz+dz),priority:Math.abs(dx)+Math.abs(dz)});
    }
    return out.sort((a,b)=>a.priority-b.priority);
  }

  async update(lat,lon){
    if(!this.origin) this.setOrigin(lat,lon);
    const p=this.llToMeters(lat,lon),wanted=this.desiredKeys(p.x,p.z),gen=++this.generation;
    const wantedSet=new Set(wanted.map(v=>v.key));
    for(const item of wanted) this.ensureChunk(item.ix,item.iz,gen).catch(()=>{});
    for(const [key,chunk] of this.chunks){
      if(!wantedSet.has(key)&&chunk.state==='loading') chunk.controller?.abort();
    }
    this.evict(wantedSet);
    return this.snapshot();
  }

  async ensureChunk(ix,iz,generation=this.generation){
    const key=this.key(ix,iz),now=Date.now(),existing=this.chunks.get(key);
    if(existing?.state==='ready'&&now-existing.loadedAt<this.ttlMs){existing.lastUsed=now;return existing;}
    if(existing?.state==='loading') return existing.promise;

    const chunk={key,ix,iz,state:'loading',loadedAt:0,lastUsed:now,segments:[],ways:0,error:null,controller:new AbortController(),generation};
    this.chunks.set(key,chunk);
    chunk.promise=this.loadChunk(chunk).then(data=>{
      if(chunk.controller.signal.aborted) throw new DOMException('Aborted','AbortError');
      chunk.state='ready';chunk.loadedAt=Date.now();chunk.lastUsed=Date.now();chunk.segments=data.segments;chunk.ways=data.ways;chunk.meta=data.meta;
      this.onChunk?.(chunk);return chunk;
    }).catch(err=>{
      if(err?.name==='AbortError'){this.chunks.delete(key);throw err;}
      chunk.state='error';chunk.error=String(err?.message||err);chunk.lastUsed=Date.now();this.onChunk?.(chunk);throw err;
    });
    return chunk.promise;
  }

  async loadChunk(chunk){
    const b=this.chunkBounds(chunk.ix,chunk.iz);
    const query=`[out:json][timeout:25];way[highway](${b.south},${b.west},${b.north},${b.east});(._;>;);out body;`;
    let lastError=null;
    for(const endpoint of this.endpoints){
      try{
        const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(query),signal:chunk.controller.signal});
        if(!res.ok) throw new Error(`${endpoint} HTTP ${res.status}`);
        return this.parseOSM(await res.json());
      }catch(err){
        if(err?.name==='AbortError') throw err;
        lastError=err;
      }
    }
    throw lastError||new Error('Overpass unavailable');
  }

  parseOSM(osm){
    const nodes=new Map();
    for(const e of osm.elements||[]) if(e.type==='node') nodes.set(e.id,e);
    const segments=[];let ways=0;
    for(const way of osm.elements||[]){
      if(way.type!=='way'||!this.isDrivable(way)) continue;
      const tags=way.tags||{},lanes=this.inferredLanes(tags),width=this.highwayWidth(tags);
      let added=false;
      for(let i=1;i<way.nodes.length;i++){
        const a=nodes.get(way.nodes[i-1]),b=nodes.get(way.nodes[i]);if(!a||!b)continue;
        const pa=this.llToMeters(a.lat,a.lon),pb=this.llToMeters(b.lat,b.lon);
        if(Math.hypot(pb.x-pa.x,pb.z-pa.z)<.2)continue;
        segments.push({
          wayId:way.id,ax:pa.x,az:pa.z,bx:pb.x,bz:pb.z,width,lanes,
          highway:tags.highway,
          bridge:tags.bridge&&tags.bridge!=='no',
          tunnel:tags.tunnel&&tags.tunnel!=='no',
          layer:clamp(Number.parseInt(tags.layer||'0',10)||0,-5,5),
          name:tags.name||'',
          surface:tags.surface||''
        });
        added=true;
      }
      if(added)ways++;
    }
    return {segments,ways,meta:{elementCount:(osm.elements||[]).length}};
  }

  isDrivable(way){
    const t=way.tags||{};
    if(!DRIVABLE.has(t.highway))return false;
    if(t.motor_vehicle==='no'||t.motorcar==='no'||t.access==='no'||t.access==='private')return false;
    return Array.isArray(way.nodes)&&way.nodes.length>=2;
  }

  inferredLanes(tags={}){
    const n=Number.parseInt(String(tags.lanes||''),10);
    if(Number.isFinite(n)&&n>0)return clamp(n,1,8);
    if(['motorway','trunk'].includes(tags.highway))return 4;
    if(['primary','secondary'].includes(tags.highway))return 2;
    return 2;
  }

  highwayWidth(tags={}){
    const lanes=this.inferredLanes(tags),type=tags.highway||'';
    const laneWidth=['motorway','trunk','primary'].includes(type)?3.45:3.15;
    const minimum=({motorway:11,trunk:10,primary:8,secondary:7,tertiary:6,residential:5.7,service:4.2,living_street:4.5}[type]||5.2);
    return Math.max(minimum,lanes*laneWidth);
  }

  evict(wantedSet=new Set()){
    const ready=[...this.chunks.values()].filter(c=>c.state!=='loading'&&!wantedSet.has(c.key)).sort((a,b)=>a.lastUsed-b.lastUsed);
    while(this.chunks.size>this.maxResident&&ready.length){this.chunks.delete(ready.shift().key);}
    const now=Date.now();
    for(const [key,c] of this.chunks){if(c.state==='error'&&now-c.lastUsed>30_000&&!wantedSet.has(key))this.chunks.delete(key);}
  }

  snapshot(){
    const list=[...this.chunks.values()];
    return {
      total:list.length,
      loading:list.filter(c=>c.state==='loading').length,
      ready:list.filter(c=>c.state==='ready').length,
      error:list.filter(c=>c.state==='error').length,
      segments:list.reduce((n,c)=>n+(c.segments?.length||0),0),
      chunks:list.map(c=>({key:c.key,state:c.state,ways:c.ways||0,segments:c.segments?.length||0,error:c.error}))
    };
  }
}
