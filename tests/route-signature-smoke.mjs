import {testBrowser} from './browser-engine.mjs';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/route-signature',{recursive:true});

const browser=await testBrowser.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{try{localStorage.removeItem('neon-racer-records')}catch{}});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().state==='running');

  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,a=g.cityAtmosphere,p=g.awardPresentation;
    g.state='paused';
    const bodiesBefore=g.physics.bodies.length;
    const occludersBefore=g.city.cameraOccluders.length;
    const initial={...window.__NEON_RACER__.snapshot().routeSignature};
    const routes=[
      {name:'河岸東環',style:'高速長彎',focus:'HIGH SPEED'},
      {name:'霓虹西環',style:'密集轉向',focus:'TECHNICAL'},
      {name:'高架折返',style:'煞車節奏',focus:'BRAKE FLOW'}
    ];
    const out=[];
    for(const route of routes){
      const sig=a.setRouteSignature(route.name);
      p.routeIntro(route);
      g.renderer.info.reset();g._render();
      const style=getComputedStyle(document.documentElement);
      out.push({
        route:route.name,
        signature:{...sig},
        dataset:document.documentElement.dataset.routeSignature,
        cssAccent:style.getPropertyValue('--route-accent').trim(),
        background:g.scene.background?.getHex?.()||0,
        fog:g.scene.fog?.color?.getHex?.()||0,
        fogDensity:g.scene.fog?.density||0,
        hemi:g.city.hemi?.color?.getHex?.()||0,
        sun:g.city.sun?.color?.getHex?.()||0,
        rim:g.city.rim?.color?.getHex?.()||0,
        edge:a.roadMaterials?.edge?.color?.getHex?.()||0,
        dash:a.roadMaterials?.dash?.color?.getHex?.()||0,
        windows:a.facadeLights?.windows?.material?.color?.getHex?.()||0,
        signs:a.facadeLights?.signs?.material?.color?.getHex?.()||0,
        shops:a.facadeLights?.shops?.material?.color?.getHex?.()||0,
        routeStyleColor:getComputedStyle(p.root.querySelector('.award-route-style')).color,
        calls:g.renderer.info.render.calls,
        triangles:g.renderer.info.render.triangles
      });
    }
    return{
      initial,
      routes:out,
      physics:{before:bodiesBefore,after:g.physics.bodies.length},
      occluders:{before:occludersBefore,after:g.city.cameraOccluders.length},
      profile:g.city.stats.routeSignatureProfile,
      key:g.city.stats.routeSignatureKey
    };
  });

  if(result.initial?.profile!=='route-signature-v1'||result.initial?.key!=='river')throw new Error(`Initial route signature missing: ${JSON.stringify(result.initial)}`);
  if(result.routes.length!==3)throw new Error('Expected three route signatures');
  const keys=result.routes.map(r=>r.signature.key);
  if(new Set(keys).size!==3)throw new Error(`Route keys not distinct: ${JSON.stringify(keys)}`);
  const backgrounds=result.routes.map(r=>r.background);
  const fogs=result.routes.map(r=>r.fog);
  const signs=result.routes.map(r=>r.signs);
  if(new Set(backgrounds).size!==3||new Set(fogs).size!==3||new Set(signs).size!==3)throw new Error(`Route palettes not distinct: ${JSON.stringify({backgrounds,fogs,signs})}`);
  for(const r of result.routes){
    if(r.signature.profile!=='route-signature-v1'||r.signature.renderGroups!==0)throw new Error(`Route signature profile failed: ${JSON.stringify(r)}`);
    if(r.dataset!==r.signature.key||r.cssAccent!==r.signature.accent)throw new Error(`DOM route accent mismatch: ${JSON.stringify(r)}`);
    if(r.calls>60||r.triangles>110000)throw new Error(`Route signature exceeded render budget: ${JSON.stringify(r)}`);
  }
  if(new Set(result.routes.map(r=>r.calls)).size!==1)throw new Error(`Route signature changed draw calls: ${JSON.stringify(result.routes.map(r=>({route:r.route,calls:r.calls})))}`);
  if(result.physics.after!==result.physics.before)throw new Error(`Route signature changed physics bodies: ${JSON.stringify(result.physics)}`);
  if(result.occluders.after!==result.occluders.before)throw new Error(`Route signature changed camera occluders: ${JSON.stringify(result.occluders)}`);
  if(result.profile!=='route-signature-v1'||result.key!=='viaduct')throw new Error(`Route signature stats drifted: ${JSON.stringify({profile:result.profile,key:result.key})}`);

  for(const [index,route] of ['river','neon','viaduct'].entries()){
    await page.evaluate(i=>{
      const g=window.__NEON_RACER__.game;
      const names=['河岸東環','霓虹西環','高架折返'];
      const styles=['高速長彎','密集轉向','煞車節奏'];
      const focuses=['HIGH SPEED','TECHNICAL','BRAKE FLOW'];
      g.cityAtmosphere.setRouteSignature(names[i]);
      g.awardPresentation.routeIntro({name:names[i],style:styles[i],focus:focuses[i]});
      g._render();
    },index);
    await page.waitForTimeout(120);
    await page.screenshot({path:`test-results/route-signature/${index+1}-${route}.png`,animations:'disabled'});
  }

  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Route Signature PASS · river/neon/viaduct distinct · 0 physics/occluder delta · stable ${result.routes[0].calls} calls / ${Math.round(result.routes[0].triangles)} tris`);
}finally{await browser.close()}
