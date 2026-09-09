// Shared spatial authority for district visuals, HUD and route metadata.
export const DISTRICTS=Object.freeze({
  core:Object.freeze({label:'CORE DISTRICT',name:'核心商業區'}),
  avenue:Object.freeze({label:'AVENUE',name:'主要幹道'}),
  edge:Object.freeze({label:'OUTER EDGE',name:'外圍街區'})
});

export function districtFor(x,z){
  const ax=Math.abs(x),az=Math.abs(z);
  if(ax<=72&&az<=72)return 'core';
  if(ax<=32||az<=32)return 'avenue';
  return 'edge';
}

// HUD-only 4m hysteresis. Static metadata always uses the exact boundaries above.
export function observedDistrict(x,z,previous){
  const ax=Math.abs(x),az=Math.abs(z),next=districtFor(x,z);
  if(!previous||next===previous)return next;
  if(previous==='core'&&ax<=76&&az<=76)return previous;
  if(next==='core'&&(ax>68||az>68))return previous;
  if(previous==='avenue'&&next==='edge'&&(ax<=36||az<=36))return previous;
  if(previous==='edge'&&next==='avenue'&&ax>28&&az>28)return previous;
  return next;
}
