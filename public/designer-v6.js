/* VetroStudio 3D - Modelli di produzione configurabili (V6). Compatibile con V2-V5.
   Le geometrie sono modificabili; dimensionamento strutturale non incluso. */
'use strict';

// I modelli aggiuntivi sono registrati in galleria, senza duplicare menu laterali.
const VS6_STAIRS=[
 ['S05','Scala a L con pianerottolo e vetri','scala','l-borchie'],
 ['S06','Scala a U a due rampe con parapetti','scala','u-profilo'],
 ['S07','Scala dritta con gradini aperti e vetro laterale','scala','aperta'],
 ['S08','Scala con vetro sopra gradini e corrimano','scala','sopra']
];
V4.templates.push(...VS6_STAIRS);
const VS6_SHOWER=[
 ['B06','Box angolare: due fissi e porta battente','doccia','angolare-battente',1200,2100,950],
 ['B07','Box angolare: porta scorrevole e ritorno','doccia','angolare-scorrevole',1400,2100,950],
 ['B08','Walk-In: due pannelli e tirante superiore','doccia','walkin-doppio',1700,2100,900],
 ['B09','Box doccia nicchia: doppia anta battente','doccia','nicchia-doppia',1600,2100,900],
 ['B10','Box doccia: parete fissa e anta a libro','doccia','libro',1500,2100,950]
];
V5_MODELS.push(...VS6_SHOWER);

const vs6OldBuild=v5Build;
v5Build=function(c){
 if(c.category!=='doccia')return vs6OldBuild(c);
 const a=[],w=c.width,h=c.height,d=c.depth,t=c.thickness,kind=c.kind;
 const group='DOC-'+(c.code||'CUSTOM');
 function put(type,name,x,y,z,W,H,D,extra={}){
  a.push(obj(type,name,x,y,z,Math.max(1,W),Math.max(1,H),Math.max(1,D),{...extra,v5Generated:true,v5Code:c.code,vs6Group:group}));
 }
 function glass(name,x,y,z,W,H,extra={}){put('glass',name,x,y,z,W,H,t,extra)}
 function metal(name,x,y,z,W,H,D){put('profile',name,x,y,z,W,H,D,{finish:'metal'})}
 function handle(name,x,z){put('accessory',name,x,h*.52,z+34,25,200,32,{accessoryType:'maniglia'})}
 function hinge(name,x,y,z){put('accessory',name,x,y,z+25,58,75,42,{accessoryType:'cerniera'})}
 function wall(name,x,z,W,D){put('wall',name,x,h/2,z,W,h+300,D,{finish:'piastrelle'})}
 const front=d/2;
 put('floor','Piatto doccia',0,-30,0,w+65,60,d+65,{finish:'piastrelle'});
 if(kind==='walkin'||kind==='walkin-doppio'){
  const n=kind==='walkin-doppio'?2:1;
  for(let i=0;i<n;i++){const W=(w-10)/n;glass('Parete fissa Walk-In '+(i+1),-w/2+W*(i+.5),h/2,front,W-8,h)}
  metal('Profilo a parete',-w/2,h/2,front,20,h,30);
  metal('Tirante stabilizzatore',0,h-48,front-d*.40,Math.max(30,w*.06),22,d*.78);
  metal('Profilo supporto superiore',0,h+13,front,w+15,19,24);
 } else if(kind==='angolare'||kind==='angolare-battente'||kind==='angolare-scorrevole'){
  const fixed=w*.46,move=w-fixed;
  glass('Pannello frontale fisso',-w/2+fixed/2,h/2,front,fixed-10,h);
  if(kind==='angolare-scorrevole'){
   glass('Anta scorrevole frontale',w/2-move/2,h/2,front+28,move-12,h,{vs6Movable:true});
   metal('Binario superiore scorrevole',0,h+20,front,w+30,32,48);
   metal('Guida inferiore scorrevole',0,15,front,w,22,38);
  }else{
   glass('Anta battente frontale',w/2-move/2,h/2,front,move-12,h,{vs6Movable:true});
   hinge('Cerniera battente alta',fixed-w/2+15,h*.79,front);
   hinge('Cerniera battente bassa',fixed-w/2+15,h*.22,front);
  }
  handle('Maniglia porta doccia',w/2-move*.2,front+28);
  glass('Ritorno laterale fisso',w/2,h/2,0,d-12,h,{ry:90});
  metal('Profilo montante angolare',w/2,h/2,front,24,h,24);
  metal('Supporto laterale',w/2,h+15,-d*.12,24,24,d*.70);
  wall('Parete bagno posteriore',0,-d/2-75,w+320,110);
  wall('Parete bagno laterale',-w/2-80,0,110,d+180);
 }else if(kind==='nicchia'||kind==='nicchia-doppia'){
  if(kind==='nicchia-doppia'){
   for(let i=0;i<2;i++){
    const W=w/2, x=(i?1:-1)*w/4;
    glass('Anta battente '+(i+1),x,h/2,front,W-11,h,{vs6Movable:true});
    handle('Maniglia anta '+(i+1),i?w*.08:-w*.08,front);
    for(const Y of [h*.25,h*.78])hinge('Cerniera '+(i+1),(i?w/2:-w/2),Y,front);
   }
  }else{
   const fixed=w*.48;glass('Pannello nicchia fisso',-w/2+fixed/2,h/2,front,fixed-10,h);
   glass('Anta nicchia',w/2-(w-fixed)/2,h/2,front,w-fixed-12,h,{vs6Movable:true});
   handle('Maniglia nicchia',w*.32,front);
   metal('Binario nicchia',0,h+18,front,w+12,25,34);
  }
  wall('Parete sinistra nicchia',-w/2-75,0,110,d+180);
  wall('Parete destra nicchia',w/2+75,0,110,d+180);
  wall('Parete posteriore nicchia',0,-d/2-70,w+240,110);
 }else if(kind==='libro'){
  const fixed=w*.36,half=(w-fixed)/2;
  glass('Pannello fisso',-w/2+fixed/2,h/2,front,fixed-10,h);
  glass('Anta libro 1',-w/2+fixed+half/2,h/2,front,half-8,h,{vs6Movable:true});
  glass('Anta libro 2',w/2-half/2,h/2,front,half-8,h,{vs6Movable:true});
  for(const Y of [h*.22,h*.78])hinge('Cerniera libro',w/2-half,Y,front);
  handle('Maniglia a libro',w*.38,front);
  metal('Profilo guida superiore',0,h+20,front,w+12,25,35);
 }else if(kind==='scorrevole'||kind==='battente'){
  const fixed=w*.49,door=w-fixed;
  glass('Pannello fisso frontale',-w/2+fixed/2,h/2,front,fixed-8,h);
  glass(kind==='scorrevole'?'Anta scorrevole':'Anta battente',w/2-door/2,h/2,front+(kind==='scorrevole'?26:0),door-8,h,{vs6Movable:true});
  handle('Maniglia',w*.33,front+26);
  if(kind==='scorrevole')metal('Binario alto',0,h+20,front,w+18,30,42);
  else for(const Y of [h*.22,h*.78])hinge('Cerniera',fixed-w/2,Y,front);
  metal('Profilo a parete',-w/2,h/2,front,20,h,30);
 }else return vs6OldBuild(c);
 return a;
};

