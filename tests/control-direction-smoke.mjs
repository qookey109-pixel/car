import {chromium} from '@playwright/test';
import fs from 'node:fs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
fs.mkdirSync('test-results/control-direction',{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__NEON_RACER__?.snapshot?.().version==='0.8.0');
  await page.click('#startGame');
  await page.waitForFunction(()=>window.__NEON_RACER__.snapshot().state==='running');

  const result=await page.evaluate(()=>{
    const g=window.__NEON_RACER__.game,v=g.vehicle,input=g.input;
    g.state='paused';
    const masks=g.city.staticBodies.map(b=>b.collisionFilterMask);
    g.city.staticBodies.forEach(b=>{b.collisionFilterMask=0});

    const sampleKey=key=>{
      input.keys.clear();
      input.keys.add(key);
      const value=input.sample().steer;
      input.keys.clear();
      return value;
    };
    const sampleTouch=key=>{
      input.touch.left=false;input.touch.right=false;
      input.touch[key]=true;
      const value=input.sample().steer;
      input.touch[key]=false;
      return value;
    };
    const mapping={
      keyA:sampleKey('KeyA'),keyD:sampleKey('KeyD'),
      arrowLeft:sampleKey('ArrowLeft'),arrowRight:sampleKey('ArrowRight'),
      touchLeft:sampleTouch('left'),touchRight:sampleTouch('right')
    };

    const step=n=>{for(let i=0;i<n;i++){v.setInput(input.sample());v.update(g.fixedDt);g.physics.step(g.fixedDt)}};
    const steerRun=key=>{
      v.reset({x:0,y:1.2,z:80},0);
      input.keys.clear();input.keys.add('KeyW');input.keys.add(key);
      step(240);
      input.keys.clear();v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
      return{x:v.position.x,z:v.position.z,speedKmh:v.speedKmh};
    };
    const left=steerRun('KeyA');
    const right=steerRun('KeyD');

    v.reset({x:0,y:1.2,z:24},0);
    input.keys.clear();input.keys.add('KeyS');
    let peakReverse=0,minRaw=Infinity,maxRaw=-Infinity;
    for(let i=0;i<360;i++){
      v.setInput(input.sample());v.update(g.fixedDt);g.physics.step(g.fixedDt);
      peakReverse=Math.max(peakReverse,v.speedKmh);
      const raw=v.vehicle.currentVehicleSpeedKmHour||0;
      minRaw=Math.min(minRaw,raw);maxRaw=Math.max(maxRaw,raw);
    }
    input.keys.clear();v.setInput({throttle:0,steer:0,handbrake:false,nitro:false});
    const reverse={peakKmh:peakReverse,rawKmh:v.vehicle.currentVehicleSpeedKmHour||0,minRaw,maxRaw,z:v.position.z,reverseForce:v.reverseForce,reverseLimit:v.reverseLimit};

    g.city.staticBodies.forEach((b,i)=>{b.collisionFilterMask=masks[i]});
    return{mapping,left,right,reverse};
  });

  fs.writeFileSync('test-results/control-direction/contract.json',JSON.stringify(result,null,2));

  const m=result.mapping;
  if(!(m.keyA===1&&m.arrowLeft===1&&m.touchLeft===1&&m.keyD===-1&&m.arrowRight===-1&&m.touchRight===-1))throw new Error(`Logical steering mapping failed: ${JSON.stringify(m)}`);
  if(!(result.left.x<-10&&result.right.x>10))throw new Error(`Physical A/D steering direction failed: ${JSON.stringify({left:result.left,right:result.right})}`);
  if(!(result.reverse.peakKmh>25&&result.reverse.peakKmh<48&&result.reverse.z>40&&result.reverse.minRaw>=-1))throw new Error(`Reverse envelope failed: ${JSON.stringify(result.reverse)}`);
  if(errors.length)throw new Error(errors.join('\n'));

  console.log(`Control PASS · A left ${result.left.x.toFixed(1)}m · D right ${result.right.x.toFixed(1)}m · reverse peak ${result.reverse.peakKmh.toFixed(1)} km/h`);
}finally{await browser.close()}
