/* VetroStudio 3D — Motore scale V13. Sostituisce il generatore scale V12.
   Quote in millimetri. Le geometrie sono rappresentazioni progettuali,
   non un dimensionamento strutturale o una distinta per produzione automatica. */
(()=>{
'use strict';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||min));
const zero=(v)=>Number(v)||0;
const clean=(v)=>Math.round(v*100)/100;
const fallback=window.v4Build;
if(typeof fallback!=='function'||typeof obj!=='function')return;
function build(cfg,keep=[]){
 if(cfg.type!=='scala')return fallback(cfg,keep);
 const n=Math.round(clamp(cfg.steps,4,36)),rise=clamp(cfg.rise,100,250),tread=clamp(cfg.tread,190,420);
 const width=clamp(cfg.stairWidth,550,2200),railH=clamp(cfg.height,750,1600),th=clamp(cfg.glassThickness,6,25);
 const gap=clamp(cfg.gap,0,35),maxPanel=clamp(cfg.maxPanel,350,2300),finish=cfg.material||'pietra';
 const isL=cfg.fix==='l-borchie',isU=cfg.fix==='u-profilo';
 const turn=isL||isU;
 const guard=cfg.side==='entrambi'?[-1,1]:cfg.side==='sinistra'?[-1]:[1];
 const group='VS13-'+(globalThis.crypto?.randomUUID?.()||Date.now()).toString().slice(0,10);
 const objects=[];
 const add=(kind,name,x,y,z,w,h,d,other={})=>{
  const o=obj(kind,name,clean(x),clean(y),clean(z),clean(Math.max(1,w)),clean(Math.max(1,h)),clean(Math.max(1,d)),{...other,v4Generated:true,v4Group:group,vs13:true});objects.push(o);return o;
 };
 const v=(x,z)=>({x,z});
 const plus=(p,d,t)=>v(p.x+d.x*t,p.z+d.z*t);
 const sideNormal=(d,s)=>v(-d.z*s,d.x*s);
 const pointSide=(p,d,s,offset)=>plus(p,sideNormal(d,s),offset);
 const thicknessOffset=width/2+th/2+45;
 let glassCount=0;
 // A glass panel is constructed in its own local XY plane, then rotated into XZ route.
 // The panel's lower edge follows the stair pitch exactly, not a rectangular bounding box.
 function panel(label,a,b,y0,y1,s,routeDir,fix,railHeight=railH){
  const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz);
  if(L<120)return;
  const unit=v(dx/L,dz/L),inset=Math.min(gap/2,L*.12);
  const pa=plus(a,unit,inset),pb=plus(b,unit,-inset),length=L-2*inset;
  const dy=y1-y0;
  const ba=y0+dy*(inset/L),bb=y1-dy*(inset/L);
  const low=Math.min(ba,bb),span=railHeight+Math.abs(bb-ba);
  const center=v((pa.x+pb.x)/2,(pa.z+pb.z)/2);
  const ry=Math.atan2(-unit.z,unit.x)*180/Math.PI;
  const shape=[[0,ba-low],[length,bb-low],[length,bb-low+railHeight],[0,ba-low+railHeight]];
  const pane=add('glass',label,center.x,low+span/2,center.z,length,span,th,{ry,shape,shapePreset:'free',vs13Slope:clean(dy/L),vs13Run:label});
  glassCount++;
  const normal=sideNormal(routeDir,s);
  const mount=(fraction,heightAbove,type)=>{
    const u=fraction*length,position=plus(pa,unit,u),baseline=ba+(bb-ba)*fraction;
    return add('accessory',`${type} · ${label}`,position.x+normal.x*18,baseline+heightAbove,position.z+normal.z*18,46,46,27,{accessoryType:type,attachTo:pane.id,ry});
  };
  if(['borchie','l-borchie','u-profilo','sopra','sospesa'].includes(fix)){
    for(const f of [.21,.79]){mount(f,125,'borchia');if(railHeight>900)mount(f,300,'borchia');}
  }else if(fix==='morsetti'){for(const f of [.21,.79])mount(f,58,'morsetto');}
  if(fix==='montanti'){
   for(const f of [0,1]){
    const p=plus(pa,unit,f*length),yy=ba+(bb-ba)*f;
    add('profile',`Montante · ${label}`,p.x,yy+railHeight/2,p.z,38,railHeight,38,{finish:'metal'});
   }
  }
  if(fix==='profilo'||fix==='u-profilo'){
    const slope=Math.atan2(bb-ba,length)*180/Math.PI;
    add('profile',`Profilo · ${label}`,center.x,low+(ba+bb-2*low)/2+23,center.z,Math.hypot(length,bb-ba),46,42,{ry,rz:slope,finish:'metal'});
  }
  if(cfg.handrail!=='none'){
    const angle=Math.atan2(bb-ba,length)*180/Math.PI;
    add('profile',`Corrimano · ${label}`,center.x,low+(ba+bb-2*low)/2+railHeight+20,center.z,Math.hypot(length,bb-ba)+25,32,34,{ry,rz:angle,finish:'metal',v4Link:cfg.handrail==='linked'});
  }
 }
 function guardRoute(name,from,to,yFrom,yTo,dir,fix,sides){
  const L=Math.hypot(to.x-from.x,to.z-from.z);if(L<100)return;
  const d=v((to.x-from.x)/L,(to.z-from.z)/L);
  const count=cfg.panelMode==='manual'?Math.max(1,Math.round(clamp(cfg.panels,1,50)/(turn?2:1))):Math.max(1,Math.ceil(L/maxPanel));
  for(const s of sides){
   const a=pointSide(from,dir,s,thicknessOffset),b=pointSide(to,dir,s,thicknessOffset);
   for(let i=0;i<count;i++){
    const p0=plus(a,d,L*i/count),p1=plus(a,d,L*(i+1)/count);
    panel(`${name} · ${s>0?'destro':'sinistro'} · lastra ${i+1}`,p0,p1,yFrom+(yTo-yFrom)*i/count,yFrom+(yTo-yFrom)*(i+1)/count,s,dir,fix);
   }
  }
 }
 function stepsAlong(name,count,startingIndex,origin,d){
  const run=(count-1)*tread;
  for(let j=0;j<count;j++){
   const p=plus(origin,d,j*tread),elevation=(startingIndex+j+1)*rise;
   const alongX=Math.abs(d.x)>.5;
   add('stair',`${name} · gradino ${j+1}`,p.x,elevation-26,p.z,alongX?tread-5:width,52,alongX?width:tread-5,{finish});
   if(cfg.fix!=='sospesa'&&cfg.fix!=='aperta'){
    add('wall',`${name} · sottostruttura ${j+1}`,p.x,(elevation-55)/2,p.z,alongX?tread-7:width,Math.max(12,elevation-55),alongX?width:tread-7,{finish:'cemento'});
   }
  }
  return {first:origin,last:plus(origin,d,run),run,low:(startingIndex+1)*rise+85,high:(startingIndex+count)*rise+85,finalLevel:(startingIndex+count)*rise,d};
 }
 const firstCount=turn?Math.ceil(n/2):n,secondCount=n-firstCount;
 const d1=v(1,0),origin=v(-(firstCount-1)*tread/2,0);
 const r1=stepsAlong('Rampa 1',firstCount,0,origin,d1);
 guardRoute('Rampa 1',r1.first,r1.last,r1.low,r1.high,d1,cfg.fix,guard);
 const landingLen=turn?width+150:Math.max(350,width*.55);
 let landingX=r1.last.x+landingLen/2,landingZ=0;
 let landingDepth=width;
 if(isU){landingX=r1.last.x;landingZ=-(width+220)/2;landingDepth=width*2+220;}
 add('floor',turn?'Pianerottolo intermedio':'Pianerottolo di arrivo',landingX,r1.finalLevel-65,landingZ,isU?width:landingLen,130,landingDepth,{finish});
 // Landing guard follows actual exposed landing edges; it is NOT a continuation of the inclined panel.
 const landingY=r1.finalLevel+85;
 if(!turn){
  const p0=v(r1.last.x,0),p1=v(r1.last.x+landingLen,0);
  guardRoute('Pianerottolo',p0,p1,landingY,landingY,d1,cfg.fix,guard);
 }else if(isL){
  const p0=v(r1.last.x,0),p1=v(r1.last.x+landingLen,0);
  guardRoute('Pianerottolo',p0,p1,landingY,landingY,d1,cfg.fix,guard);
  // Second ramp turns 90 degrees: the landing top and the ramp share exactly the same elevation.
  const d2=v(0,-1),r2Origin=v(p1.x,-tread/2);
  const r2=stepsAlong('Rampa 2',secondCount,firstCount,r2Origin,d2);
  guardRoute('Rampa 2',r2.first,r2.last,r2.low,r2.high,d2,cfg.fix,[1]);
  // Exposed front of the landing is protected by an independent, vertical panel.
  guardRoute('Pianerottolo testata',v(p1.x,-width/2),v(p1.x,width/2),landingY,landingY,v(0,1),cfg.fix,[1]);
 }else{
  // U configuration: two parallel opposite runs with a full-depth landing bridging them.
  const d2=v(-1,0),r2Origin=v(r1.last.x,-(width+220));
  const r2=stepsAlong('Rampa 2',secondCount,firstCount,r2Origin,d2);
  guardRoute('Rampa 2',r2.first,r2.last,r2.low,r2.high,d2,cfg.fix,[-1]);
  guardRoute('Pianerottolo esterno',v(r1.last.x+width/2,0),v(r1.last.x+width/2,-(width+220)),landingY,landingY,v(0,-1),cfg.fix,[1]);
 }
 return {group,objects:[...objects,...keep],count:glassCount,run:r1.run+(turn?Math.max(0,(secondCount-1)*tread):0)+landingLen,top:n*rise};
}
window.v4Build=build;
// Remove obsolete V12's viewport-fit listener: never replace camera position callbacks.
// Use the native camera controls and fit selected scene through a separate helper.
window.v13Frame=()=>{
 const state=window.ensureV2?.();if(!state?.objects?.length||typeof V==='undefined'||!V?.camera)return;
 const box=new THREE.Box3();
 state.objects.filter(o=>o.v4Generated||o.v4Detached).forEach(o=>{
  const center=new THREE.Vector3(zero(o.x),zero(o.y),zero(o.z));
  const radius=Math.hypot(zero(o.w),zero(o.h),zero(o.d))*.5;
  box.expandByPoint(center.clone().addScalar(radius));box.expandByPoint(center.clone().addScalar(-radius));
 });
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const fov=V.camera.fov*Math.PI/180;
 V.dist=clamp(Math.max(size.x,size.y,size.z)/(2*Math.tan(fov/2))*1.4,800,40000);
 // Existing camera updates orbit the origin. Recenter scene with camera lookAt, without overriding V.position.
 const a=zero(V.az),e=zero(V.el);
 V.camera.position.set(center.x+V.dist*Math.sin(a)*Math.cos(e),center.y+V.dist*Math.sin(e),center.z+V.dist*Math.cos(a)*Math.cos(e));
 V.camera.lookAt(center);V.camera.updateProjectionMatrix();
};
const css=document.createElement('style');css.textContent=`body.v10active .v10floatbottom{display:flex!important;flex-wrap:wrap!important;max-width:min(620px,calc(100% - 24px))!important;width:auto!important;left:auto!important;right:12px!important;bottom:12px!important;padding:5px!important;gap:5px!important;border-radius:12px!important;background:#ffffffee!important;border:1px solid #d7e3e5!important;box-shadow:0 3px 12px #1233!important}body.v10active .v10floatbottom button{padding:8px 11px!important;min-width:0!important;min-height:0!important;white-space:nowrap!important;font-size:12px!important;flex:none!important}`;document.head.appendChild(css);
})();