// Scale multilivello (a L e a U) modellate come due rampe, con gradini, soletta,
// parapetti in vetro e accessori selezionabili individualmente.
const vs6OldStair=v4Build;
v4Build=function(c,keep=[]){
 if(!['l-borchie','u-profilo','aperta','sopra'].includes(c.fix))return vs6OldStair(c,keep);
 if(c.fix==='aperta'||c.fix==='sopra'){
  const b=vs6OldStair({...c,fix:c.fix==='aperta'?'sospesa':'borchie'},keep);
  if(c.fix==='sopra')b.objects.filter(x=>x.kind==='glass'||x.accessoryType==='borchia').forEach(x=>x.z=c.stairWidth/2-45);
  return b;
 }
 const group='STAIR-'+crypto.randomUUID().slice(0,8),out=[];
 const add=(type,name,x,y,z,w,h,d,meta={})=>out.push(obj(type,name,x,y,z,Math.max(1,w),Math.max(1,h),Math.max(1,d),{...meta,v4Generated:true,v4Group:group}));
 const N=Math.max(4,Math.round(c.steps)),n1=Math.ceil(N/2),n2=N-n1,t=c.tread,r=c.rise,width=c.stairWidth;
 const run1=Math.max(t,(n1-1)*t),run2=Math.max(t,(n2-1)*t),landing=width+220;
 for(let i=0;i<n1;i++){
  const x=-run1/2+i*t,y=(i+1)*r;
  add('stair','Prima rampa - gradino '+(i+1),x,y-23,0,t-7,46,width,{finish:c.material});
  add('wall','Supporto prima rampa '+(i+1),x,Math.max(40,y/2-30),0,t-7,Math.max(40,y-85),width,{finish:'cemento'});
 }
 add('floor','Pianerottolo intermedio',run1/2+landing/2,n1*r-54,0,landing,108,width+130,{finish:c.material});
 const pivotX=run1/2+landing*.65;
 for(let i=0;i<n2;i++){
  const y=(n1+i+1)*r;
  if(c.fix==='l-borchie'){
   const z=-(i+.5)*t;
   add('stair','Seconda rampa - gradino '+(i+1),pivotX,y-23,z,width-7,46,t-7,{finish:c.material});
   add('wall','Supporto seconda rampa '+(i+1),pivotX,n1*r+(i+1)*r/2,z,width-7,Math.max(35,(i+1)*r-85),t-7,{finish:'cemento'});
  }else{
   const x=run1/2-i*t;
   add('stair','Seconda rampa - gradino '+(i+1),x,y-23,-width-190,t-7,46,width-7,{finish:c.material});
   add('wall','Supporto seconda rampa '+(i+1),x,n1*r+(i+1)*r/2-30,-width-190,t-7,Math.max(35,(i+1)*r-85),width-7,{finish:'cemento'});
  }
 }
 const count1=Math.max(1,Math.ceil(run1/c.maxPanel));
 for(let i=0;i<count1;i++){
  const pw=run1/count1,x=-run1/2+(i+.5)*pw,at=(i+.5)*pw*t? (i+.5)*pw*r/t:r;
  const y=r+(i+.5)*(n1-1)*r/count1+c.height/2;
  add('glass','Parapetto rampa 1 '+(i+1),x,y,width/2+18,Math.max(100,pw-c.gap),c.height+45,c.glassThickness,{shape:[[0,0],[pw-c.gap,(n1-1)*r/count1],[pw-c.gap,c.height+45],[0,c.height]],shapePreset:'free'});
  if(c.fix==='l-borchie')for(let j of [.25,.75])add('accessory','Borchia rampa 1',x+(j-.5)*pw,y-c.height*.3,width/2+44,52,52,30,{accessoryType:'borchia'});
 }
 const count2=Math.max(1,Math.ceil(run2/c.maxPanel));
 for(let i=0;i<count2;i++){
  const pw=run2/count2,level=n1*r+(i+.5)*n2*r/count2;
  if(c.fix==='l-borchie'){
   add('glass','Parapetto rampa 2 '+(i+1),pivotX+width/2+22,level+c.height/2,-(i+.5)*pw,Math.max(100,pw-c.gap),c.height+45,c.glassThickness,{ry:90});
   for(let q of [-1,1])add('accessory','Borchia rampa 2',pivotX+width/2+50,level-c.height*.3,-(i+.5)*pw+q*pw*.25,52,52,28,{accessoryType:'borchia'});
  }else add('glass','Parapetto rampa 2 '+(i+1),run1/2-(i+.5)*pw,level+c.height/2,-width*1.5,Math.max(100,pw-c.gap),c.height+45,c.glassThickness);
 }
 if(c.handrail!=='none'){
  add('profile','Corrimano rampa 1',0,n1*r/2+c.height+55,width/2+30,Math.hypot(run1,(n1-1)*r),35,35,{rz:Math.atan2((n1-1)*r,run1)*180/Math.PI});
  add('profile','Corrimano rampa 2',pivotX+width/2+30,n1*r+n2*r/2+c.height+55,-run2/2,35,35,Math.hypot(run2,n2*r),{rx:Math.atan2(n2*r,run2)*180/Math.PI});
 }
 out.push(...keep);
 return {group,objects:out,count:count1+count2,run:run1+run2+landing,top:N*r};
};
const vs6OldCreate=v4Create;
v4Create=function(code){
 const special=VS6_STAIRS.find(x=>x[0]===code);
 if(!special)return vs6OldCreate(code);
 const c=v4Config('scala',special[3]);const m=ensureV2(),before=v3Snapshot();
 m.v5=null;m.v4={config:c,code,group:null};const result=v4Build(c);m.objects=result.objects;m.v4.group=result.group;m.type='scala';E.selected=null;
 v2Refresh();v3Push(before);v4OpenControls();toast('Scala '+code+' creata: rampe, gradini e parapetti modificabili.');
};

