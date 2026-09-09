import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');
  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,a=g.cityAtmosphere;
    g._render();
    const signalBefore=Array.from(a.redLights.instanceMatrix.array.slice(0,16));
    a.setSignalPhase(1);
    const signalAfter=Array.from(a.redLights.instanceMatrix.array.slice(0,16));
    const phase1={phase:a.signalPhase,red:a.redLights.count,green:a.greenLights.count,statsPhase:g.city.stats.trafficSignalPhase,matrixChanged:signalBefore.some((v,i)=>Math.abs(v-signalAfter[i])>1e-6)};
    a.setSignalPhase(0);

    const windows=a.facadeLights?.windows;
    a.setFacadeLightCycle(0,true);
    const facadeBefore=windows?.instanceColor?Array.from(windows.instanceColor.array):[];
    a.setFacadeLightCycle(1,true);
    const facadeAfter=windows?.instanceColor?Array.from(windows.instanceColor.array):[];
    const facade={
      groups:a.facadeLightGroups,
      cycle:a.facadeLightCycle,
      statsCycle:g.city.stats.facadeLightCycle,
      interval:a.facadeLightIntervalMs,
      windows:a.facadeLights?.windows?.count||0,
      signs:a.facadeLights?.signs?.count||0,
      shops:a.facadeLights?.shops?.count||0,
      colorsChanged:facadeBefore.length===facadeAfter.length&&facadeBefore.some((v,i)=>Math.abs(v-facadeAfter[i])>1e-6)
    };
    a.setFacadeLightCycle(0,true);
    g._render();
    return{
      stats:{...g.city.stats},
      physicsStaticBodies:g.city.staticBodies.length,
      groups:{
        poles:a?.poles?.count||0,
        heads:a?.heads?.count||0,
        red:a?.redLights?.count||0,
        green:a?.greenLights?.count||0,
        renderGroups:a?.renderGroups||0
      },
      phase1,
      facade,
      night:{
        ...a.nightDepth,
        fogDensity:g.scene.fog?.density||0,
        fogColor:g.scene.fog?.color?.getHex?.()||0,
        background:g.scene.background?.getHex?.()||0,
        hemi:g.city.hemi?.intensity||0,
        ambient:g.city.ambient?.intensity||0,
        sun:g.city.sun?.intensity||0,
        rim:g.city.rim?.intensity||0,
        fill:g.city.fill?.intensity||0
      },
      road:{...a.roadReadability,layers:{...a.roadReadability?.layers}},
      streetEdge:{
        profile:a.streetEdgeProfile,
        renderGroups:a.streetEdgeRenderGroups,
        isInstancedMesh:Boolean(a.streetEdgeDetails?.isInstancedMesh),
        count:a.streetEdgeDetails?.count||0,
        ...(a.streetEdgeCounts||{})
      },
      renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles}
    };
  });
  if(result.stats.trafficSignals!==100)throw new Error(`Expected 100 traffic signals: ${JSON.stringify(result)}`);
  if(result.stats.atmosphereRenderGroups!==4||result.groups.renderGroups!==4)throw new Error(`Traffic signals must stay in four instanced render groups: ${JSON.stringify(result)}`);
  if(result.groups.poles!==100||result.groups.heads!==100||result.groups.red+result.groups.green!==100)throw new Error(`Traffic signal instance counts invalid: ${JSON.stringify(result.groups)}`);
  if(result.phase1.phase!==1||result.phase1.statsPhase!==1||result.phase1.red+result.phase1.green!==100||!result.phase1.matrixChanged)throw new Error(`Traffic signal phase did not switch in-place: ${JSON.stringify(result.phase1)}`);
  if(result.facade.groups!==3||result.stats.facadeLightGroups!==3)throw new Error(`Expected three existing facade light groups: ${JSON.stringify(result.facade)}`);
  if(result.facade.windows!==result.stats.windows||result.facade.signs!==result.stats.signs||result.facade.shops!==result.stats.shopfronts)throw new Error(`Facade mesh discovery mismatch: ${JSON.stringify(result.facade)}`);
  if(result.facade.cycle!==1||result.facade.statsCycle!==1||result.facade.interval!==1800||!result.facade.colorsChanged)throw new Error(`Facade light rhythm did not update instance colors in-place: ${JSON.stringify(result.facade)}`);
  if(result.night.profile!=='cool-amber-v1'||result.stats.nightDepthProfile!=='cool-amber-v1')throw new Error(`Night depth profile missing: ${JSON.stringify(result.night)}`);
  if(Math.abs(result.night.fogDensity-.00245)>1e-7||result.night.fogColor!==0x10283b||result.night.background!==0x06111e)throw new Error(`Night fog/sky palette drifted: ${JSON.stringify(result.night)}`);
  if(result.night.streetGlowGroups<1||result.night.skyLayers<3||result.stats.nightStreetGlowGroups<1||result.stats.nightSkyLayers<3)throw new Error(`Existing night layers were not discovered in-place: ${JSON.stringify(result.night)}`);
  if(Math.abs(result.night.hemi-2.15)>.001||Math.abs(result.night.ambient-.52)>.001||Math.abs(result.night.sun-1.78)>.001||Math.abs(result.night.rim-1.04)>.001||Math.abs(result.night.fill-.42)>.001)throw new Error(`Night light balance drifted: ${JSON.stringify(result.night)}`);
  if(result.road.profile!=='road-rush-v1'||result.stats.roadReadabilityProfile!=='road-rush-v1')throw new Error(`Road readability profile missing: ${JSON.stringify(result.road)}`);
  if(result.road.groups!==6||result.stats.roadReadabilityGroups!==6||Object.values(result.road.layers).some(n=>n!==1))throw new Error(`Road readability must reuse exactly the six existing road layers: ${JSON.stringify(result.road)}`);
  if(Math.abs(result.road.edgeOpacity-.86)>.001||Math.abs(result.road.crossOpacity-.82)>.001||result.road.dashColor!==0xf4f6e9||result.road.edgeColor!==0xb8dce2)throw new Error(`Road marking hierarchy drifted: ${JSON.stringify(result.road)}`);
  if(result.streetEdge.profile!=='near-street-v2'||result.stats.streetEdgeProfile!=='near-street-v2')throw new Error(`Near-street v2 profile missing: ${JSON.stringify(result.streetEdge)}`);
  if(result.streetEdge.renderGroups!==1||result.stats.streetEdgeRenderGroups!==1||!result.streetEdge.isInstancedMesh)throw new Error(`Near-street details must stay in one InstancedMesh render group: ${JSON.stringify(result.streetEdge)}`);
  if(result.streetEdge.count!==result.streetEdge.total||result.streetEdge.count!==result.stats.streetEdgeInstances)throw new Error(`Near-street instance accounting drifted: ${JSON.stringify(result.streetEdge)}`);
  if(result.streetEdge.awnings<result.stats.buildings*2||result.streetEdge.bladeSigns<Math.floor(result.stats.buildings/2)||result.streetEdge.curbProps<60)throw new Error(`Near-street base density too low: ${JSON.stringify(result.streetEdge)}`);
  if(result.streetEdge.shopMullions<result.stats.buildings*2||result.streetEdge.entryFrames<Math.floor(result.stats.buildings/2)*3)throw new Error(`Storefront bay rhythm too low: ${JSON.stringify(result.streetEdge)}`);
  if(result.stats.streetEdgeShopMullions!==result.streetEdge.shopMullions||result.stats.streetEdgeEntryFrames!==result.streetEdge.entryFrames)throw new Error(`Storefront v2 stats drifted: ${JSON.stringify(result.streetEdge)}`);
  if(result.physicsStaticBodies!==result.stats.buildings+4)throw new Error(`Visual near-street detail must not add physics colliders: ${JSON.stringify({physicsStaticBodies:result.physicsStaticBodies,buildings:result.stats.buildings})}`);
  if(result.renderer.calls>60||result.renderer.triangles>110000)throw new Error(`City atmosphere exceeded LOW render budget: ${JSON.stringify(result.renderer)}`);
  await page.screenshot({path:'test-results/city-atmosphere-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`City atmosphere PASS · ${result.stats.trafficSignals} signals · night ${result.night.profile} · road ${result.road.profile} · street ${result.streetEdge.profile} (${result.streetEdge.count}; mullions ${result.streetEdge.shopMullions}; entries ${result.streetEdge.entryFrames}) · ${result.renderer.calls} calls · ${result.renderer.triangles} tris`);
}finally{
  await browser.close();
}
