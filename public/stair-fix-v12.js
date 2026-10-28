/* VetroStudio V12: stair geometry and viewport toolbar repair. Works after V2-V11. */
(()=>{'use strict';
const STYLE=`
body.v10active #vs7bar,body.v10active .vs7toolbar,body.v10active .vs9toolbar,body.v10active #vs7toolbar{display:none!important}
body.v10active .v10floatbottom{right:16px!important;bottom:16px!important;left:auto!important;width:auto!important;max-width:calc(100% - 40px);padding:5px!important;background:#ffffffee!important;box-shadow:0 7px 22px #19363a28!important;border:1px solid #d8e2e3!important;border-radius:12px!important;gap:4px!important;flex-direction:row!important;align-items:center!important}
body.v10active .v10floatbottom button{padding:9px 12px!important;border:0!important;border-radius:8px!important;min-height:0!important;min-width:0!important;height:auto!important;font-size:12px!important;white-space:nowrap!important}
body.v10active .v10floatbottom button.active{background:#176a70!important;color:white!important}
body.v10active .v10floats{z-index:6!important}
body.v10active .viewer{isolation:isolate}
body.v10active .viewer .vs9toolbar,body.v10active .viewer .vs7toolbar{display:none!important}
`;
const style=document.createElement('style');style.textContent=STYLE;document.head.append(style);
const mm=v=>Math.max(1,Number(v)||1);
const safe=o=>o&&typeof o==='object';
function make(c,keep=[]){
 if(c.type!=='scala')return originalBuild(c,keep);
 const objects=[],group='VS12-'+(crypto.randomUUID?.()||Date.now()).toString().slice(0,12);
 const add=(kind,name,x,y,z,w,h,d,extra={})=>{const v=obj(kind,name,x,y,z,Math.max(1,w),Math.max(1,h),Math.max(1,d),{...extra,v4Group:group,v4Generated:true,vs12:true});objects.push(v);return v};
 const steps=Math.max(4,Math.min(60,Math.round(mm(c.steps)))),rise=mm(c.rise),tread=mm(c.tread),width=mm(c.stairWidth),height=mm(c.height),thickness=mm(c.glassThickness),gap=Math.min(80,Math.max(0,Number(c.gap)||0));
 const isL=c.fix==='l-borchie',isU=c.fix==='u-profilo',turn=isL||isU;
 const n1=turn?Math.ceil(steps/2):steps,n2=turn?steps-n1:0;
 const sides=c.side==='sinistra'?[-1]:c.side==='entrambi'?[-1,1]:[1];
 const landLength=turn?width+280:520;
 const totalHeight=steps*rise;
 const finish=c.material||'pietra';
 function ramp(name,n,start,baseX,baseZ,dirX,dirZ,guardSides,railStartOverride){
   const run=(n-1)*tread;
   for(let i=0;i<n;i++){
     const x=baseX+dirX*i*tread,z=baseZ+dirZ*i*tread,y=(start+i+1)*rise;
     // Steps and supporting mass are distinct editable objects.
     const alongX=Math.abs(dirX)>0;
     add('stair',`${name} · pedata ${i+1}`,x,y-26,z,alongX?tread-6:width,52,alongX?width:tread-6,{finish});
     if(c.fix!=='aperta'&&c.fix!=='sospesa')add('wall',`${name} · struttura ${i+1}`,x,((start+i+1)*rise-55)/2,z,alongX?tread-8:width,Math.max(30,(start+i+1)*rise-55),alongX?width:tread-8,{finish:'cemento'});
   }
   const railStart=railStartOverride??(start+1)*rise;
   const panelCount=c.panelMode==='manual'?Math.max(1,Math.round(mm(c.panels)/(turn?2:1))):Math.max(1,Math.ceil(run/Math.max(300,mm(c.maxPanel))));
   const pitch=run/panelCount;
   for(const side of guardSides){
     const offset=width/2+thickness/2+38;
     const normalX=dirZ*side,normalZ=-dirX*side;
     const horizontal=Math.abs(dirX)>0;
     for(let j=0;j<panelCount;j++){
       const startPos=j*pitch+gap/2,endPos=(j+1)*pitch-gap/2,L=Math.max(80,endPos-startPos),first=railStart+startPos/tread*rise,last=railStart+endPos/tread*rise;
       const px=baseX+dirX*(startPos+L/2)+normalX*offset,pz=baseZ+dirZ*(startPos+L/2)+normalZ*offset;
       const low=Math.min(first,last),high=Math.max(first,last);
       // Four vertices: bottom and top follow staircase slope; no bloated boxes.
       const shape=[[0,first-low],[L,last-low],[L,last-low+height],[0,first-low+height]];
       const pane=add('glass',`${name} · vetro ${side<0?'sinistro':'destro'} ${j+1}`,px,low+(high-low+height)/2+30,pz,L,high-low+height,thickness,{shape,shapePreset:'free',v4PanelIndex:j,vs12Ramp:name,ry:horizontal?0:(dirZ<0?-90:90)});
       // Fixings placed within the panel and close to its lower edge. No floating extras.
       if(c.fix==='borchie'||c.fix==='l-borchie'||c.fix==='sopra'||c.fix==='u-profilo')for(const fraction of [.22,.78]){
         const distance=startPos+L*fraction,yy=railStart+distance/tread*rise+145;
         add('accessory',`Borchia · ${name} ${j+1}`,baseX+dirX*distance+normalX*(offset+24),yy,baseZ+dirZ*distance+normalZ*(offset+24),48,48,28,{accessoryType:'borchia',attachTo:pane.id});
       }
       if(c.fix==='morsetti')for(const fraction of [.2,.8]){
         const distance=startPos+L*fraction,yy=railStart+distance/tread*rise+58;
         add('accessory',`Morsetto · ${name}`,baseX+dirX*distance+normalX*(offset+20),yy,baseZ+dirZ*distance+normalZ*(offset+20),70,76,35,{accessoryType:'morsetto',attachTo:pane.id});
       }
     }
     if(c.fix==='montanti')for(let j=0;j<=panelCount;j++){
       const at=j*run/panelCount;
       add('profile',`Montante · ${name}`,baseX+dirX*at+normalX*offset,railStart+at/tread*rise+height/2,baseZ+dirZ*at+normalZ*offset,38,height,38,{finish:'metal'});
     }
     if(c.handrail!=='none'){
       const mid=run/2,angle=Math.atan2((n-1)*rise,Math.max(1,run))*180/Math.PI;
       add('profile',`Corrimano ${name}`,baseX+dirX*mid+normalX*offset,railStart+mid/tread*rise+height+34,baseZ+dirZ*mid+normalZ*offset,Math.hypot(run,(n-1)*rise)+70,32,35,{rz:horizontal?angle:0,rx:horizontal?0:(dirZ<0?-angle:angle),finish:'metal',v4Link:c.handrail==='linked'});
     }
   }
   return {run,endX:baseX+dirX*run,endZ:baseZ+dirZ*run,endHeight:(start+n)*rise};
 }
 // Top landing aligned to last tread; guard runs must include landing's exposed edge.
 const initialX=-(n1-1)*tread/2;
 const r1=ramp('Rampa 1',n1,0,initialX,0,1,0,sides);
 const landingCenterX=r1.endX+landLength/2;
 const landingWidth=width+80;
 const landingAt=(n1)*rise;
 add('floor',turn?'Pianerottolo intermedio':'Pianerottolo arrivo',landingCenterX,landingAt-60,0,landLength,120,landingWidth,{finish});
 // Create landing protection on the exposed side of the landing (the previously missing glass).
 function landingPanel(label,x,z,L,orientation){
   const panel=add('glass',label,x,landingAt+height/2+25,z,L,height,thickness,{shape:[[0,0],[L,0],[L,height],[0,height]],shapePreset:'rect',ry:orientation});
   for(const q of [.22,.78]){
     const xx=orientation?x:x+(q-.5)*L,zz=orientation?z+(q-.5)*L:z;
     add('accessory',`Fissaggio ${label}`,xx,landingAt+155,zz+28,48,48,28,{accessoryType:'borchia',attachTo:panel.id});
   }
 }
 for(const side of sides)landingPanel('Vetro pianerottolo · lato '+(side>0?'destro':'sinistro'),landingCenterX,side*(width/2+42),landLength-gap,0);
 if(turn){
   // L: second run goes in -Z; U: second run returns in -X offset in -Z.
   if(isL){
     const secondStartX=r1.endX+landLength-tread/2;
     const secondStartZ=-tread/2;
     ramp('Rampa 2',n2,n1,secondStartX,secondStartZ,0,-1,[1]);
     landingPanel('Vetro pianerottolo · testata',r1.endX+landLength-40,0,width-gap,90);
   }else{
     const secondStartX=r1.endX+landLength-tread/2;
     const secondStartZ=-(width+280);
     ramp('Rampa 2',n2,n1,secondStartX,secondStartZ,-1,0,[1]);
     landingPanel('Vetro pianerottolo · lato esterno',landingCenterX,-(width+280)/2,landLength-gap,0);
   }
 }
 return {group,objects:[...objects,...keep],count:objects.filter(o=>o.kind==='glass').length,run:r1.run+(turn?(n2-1)*tread:0)+landLength,top:totalHeight};
}
let originalBuild=window.v4Build;
if(typeof originalBuild==='function')window.v4Build=make;
function fixUi(){if(!document.body.classList.contains('v10active'))return;
 const view=document.querySelector('.v2layout .viewer');if(!view)return;
 // Renderer add-ons from previous versions must never obscure the viewport.
 for(const el of document.querySelectorAll('#vs7bar,.vs7toolbar,.vs9toolbar,#vs7toolbar'))el.style.setProperty('display','none','important');
 const bar=view.querySelector('.v10floatbottom');if(bar){bar.style.width='auto';bar.style.left='auto';bar.style.right='16px';
 if(!bar.querySelector('#vs12studio')){
  const tech=document.createElement('button');tech.id='vs12studio';tech.textContent='✦ Realistico';tech.onclick=()=>window.vs7Mode?.('studio');
  const detail=document.createElement('button');detail.textContent='▦ Tecnico';detail.onclick=()=>window.vs7Mode?.('technical');
  const quality=document.createElement('button');quality.textContent='Qualità';quality.onclick=()=>window.vs7Quality?.(window.VS7?.quality==='high'?'standard':'high');
  bar.prepend(tech,detail,quality);
 }
 }

}
new MutationObserver(()=>fixUi()).observe(document.body,{subtree:true,childList:true});
window.addEventListener('resize',fixUi);setTimeout(fixUi,250);
 // Accurate camera framing excludes the oversized helper grid.
 function focusActual(){if(!window.V?.v2||!window.S?.current)return;let model=window.ensureV2?.();if(!model?.objects?.length)return;
  const world=new THREE.Box3();for(const o of model.objects){if(!['stair','glass','floor','wall','profile','accessory','balcony'].includes(o.kind))continue;
   const half=new THREE.Vector3(Math.abs(o.w||0)/2,Math.abs(o.h||0)/2,Math.abs(o.d||0)/2),point=new THREE.Vector3(o.x||0,o.y||0,o.z||0);
   const b=new THREE.Box3(point.clone().sub(half),point.clone().add(half));world.union(b);
  }
  if(world.isEmpty())return;const center=world.getCenter(new THREE.Vector3()),size=world.getSize(new THREE.Vector3());
  const camera=V.camera,fov=camera.fov*Math.PI/180,dist=Math.max(950,Math.max(size.x,size.z)*1.3,size.y*1.4)/(2*Math.tan(fov/2));
  V.dist=Math.min(50000,dist*1.3);V.position=()=>{camera.position.set(center.x+V.dist*Math.sin(V.az)*Math.cos(V.el),center.y+V.dist*Math.sin(V.el),center.z+V.dist*Math.cos(V.az)*Math.cos(V.el));camera.lookAt(center)};V.position();
 }
 document.addEventListener('click',e=>{if(e.target?.closest?.('#v10frame')){e.stopImmediatePropagation();setTimeout(focusActual,0)}},true);
 const oldCreate=window.v4Create;if(typeof oldCreate==='function')window.v4Create=function(...a){const result=oldCreate.apply(this,a);setTimeout(focusActual,80);return result};
 const oldCommit=window.v4Commit;if(typeof oldCommit==='function')window.v4Commit=function(...a){const result=oldCommit.apply(this,a);setTimeout(focusActual,80);return result};

})();