// Mostra la sola galleria categorie; senza duplicare i controlli legacy.
const vs6OldMount=v4Mount;
v4Mount=function(){vs6OldMount();
 const panel=document.querySelector('.v2layout > .v2panel:first-child');
 if(panel){for(const b of panel.querySelectorAll('button')){
  if(b.getAttribute('onclick')==='v4OpenGallery()' || b.textContent.trim()==='Galleria scale e parapetti')b.remove();
 }}
 const bar=document.querySelector('#v4studio .v4studiohead .actions');
 bar?.querySelectorAll('button[onclick="v4OpenGallery()"]')?.forEach(b=>b.remove());
 document.querySelectorAll('.vs-mainmodels').forEach(b=>b.textContent='Scegli categoria e modello');
};
// Non mostrare i controlli scala senza modello scala selezionato.
const vs6OldProps=v4Props;
v4Props=function(){const c=ensureV2().v4?.config;return c?.type==='scala'||c?.type==='parapetto'?vs6OldProps():''};
const vs6Style=document.createElement('style');
vs6Style.textContent=`.vs-mainmodels{width:100%;margin:4px 0 9px;padding:14px!important;font-weight:750}.vs-empty{width:100%;margin-bottom:10px}#v4studio:has(#v4control:empty){min-height:0}.v2panel details{margin-top:12px}.v5model:focus-visible,.v5cat:focus-visible{outline:3px solid #008a7e;outline-offset:2px}`;
document.head.appendChild(vs6Style);
