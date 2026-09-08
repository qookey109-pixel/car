import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results',{recursive:true});

const browser=await chromium.launch({
  headless:true,
  args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
});

try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');

  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle;
    g.state='paused';
    g.quality.apply({quality:'low',resolution:1,bloom:false,shadows:false});
    v.reset({x:0,y:1.2,z:150},0);
    const masks=g.city.staticBodies.map(b=>b.collisionFilterMask);
    g.city.staticBodies.forEach(b=>{b.collisionFilterMask=0});
    let peak=0;
    try{
      v.setInput({throttle:1,steer:0,handbrake:false,nitro:false});
      for(let i=0;i<480;i++){
        v.update(g.fixedDt);g.physics.step(g.fixedDt);peak=Math.max(peak,v.speedKmh);
      }
      v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
      v._syncVisuals();
      g._camera(1/60);g.effects.update(1/60,v,g.camera);
      g.renderer.info.reset();g._render();
      const r=g.renderer.info.render;
      const transmissionMaterials=[];
      v.visualRoot.traverse(o=>{
        const mats=Array.isArray(o.material)?o.material:[o.material];
        for(const m of mats)if(m&&Number(m.transmission)>0)transmissionMaterials.push({name:o.name||o.type,transmission:m.transmission});
      });
      return{
        rendererName:g.quality.rendererName,
        softwareRenderer:g.quality.softwareRenderer,
        quality:g.quality.effective,
        peakSpeedKmh:peak,
        speedKmh:v.speedKmh,
        calls:r.calls,
        triangles:r.triangles,
        speedLines:{type:g.effects.speedLines.type,isLineSegments:Boolean(g.effects.speedLines.isLineSegments),visible:g.effects.speedLines.visible},
        wheelBatches:v.wheelInstances?.map(m=>({type:m.type,count:m.count,name:m.name}))||[],
        transmissionMaterials
      };
    }finally{
      g.city.staticBodies.forEach((b,i)=>{b.collisionFilterMask=masks[i]});
    }
  });

  fs.writeFileSync('test-results/render-budget.json',JSON.stringify(result,null,2));
  if(result.peakSpeedKmh<=105)throw new Error(`High-speed render probe did not reach speed-line range: ${JSON.stringify(result)}`);
  if(!result.speedLines.isLineSegments)throw new Error(`Speed lines are not batched: ${JSON.stringify(result.speedLines)}`);
  if(result.wheelBatches.length!==3||result.wheelBatches.some(b=>b.count!==4))throw new Error(`Wheel visuals are not 3x4 instanced batches: ${JSON.stringify(result.wheelBatches)}`);
  if(result.transmissionMaterials.length)throw new Error(`Transmission prepass still active on car: ${JSON.stringify(result.transmissionMaterials)}`);
  if(result.calls>60||result.triangles>110000)throw new Error(`Software LOW render budget exceeded: ${JSON.stringify(result)}`);
  console.log(`Render budget PASS · ${result.calls} calls · ${Math.round(result.triangles)} tris · peak ${result.peakSpeedKmh.toFixed(1)} km/h`);
}finally{
  await browser.close();
}
