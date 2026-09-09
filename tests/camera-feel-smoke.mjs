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
  await page.waitForFunction(()=>window.__NEON_RACER__?.game?.vehicle);
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');

  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle;
    g.state='paused';g.motionEffects=true;v.reset({x:0,y:1.2,z:24},0);
    g.cameraYaw=0;g.cameraPitch=.13;g.cameraImpulse=0;

    const sample=(speed,steer,frames=120)=>{
      v.vehicle.currentVehicleSpeedKmHour=speed;
      g.cameraSteer=steer;g.cameraRoll=0;g._lookTarget=null;g._lastSafeCamera=null;
      for(let i=0;i<frames;i++)g._camera(1/60);
      const car={x:v.position.x,y:v.position.y,z:v.position.z};
      return{
        fov:g.camera.fov,
        height:g.camera.position.y-car.y,
        leadX:g._lookTarget.x-car.x,
        leadZ:g._lookTarget.z-car.z,
        roll:g.cameraRoll,
        camera:g.camera.position.toArray()
      };
    };

    const low=sample(40,0);
    const high=sample(165,0);
    const right=sample(165,1);
    const left=sample(165,-1);

    g.motionEffects=false;g.cameraSteer=1;g.cameraRoll=.02;g._lookTarget=null;g._lastSafeCamera=null;
    v.vehicle.currentVehicleSpeedKmHour=165;
    for(let i=0;i<140;i++)g._camera(1/60);
    const noMotion={leadX:g._lookTarget.x-v.position.x,roll:g.cameraRoll,fov:g.camera.fov};

    g.motionEffects=true;g.cameraSteer=1;g.cameraRoll=0;g._lookTarget=null;g._lastSafeCamera=null;
    for(let i=0;i<120;i++)g._camera(1/60);
    g.hud.update(v,g.challenges);g.effects.update(1/60,v,g.camera);g._render();
    const visual={fov:g.camera.fov,leadX:g._lookTarget.x-v.position.x,roll:g.cameraRoll,renderer:{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles}};
    return{low,high,right,left,noMotion,visual};
  });

  if(!(result.high.fov>result.low.fov+3&&result.high.fov<72.5))throw new Error(`High-speed FOV response invalid: ${JSON.stringify(result)}`);
  if(!(result.high.height>3.8&&result.high.height<5.05))throw new Error(`High-speed chase camera height invalid: ${JSON.stringify(result.high)}`);
  if(!(result.right.leadX>.8&&result.left.leadX<-.8))throw new Error(`Corner look-ahead must anticipate both directions: ${JSON.stringify({right:result.right,left:result.left})}`);
  if(!(result.right.roll<-.008&&result.left.roll>.008&&Math.abs(result.right.roll+result.left.roll)<.004))throw new Error(`Camera roll must be subtle and symmetric: ${JSON.stringify({right:result.right.roll,left:result.left.roll})}`);
  if(!(Math.abs(result.noMotion.leadX)<.05&&Math.abs(result.noMotion.roll)<.001))throw new Error(`Motion-off must disable camera lead/roll: ${JSON.stringify(result.noMotion)}`);
  if(result.visual.renderer.calls>60||result.visual.renderer.triangles>110000)throw new Error(`Camera feel exceeded LOW render budget: ${JSON.stringify(result.visual.renderer)}`);
  await page.screenshot({path:'test-results/camera-feel-844x390.png',animations:'disabled'});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Camera Feel PASS · FOV ${result.low.fov.toFixed(2)}→${result.high.fov.toFixed(2)} · lead ±${Math.abs(result.right.leadX).toFixed(2)}m · roll ±${(Math.abs(result.right.roll)*180/Math.PI).toFixed(2)}° · motion-off neutral`);
}finally{
  await browser.close();
}
