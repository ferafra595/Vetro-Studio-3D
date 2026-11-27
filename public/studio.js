/* VetroStudio 3D — editor unificato. Nessuna dipendenza dai vecchi designer-v*.js */
(()=>{'use strict';
const T=()=>window.THREE, $id=id=>document.getElementById(id), mm=n=>Math.round(n*10)/10, uid=()=>crypto.randomUUID?.()||(`vs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`), N=(v,d=0)=>Number.isFinite(+v)?+v:d;
const catalog={
 scala:[['S01','Scala dritta · borchie','straight','borchie'],['S02','Scala dritta · profilo','straight','profilo'],['S03','Scala a L · borchie','L','borchie'],['S04','Scala a L · montanti','L','montanti'],['S05','Scala a U · borchie','U','borchie'],['S06','Scala a U · profilo','U','profilo']],
 parapetto:[['P01','Parapetto a borchie','linear','borchie'],['P02','Parapetto con profilo','linear','profilo'],['P03','Ringhiera con montanti','linear','montanti'],['P04','Parapetto ad angolo','corner','morsetti']],
 doccia:[
  ['D01','Walk-in fisso','walkin','profilo'],['D02','Nicchia · scorrevole singola','nicchia','scorrevole'],
  ['D03','Angolare battente','angolo','battente'],['D04','Angolare scorrevole','angolo','scorrevole'],
  ['D05','Angolare · doppia battente','doppia','battente'],
  ['D06','Box quadrato','corner','sliding',900,900,0],['D07','Box rettangolare','corner','sliding',1200,900,0],
  ['D08','Box quadrato + parete fissa','corner','sliding',900,900,1],['D09','Box rettangolare + parete fissa','corner','sliding',1200,900,1],
  ['D10','Box semicircolare','curved','sliding',900,900,0],
  ['D11','Scorrevole + 1 parete fissa','front','sliding',1200,900,1],['D12','Scorrevole + 2 pareti fisse','front','sliding',1200,900,2],
  ['D13','Nicchia · doppia scorrevole','front','doubleSlide',1600,900,0],
  ['D14','Doppia scorrevole + 1 parete fissa','front','doubleSlide',1600,900,1],['D15','Doppia scorrevole + 2 pareti fisse','front','doubleSlide',1600,900,2],
  ['D16','Nicchia · pieghevole','front','fold',900,900,0],['D17','Pieghevole + 1 parete fissa','front','fold',900,900,1],
  ['D18','Pieghevole + 2 pareti fisse','front','fold',900,900,2],['D19','Nicchia · battente','front','swing',900,900,0],
  ['D20','Battente + 1 parete fissa','front','swing',900,900,1],['D21','Battente + 2 pareti fisse','front','swing',900,900,2]
 ],
 porta:[['O01','Battente singola','battente','singola'],['O02','Battente doppia','battente','doppia'],['O03','Scorrevole singola','scorrevole','singola'],['O04','Scorrevole doppia','scorrevole','doppia'],['O05','Porta a libro','libro','doppia']],
 vetrina:[['V01','Vetrina modulare','modulare',3],['V02','Vetrina con ingresso','ingresso',3],['V03','Vetrina angolare','angolo',2]],
 specchio:[['M01','Specchio rettangolare','rettangolo',1],['M02','Specchio circolare','circolare',1],['M03','Specchio ad arco','arco',1]]};
const labels={scala:'Scale',parapetto:'Parapetti e ringhiere',doccia:'Box doccia',porta:'Porte',vetrina:'Vetrine',specchio:'Specchi'};
let U={tab:'objects',right:true,drawer:true,selected:null,mode:'orbit',snap:true,theme:'modern',cameraTarget:null,mouse:null,shape:null,undo:[],redo:[],timer:null,autosave:null,loading:false};
const object=(kind,name,x,y,z,w,h,d,ext={})=>({id:uid(),kind,name,x:mm(x),y:mm(y),z:mm(z),w:mm(w),h:mm(h),d:mm(d),ry:0,rx:0,rz:0,...ext});
function model(){let m=S.current.model;m.objects??=[];m.studio??={category:'doccia',template:'D01',settings:{}};return m}
function remember(){if(!S.current)return;U.undo.push(JSON.stringify({objects:model().objects,studio:model().studio}));if(U.undo.length>80)U.undo.shift();U.redo=[]}
function restore(json){doorPreviews.clear();let state=JSON.parse(json);model().objects=state.objects;model().studio=state.studio;U.selected=null;refresh(true)}
function undo(){if(!U.undo.length)return;U.redo.push(JSON.stringify({objects:model().objects,studio:model().studio}));restore(U.undo.pop())}
function redo(){if(!U.redo.length)return;U.undo.push(JSON.stringify({objects:model().objects,studio:model().studio}));restore(U.redo.pop())}
function push(a,kind,name,x,y,z,w,h,d,ext={}){a.push(object(kind,name,x,y,z,w,h,d,ext));return a[a.length-1]}
const VEC=(x,z)=>({x,z}),shift=(p,d,a)=>VEC(p.x+d.x*a,p.z+d.z*a);
function runStairs(c){
 const a=[],steps=Math.max(4,Math.round(N(c.steps,12))),rise=Math.max(110,N(c.rise,175)),tread=Math.max(200,N(c.tread,285)),width=Math.max(650,N(c.width,1050)),railH=Math.max(900,N(c.railHeight,1050)),glassT=Math.max(6,N(c.thickness,12)),finish=c.finish||'wood',gap=14,layout=c.layout||'straight',fix=c.fix||'borchie';
 const first=layout==='straight'?steps:Math.ceil(steps/2),second=steps-first,half=width/2,landingSize=width+220;
 const flights=[],edges=[];
 const pt=(x,z)=>({x,z});const along=(p,d,t)=>pt(p.x+d.x*t,p.z+d.z*t);
 function flight(name,start,dir,count,baseSteps){
   const perp=pt(-dir.z,dir.x),total=count*tread;
   for(let i=0;i<count;i++){
     const center=along(start,dir,(i+.5)*tread),top=(baseSteps+i+1)*rise;
     const horizontal=Math.abs(dir.x)>.5;
     push(a,'stair',name+' · gradino '+(i+1),center.x,top-24,center.z,horizontal?tread-5:width,48,horizontal?width:tread-5,{finish,group:name});
     push(a,'wall',name+' · alzata '+(i+1),center.x,top/2-26,center.z,horizontal?tread-8:width,Math.max(12,top-52),horizontal?width:tread-8,{finish:'concrete',group:name});
   }
   flights.push({name,start,end:along(start,dir,total),dir,perp,total,startHeight:baseSteps*rise,endHeight:(baseSteps+count)*rise});
 }
 const firstStart=pt(-first*tread/2,0);flight('Rampa 1',firstStart,pt(1,0),first,0);
 const joint=flights[0].end,level=first*rise;let landing=null;
 if(layout==='straight'){landing={x:joint.x+550,z:0,w:1100,d:width};}
 if(layout==='L'){landing={x:joint.x+landingSize/2,z:-landingSize/2+half,w:landingSize,d:landingSize};let secondStart=pt(joint.x+landingSize/2,joint.z-landingSize+half);flight('Rampa 2',secondStart,pt(0,-1),second,first);}
 if(layout==='U'){landing={x:joint.x+landingSize/2,z:-half-110,w:landingSize,d:width*2+220};let secondStart=pt(joint.x,joint.z-width-220);flight('Rampa 2',secondStart,pt(-1,0),second,first);}
 push(a,'floor','Pianerottolo',landing.x,level-65,landing.z,landing.w,130,landing.d,{finish,group:'Pianerottolo'});
 function paneLine(name,p0,p1,y0,y1,offsetSign=1){
   const dx=p1.x-p0.x,dz=p1.z-p0.z,L=Math.hypot(dx,dz);if(L<120)return;
   const dir=pt(dx/L,dz/L),normal=pt(-dir.z,dir.x),xoff=(width/2+glassT/2+45)*offsetSign;
   const count=Math.max(1,Math.ceil(L/Math.max(500,N(c.maxPanel,1100)))),panelLen=L/count,rot=-Math.atan2(dir.z,dir.x)*180/Math.PI;
   const start=along(p0,normal,xoff);
   for(let i=0;i<count;i++){
     const t0=i*panelLen+gap/2,t1=(i+1)*panelLen-gap/2,pW=t1-t0;if(pW<100)continue;
     const b0=y0+(y1-y0)*t0/L+40,b1=y0+(y1-y0)*t1/L+40;
     const base=Math.min(b0,b1),height=railH+Math.abs(b1-b0),mid=along(start,dir,(t0+t1)/2);
     const shape=[[0,b0-base],[pW,b1-base],[pW,b1-base+railH],[0,b0-base+railH]];
     const glass=push(a,'glass',name+' · pannello '+(i+1),mid.x,base+height/2,mid.z,pW,height,glassT,{ry:rot,shape,group:name,finish:'clear'});
     if(fix==='borchie'||fix==='morsetti'){
       for(const local of [.22,.78]){
         const t=t0+pW*local,q=along(start,dir,t),cy=y0+(y1-y0)*t/L+165;
         push(a,'accessory',(fix==='borchie'?'Borchia':'Morsetto')+' · '+name,q.x+normal.x*25,cy,q.z+normal.z*25,52,52,28,{accessoryType:fix==='borchie'?'borchia':'morsetto',attachTo:glass.id,ry:rot,group:name});
       }
     }
     if(fix==='profilo')push(a,'profile','Profilo base · '+name,mid.x,(b0+b1)/2-14,mid.z,pW,32,36,{ry:rot,rz:Math.atan2(b1-b0,pW)*180/Math.PI,group:name});
     if(c.handrail)push(a,'profile','Corrimano · '+name,mid.x,(b0+b1)/2+railH+18,mid.z,pW+gap,38,38,{ry:rot,rz:Math.atan2(b1-b0,pW)*180/Math.PI,group:name});
   }
   if(fix==='montanti')for(let i=0;i<=count;i++){
     const q=along(start,dir,L*i/count),h=y0+(y1-y0)*i/count;
     push(a,'profile','Montante '+name+' '+(i+1),q.x,h+railH/2,q.z,42,railH,42,{group:name});
   }
 }
 const sides=c.side==='both'?[1,-1]:[c.side==='left'?-1:1];
 for(const f of flights)for(const side of sides)paneLine(f.name,f.start,f.end,f.startHeight,f.endHeight,side);
 // Protections at actual exposed landing edges, at landing elevation (not in mid-air).
 const lx=landing.x,lz=landing.z,x0=lx-landing.w/2,x1=lx+landing.w/2,z0=lz-landing.d/2,z1=lz+landing.d/2;
 if(layout==='straight')for(const side of sides)paneLine('Pianerottolo',pt(x0,lz),pt(x1,lz),level,level,side);
 if(layout==='L'){
   paneLine('Pianerottolo · esterno',pt(x1,z0),pt(x1,z1),level,level,0);
   paneLine('Pianerottolo · frontale',pt(x0,z0),pt(x1,z0),level,level,0);
 }
 if(layout==='U'){
   paneLine('Pianerottolo · esterno',pt(x0,z0),pt(x1,z0),level,level,0);
   paneLine('Pianerottolo · lato',pt(x1,z0),pt(x1,z1),level,level,0);
 }
 return a;
}
function buildShower(add,[code,,layout,mechanism,width=1200,depth=900,returns]){
 const h=2050,wallHeight=2440,glass=8,wall=95;
 const corner=layout==='corner',curved=layout==='curved';
 const sideGlass=returns??(['angolo','doppia'].includes(layout)?1:0);
 const niche=!corner&&!curved&&layout!=='walkin'&&layout!=='angolo'&&layout!=='doppia';
 const front=depth/2;
 const frontFrame={x:0,z:front,ry:0,length:width};
 const rightFrame={x:width/2,z:0,ry:90,length:depth};
 const addWall=(name,x,z,w,d)=>add('wall',name,x,wallHeight/2,z,w,wallHeight,d,{finish:'tile'});
 add('floor','Piatto doccia',0,-35,0,width,70,depth,{finish:'ceramic',trayRadius:curved?width:null});
 addWall('Parete posteriore',0,-front-wall/2,width+2*wall,wall);
 if(sideGlass===2||(corner&&sideGlass))add('glass','Parete fissa sinistra',-width/2,h/2,0,depth,h,glass,{ry:90});
 else addWall('Parete sinistra',-width/2-wall/2,0,wall,depth);
 if(sideGlass>=1&&!corner)add('glass','Parete fissa destra',width/2,h/2,0,depth,h,glass,{ry:90});
 else if(niche)addWall('Parete destra',width/2+wall/2,0,wall,depth);

 function panel(frame,name,along,length,inset=0,options={}){
  const [x,,z]=panelVector(frame,along,0,inset);
  return add('glass',name,frame.x+x,h/2,frame.z+z,length,h,glass,{ry:frame.ry,...options});
 }
 function handle(leaf,along){
  const [x,,z]=panelVector(leaf,along,0,0);
  add('accessory','Maniglia',leaf.x+x,1050,leaf.z+z,28,190,38,{ry:leaf.ry,accessoryType:'maniglia',attachTo:leaf.id});
 }
 function rail(frame){
  const [x,,z]=panelVector(frame,0,0,-7);
  add('profile','Binario superiore',frame.x+x,h+16,frame.z+z,frame.length,32,45,{ry:frame.ry});
 }
 function sliding(frame,direction,double=false){
  const segment=frame.length/(double?4:2);
  const travel=segment-14;
  panel(frame,'Vetro fisso '+(direction<0?'sinistro':'destro'),direction*(frame.length/2-segment/2),segment-6);
  const leaf=panel(frame,'Anta scorrevole '+(direction<0?'sinistra':'destra'),direction*(frame.length/2-1.5*segment),segment+8,-14,
   {openingType:'slide',openingSide:direction,slideTravel:travel,interiorTrack:true});
  handle(leaf,-direction*(segment/2-65));
 }
 if(curved){
  const radius=width;
  for(const [i,[start,end]] of [[0,22.5],[22.5,45],[45,67.5],[67.5,90]].entries()){
   const moving=i===1||i===2,arcRadius=radius-(moving?14:0),mid=(start+end)*Math.PI/360;
   const x=-width/2+arcRadius*Math.cos(mid),z=-front+arcRadius*Math.sin(mid);
   const curve={x:-width/2,z:-front,radius:arcRadius,start,end};
   const leaf=add('glass',moving?'Anta curva '+i:'Vetro curvo fisso '+(i+1),x,h/2,z,arcRadius*(end-start)*Math.PI/180,h,glass,
    {curve,openingType:moving?'curve':'fixed',openingSide:i===1?-1:1,ry:-mid*180/Math.PI+90});
   if(moving)handle(leaf,0);
  }
 }else if(corner){
  sliding(frontFrame,-1);
  sliding(rightFrame,1);
  rail(frontFrame);rail(rightFrame);
 }else if(mechanism==='doubleSlide'){
  sliding(frontFrame,-1,true);sliding(frontFrame,1,true);rail(frontFrame);
 }else if(mechanism==='scorrevole'||mechanism==='sliding'){
  sliding(frontFrame,-1);rail(frontFrame);
 }else if(mechanism==='fold'){
  const root=panel(frontFrame,'Anta pieghevole · lato muro',-width/4,width/2-4,0,{openingType:'fold',openingSide:-1,foldSpan:width/2});
  const leaf=panel(frontFrame,'Anta pieghevole · lato maniglia',width/4,width/2-4,0,{foldRoot:root.id});
  root.foldPartner=leaf.id;
  handle(leaf,width/4-70);
 }else if(layout==='walkin'){
  panel(frontFrame,'Vetro walk-in',-width/6,width*2/3);
 }else{
  const paired=layout==='doppia';
  const length=paired||layout==='angolo'?width/2:width;
  if(layout==='angolo')panel(frontFrame,'Vetro fisso sinistro',-width/4,length-8);
  const sides=paired?[-1,1]:[layout==='angolo'?1:-1];
  for(const side of sides){
   const leaf=panel(frontFrame,paired?'Anta '+(side<0?'sinistra':'destra'):'Anta battente',paired||layout==='angolo'?side*width/4:0,length-8,0,{openingType:'swing',openingSide:side});
   handle(leaf,-side*(length/2-70));
  }
 }
}
function buildInteriorDoor(add,kind,fix){
 const sliding=kind==='scorrevole',folding=kind==='libro',paired=fix==='doppia';
 const width=paired&&!folding?1600:950,height=2150,count=paired?2:1;
 const panelWidth=width/count,railHeight=height+20,wallDepth=120;
 const frameZ=0,panelZ=sliding?-(wallDepth/2+55):frameZ;
 const surroundDepth=sliding?width/count+80:310;
 for(const side of [-1,1]){
  add('wall',side<0?'Spalletta sinistra':'Spalletta destra',side*(width+surroundDepth)/2,(height+300)/2,frameZ,surroundDepth,height+300,wallDepth,{finish:'concrete'});
  add('profile',side<0?'Stipite sinistro':'Stipite destro',side*(width/2+14),height/2,frameZ,30,height,72);
 }
 add('wall','Architrave',0,height+150,frameZ,width,300,wallDepth,{finish:'concrete'});
 add('profile','Traverso superiore',0,height+10,frameZ,width,22,72);
 if(sliding){
  const trackLength=width*2+32;
  const trackX=paired?0:-width/2;
  add('profile','Guida superiore',trackX,railHeight,panelZ,trackLength,40,44);
  const guideX=paired?[-width/2,width/2]:[-width/2];
  for(const x of guideX){
   add('profile','Base guida a pavimento',x,2,panelZ,32,4,24);
   for(const side of [-1,1])add('profile','Sponda guida a pavimento',x,8,panelZ+side*9,32,12,4);
  }
 }
 const leaves=[];
 for(let i=0;i<count;i++){
  const side=i===0?-1:1,x=-width/2+panelWidth*(i+.5);
  const opening=folding?(i===0?'fold':null):sliding?'slide':'swing';
  const leaf=add('glass',sliding?'Anta scorrevole '+(i+1):'Anta '+(i+1),x,height/2+3,panelZ,panelWidth-6,height-14,10,
   {openingType:opening,openingSide:side,slideTravel:sliding?panelWidth-72:undefined});
  leaves.push(leaf);
  if(sliding)for(const offset of [-.32,.32]){
   add('accessory','Carrello anta',x+panelWidth*offset,height+1,panelZ,26,25,18,{accessoryType:'roller',attachTo:leaf.id});
  }
  if(folding&&i===0)continue;
  const handleX=x+(folding?1:-side)*(panelWidth/2-70);
  add('accessory','Maniglia',handleX,1050,panelZ,26,205,38,{accessoryType:'maniglia',attachTo:leaf.id});
 }
 if(folding){
  const [root,leaf]=leaves;
  root.foldSpan=panelWidth;
  root.foldPartner=leaf.id;
  leaf.foldRoot=root.id;
 }
}
function build(cat,t){const a=[],code=t[0],kind=t[2],fix=t[3],cfg={category:cat,template:code,settings:{steps:12,rise:175,tread:285,width:1050,railHeight:1080,maxPanel:1050,thickness:12,finish:'wood',layout:kind,fix,side:'right',handrail:fix==='montanti'}};
 const add=(k,n,x,y,z,w,h,d,o={})=>push(a,k,n,x,y,z,w,h,d,o);
 if(cat==='scala')return {objects:runStairs(cfg.settings),studio:cfg};
 if(cat==='parapetto'){const w=3600,h=1050,d=1200,n=4;add('floor','Soletta rivestita',0,-70,0,w+200,140,d,{finish:'stone'});for(let i=0;i<n;i++){let x=-w/2+w*(i+.5)/n;let panel=add('glass','Vetro parapetto '+(i+1),x,h/2,d/2,w/n-12,h,12,{group:'Parapetto'});if(fix==='montanti')add('profile','Montante '+(i+1),x-w/n/2,h/2,d/2,42,h,42);else if(fix==='borchie')for(let k of [-.28,.28])add('accessory','Borchia',x+k*w/n,140,d/2+28,50,50,28,{accessoryType:'borchia',attachTo:panel.id})}add('profile','Corrimano',0,h+20,d/2,w,35,35);if(kind==='corner')add('glass','Ritorno angolare',w/2,h/2,0,1000,h,12,{ry:90})}
 if(cat==='doccia')buildShower(add,t);
 if(cat==='porta')buildInteriorDoor(add,kind,fix);
 if(cat==='vetrina'){let w=3600,h=2450,n=N(fix,3),pw=w/n;for(let i=0;i<n;i++){let x=-w/2+pw*(i+.5),p=add('glass',kind==='ingresso'&&i===1?'Porta ingresso':'Pannello fisso '+(i+1),x,h/2,0,pw-15,h-20,10);if(kind==='ingresso'&&i===1)add('accessory','Maniglia',x+pw*.3,1050,30,25,200,35,{accessoryType:'maniglia',attachTo:p.id})}for(let i=0;i<=n;i++)add('profile','Montante '+i,-w/2+i*pw,h/2,0,30,h,55);add('profile','Traverso superiore',0,h,0,w+40,35,55);if(kind==='angolo')add('glass','Vetrina laterale',w/2,h/2,-500,1000,h,10,{ry:90})}
 if(cat==='specchio'){add('wall','Parete rivestita',0,1050,-55,2200,2100,90,{finish:'stone'});let o=add('mirror','Specchio',0,950,0,1100,1700,6);if(kind==='circolare'||kind==='arco')o.shape=kind==='arco'?[[0,0],[1100,0],[1100,1300],[1050,1510],[900,1650],[550,1700],[200,1650],[50,1510],[0,1300]]:Array.from({length:48},(_,i)=>[550+540*Math.cos(2*Math.PI*i/48),850+840*Math.sin(2*Math.PI*i/48)]);}
 return {objects:a,studio:cfg}}
function choose(cat,code){const entry=catalog[cat]?.find(t=>t[0]===code);if(!entry)return;doorPreviews.clear();remember();const result=build(cat,entry);model().objects=result.objects;model().studio=result.studio;model().type=cat;U.selected=null;U.tab='objects';U.drawer=true;refresh(true);frameModel()}
function blank(){remember();model().objects=[];model().studio={category:'libero',template:null,settings:{}};U.selected=null;refresh(true)}
function refresh(modelChanged=false){if(modelChanged)drawScene();renderSidebar();renderProps();updatePricing();updateTitle();queueAutosave()}
function queueAutosave(){clearTimeout(U.timer);if(!S.current?.id)return;U.timer=setTimeout(async()=>{if(U.loading||!['designer','cad'].includes(S.view)||projectSignature()===savedProjectState)return;try{U.loading=true;await saveCurrent()}catch(e){console.warn('Autosave:',e)}finally{U.loading=false}},5000)}
const architecturalFinishes=[
 ['tile','Grès avorio','#d1cdc0'],['tileSage','Ceramica salvia','#8b9d8d'],['tileSlate','Grès ardesia','#59636a'],
 ['ceramic','Ceramica bianca','#e4e4df'],['concrete','Cemento architettonico','#969e9d'],['stone','Pietra naturale','#a8a093'],
 ['wood','Rovere','#b88c64'],['marble','Marmo chiaro','#d3d2d1']
];
function renderSidebar(){let el=$id('vsSide');if(!el)return;el.innerHTML={models:()=>`<h3>Scegli categoria e modello</h3><label class="label">Categoria</label><select id="vsCategory" onchange="VS.setCategory(this.value)">${Object.entries(labels).map(([v,l])=>`<option value="${v}" ${U.cat===v?'selected':''}>${l}</option>`).join('')}</select><div class="vsModels">${(catalog[U.cat]||[]).map(t=>`<button class="vsModel" onclick="VS.choose('${U.cat}','${t[0]}')"><strong>${t[0]}</strong><span>${t[1]}</span></button>`).join('')}</div><button class="btn" onclick="VS.blank()">+ Progetto libero</button>`,draw:()=>`<h3>Disegna e aggiungi</h3><div class="vsModels">${[['glass','Lastra'],['wall','Muro'],['floor','Pavimento'],['stair','Gradino'],['balcony','Balcone'],['profile','Profilo'],['mirror','Specchio']].map(([k,l])=>`<button class="vsModel" onclick="VS.add('${k}')">+ ${l}</button>`).join('')}</div><button class="btn" onclick="VS.shapeEditor()">Editor sagoma 2D</button>`,objects:()=>elementTree(),materials:()=>`<h3>Materiali e finiture</h3><p class="small">Seleziona un muro, pavimento, balcone o gradino.</p>
 <div class="vsModels">${architecturalFinishes.map(([key,label,color])=>`<button class="vsModel" onclick="VS.finish('${key}')">
 <span style="flex:0 0 24px;height:24px;border-radius:5px;background:${color};border:1px solid #9ba7a9" aria-hidden="true"></span><span>${label}</span></button>`).join('')}</div>`} [U.tab]?.()||'';if(U.tab==='models'&&model().studio.category==='scala'){const params=document.createElement('div');params.id='vsParams';params.className='vsParamPanel';el.append(params);updateParamPanel()}}
function selectedPanel(){
 const selected=model().objects.find(o=>o.id===U.selected);
 return glassPanels().find(panel=>panel.id===(selected?.attachTo||selected?.id));
}
function elementTree(){
 const objects=model().objects;
 const panels=glassPanels();
 const row=(o,label)=>`<button class="vsTreeRow ${U.selected===o.id?'active':''}" aria-pressed="${U.selected===o.id}" data-element="${esc(o.id)}" onclick="VS.select(this.dataset.element)">${esc(label)}</button>`;
 const grouped=panels.map((panel,i)=>{
  const accessories=objects.filter(o=>o.attachTo===panel.id);
  return `<div class="vsTreeGroup">${row(panel,`${i+1}. ${panel.name}`)}
  <div class="vsTreeChildren">${accessories.map(o=>row(o,fittingLabel(o))).join('')}</div></div>`;
 }).join('');
 const other=objects.filter(o=>!panels.some(panel=>panel.id===o.id||panel.id===o.attachTo));
 return `<h3>Elementi</h3><div class="vsTree">${grouped}${other.length?`<details><summary>Ambiente e altri elementi</summary><div class="vsTree">${other.map(o=>row(o,o.name)).join('')}</div></details>`:''}</div>`;
}
function fittingLabel(o){
 return o.technicalSpec?`${o.name} · ${N(o.localY).toFixed(1)} mm`:o.name;
}
function fittingDimensions(o){
 const d=o?.technicalSpec?.sourceDimensions;
 if(!d)return '';
 return [
  ['diameter','Ø'],['centerSpacing','Interasse'],['opening','Apertura'],['notchDepth','Profondità']
 ].filter(([key])=>Number.isFinite(d[key])).map(([key,label])=>`${label} ${d[key]} mm`).join(' · ');
}
function moveFittingTo(id,x,y){
 const o=model().objects.find(o=>o.id===id&&o.technicalSpec);
 const panel=glassPanels().find(panel=>panel.id===o?.attachTo);
 if(!panel||!Number.isFinite(x)||!Number.isFinite(y))return 'Inserisci quote valide';
 const [dx,dy,dz]=panelVector(panel,x-panel.w/2,y-panel.h/2,panel.d/2);
 const error=moveTechnicalAccessory(o,{x:panel.x+dx,y:panel.y+dy,z:panel.z+dz});
 refresh(true);
 return error;
}
function editFitting(id,form){
 const x=form.elements.x.valueAsNumber,y=form.elements.y.valueAsNumber;
 const error=moveFittingTo(id,x,y);
 if(error)toast(error);
}
function renderProps(){
 const el=$id('vsProps');
 if(!el)return;
 const o=model().objects.find(object=>object.id===U.selected);
 if(!o){el.innerHTML='<p class="small">Seleziona un elemento nella scena.</p>';return;}
 const panel=['glass','mirror'].includes(o.kind);
 const edges={left:'Sinistro',right:'Destro',top:'Superiore',bottom:'Inferiore'};
 const fitting=o.technicalSpec?`<p class="small">Bordo · ${edges[o.mountEdge]||'Posizionamento libero'}</p>
 <form onsubmit="event.preventDefault();VS.editFitting('${o.id}',this)"><div class="vsFieldGrid">
 <label>Dal bordo sinistro (mm)<input class="field" name="x" type="number" step="any" value="${N(o.localX)}" ${['left','right'].includes(o.mountEdge)?'readonly':''}></label>
 <label>Dal basso (mm)<input class="field" name="y" type="number" step="any" value="${N(o.localY)}" ${['top','bottom'].includes(o.mountEdge)?'readonly':''}></label></div>
 <button class="btn primary">Sposta</button></form><p class="small">${fittingDimensions(o)}</p>`:'';
 const fields=keys=>keys.map(([key,label])=>`<label>${label}<input class="field" type="number" step="0.1" value="${N(o[key],key==='mountScale'?100:0)}" onchange="VS.edit('${o.id}','${key}',this.value)"></label>`).join('');
 const finishes=['wall','floor','stair','balcony'].includes(o.kind)?`<label class="label">Finitura architettonica
 <select class="field" onchange="VS.finish(this.value)">${architecturalFinishes.map(([value,label])=>`<option value="${value}" ${o.finish===value?'selected':''}>${label}</option>`).join('')}</select></label>`:'';
 const toolsOpen=el.querySelector('details')?.open;
 const motion=panel?doorOpening(o):null;
 const hingeSide=motion?.type==='swing'?`<label class="label">Lato cerniere<select class="field" onchange="VS.setHingeSide('${o.id}',Number(this.value))">
 <option value="-1" ${motion.side===-1?'selected':''}>Sinistra</option><option value="1" ${motion.side===1?'selected':''}>Destra</option></select></label>`:'';
 const motionControls=motion?`<button class="btn" onclick="VS.toggleDoor('${o.id}')">${doorPreviews.get(o.id)?.target?'Chiudi anta':'Apri anta'}</button>`:'';
 const openingFields=o.kind==='glass'?`<label class="label">Apertura<select class="field" onchange="VS.setOpening('${o.id}','openingType',this.value)"><option value="">Da modello</option>${[['fixed','Fissa'],['swing','Battente'],['slide','Scorrevole']].map(([value,label])=>`<option value="${value}" ${value===o.openingType?'selected':''}>${label}</option>`).join('')}</select></label>
 ${o.openingType==='slide'?`<label class="label">Verso di scorrimento<select class="field" onchange="VS.setOpening('${o.id}','openingSide',Number(this.value))"><option value="-1">Sinistra</option><option value="1" ${o.openingSide===1?'selected':''}>Destra</option></select></label>`:''}`:'';
 const fit=renderMeshes.get(o.id)?.userData.hingeFit;
 const hingeFit=o.accessoryType==='cerniera'&&o.technicalSpec?(fit==='glb'?'Modello originale · vetro centrato tra le ganasce.':fit==='glb-review'?'Modello originale · verifica l’allineamento delle ganasce.':'Anteprima con ganasce di riferimento.'):'';
 const mounting=o.technicalSpec?`<p class="small">Regolazione del modello 3D rispetto al fissaggio. Le lavorazioni restano nella posizione quotata.</p>${hingeFit?`<p class="small">${hingeFit}</p>`:''}<div class="vsFieldGrid">${fields([['mountX','Offset modello X (mm)'],['mountY','Offset modello Y (mm)'],['mountZ','Distanza dal vetro (mm)'],['mountSpin','Rotazione GLB sul vetro (°)'],['mountYaw','Rotazione GLB verticale (°)'],['mountScale','Scala GLB (%)']])}</div>`:'';
 el.innerHTML=`<label class="label">Nome<input class="field" value="${esc(o.name)}" onchange="VS.edit('${o.id}','name',this.value)"></label>
 ${fitting}
 <div class="vsFieldGrid" ${o.technicalSpec?'hidden':''}>${fields([['w','Larghezza (mm)'],['h','Altezza (mm)'],['d',panel?'Spessore (mm)':'Profondità (mm)']])}</div>
 ${hingeSide}${motionControls}
 ${panel?'<div class="actions"><button class="btn primary" onclick="VSTech.picker()">Aggiungi accessorio</button></div>':''}
 <details ${toolsOpen?'open':''}><summary>Strumenti avanzati</summary>
 <div class="vsFieldGrid">${fields([['x','X (mm)'],['y','Y (mm)'],['z','Z (mm)'],['rx','Rotazione X (°)'],['ry','Rotazione Y (°)'],['rz','Rotazione Z (°)']])}</div>
 ${openingFields}${mounting}${finishes}<div class="actions"><button class="btn" onclick="VS.duplicate()">Duplica</button><button class="btn danger" onclick="VS.remove()">Elimina</button></div>
 </details>`;
}
let savedProjectState=null,savingProject=false,saveFailed=false;
function projectSignature(p=S.current){
 return p?JSON.stringify([p.title,p.client_id,p.status,p.model]):null;
}
function saveState(state,signature){
 if(state==='saving'){savingProject=true;saveFailed=false;}
 if(state==='saved'){savingProject=false;saveFailed=false;savedProjectState=signature;}
 if(state==='error'){savingProject=false;saveFailed=true;}
 const label=savingProject?'Salvataggio…':saveFailed?'Salvataggio non riuscito':S.current?.id&&projectSignature()===savedProjectState?'Salvato':'Modifiche da salvare';
 for(const id of ['vsSaveState','cadSaveState']){const el=$id(id);if(el)el.textContent=label;}
}
function updateTitle(){saveState();let el=$id('vsTitle');if(el)el.textContent=S.current?.title||'Nuovo progetto'}
function pricingModel(){let m=model(),glass=m.objects.filter(o=>o.kind==='glass'||o.kind==='mirror'),area=glass.reduce((s,o)=>{if(o.shape?.length>=3){let pts=o.shape,total=0;for(let i=0;i<pts.length;i++){let a=pts[i],b=pts[(i+1)%pts.length];total+=a[0]*b[1]-b[0]*a[1]}return s+Math.max(0,Math.abs(total)/2-(o.holes||[]).reduce((a,h)=>a+Math.PI*h.r*h.r,0))/1e6}return s+o.w*o.h/1e6},0),material=area*180,accessories=m.objects.filter(o=>o.kind==='accessory').reduce((sum,o)=>sum+N(o.technicalUnitPrice,35),0),cost=material+accessories+N(m.labour)+N(m.installation)+N(m.transport),net=cost*(1+N(m.margin)/100)*(1-N(m.discount)/100),tax=net*N(m.vat,22)/100;return {area,material,accessories,cost,net,tax,total:net+tax}}
function updatePricing(){let el=$id('vsQuote');if(!el)return;let p=pricingModel();el.innerHTML=`<div class="vsMetric">Vetro <b>${p.area.toFixed(2)} m²</b></div><div class="vsMetric">Materiali <b>${eur(p.material)}</b></div><div class="vsMetric">Accessori <b>${eur(p.accessories)}</b></div><div class="vsMetric">Imponibile <b>${eur(p.net)}</b></div><div class="vsMetric">Totale IVA inclusa <strong>${eur(p.total)}</strong></div><p class="small">Prezzi indicativi: da configurare nei listini della vetreria.</p>`}
let activeProject;
function initProject(){if(!S.current)S.current={id:null,title:'Nuovo progetto',client_id:'',status:'bozza',model:newModel(),revision:0};let m=model();if(!m.objects.length&&!m.studio.initialized){let built=build('doccia',catalog.doccia[0]);m.objects=built.objects;m.studio=built.studio;m.studio.initialized=true}U.cat=m.studio.category in catalog?m.studio.category:'doccia';if(activeProject!==S.current){activeProject=S.current;savedProjectState=S.current.id?projectSignature():null;savingProject=false;saveFailed=false;U.undo=[];U.redo=[];U.selected=null}}
function designerHTML(){initProject();return `<div class="vsWorkspace"><header class="vsHeader"><div class="vsLogo">Vetro<span>Studio</span> 3D <small id="vsTitle">${esc(S.current.title)}</small><span id="vsSaveState" class="small" role="status"></span></div><div class="vsHeadActions"><button class="btn" onclick="navigate('home')">← Gestionale</button><button class="btn" onclick="VS.shapeEditor()">2D</button><button class="btn" onclick="navigate('projects')">Apri progetto</button><button class="btn" onclick="VS.undo()" title="Annulla">↶</button><button class="btn" onclick="VS.redo()" title="Ripristina">↷</button><button class="btn primary" onclick="saveCurrent()">Salva</button><button class="btn" onclick="VS.reviewDelivery()">Controlla commessa</button><button class="btn" onclick="VS.downloadDxf()">Scarica DXF</button><select class="vsExport" onchange="VS.export(this.value);this.value='' "><option value="">Esporta...</option><option value="pdf">PDF</option><option value="png">PNG</option><option value="dxf">DXF commessa</option><option value="dxf-panel">DXF lastra selezionata</option><option value="workshop">Scheda lavorazioni</option><option value="csv">CSV</option><option value="gltf">GLTF</option></select></div></header><div class="vsContent"><nav class="vsRail">${[['models','▦','Modelli'],['draw','✎','Disegna'],['objects','▤','Elementi'],['materials','◈','Materiali']].map(([id,g,n])=>`<button onclick="VS.tab('${id}')" title="${n}" data-vstab="${id}"><b>${g}</b>${n}</button>`).join('')}</nav><aside class="vsLeft" id="vsLeft"><button class="vsCollapse" onclick="VS.toggleLeft()">‹</button><div id="vsSide"></div></aside><main class="vsViewport"><canvas id="canvas3d"></canvas><div class="vsCam"><button onclick="VS.camera('iso')">3D</button><button onclick="VS.camera('front')">Frontale</button><button onclick="VS.camera('side')">Laterale</button><button onclick="VS.camera('top')">Dall'alto</button></div><div class="vsViewTools"><button onclick="VS.frame()">⌗ Inquadra</button><button onclick="VS.toggleRight()">☷ Proprietà</button></div><div class="vsBottom"><button onclick="VS.viewMode()" id="vsVisualBtn">✦ Realistico</button><button onclick="VS.toggleQuote()">Commessa</button><button onclick="VS.toggleSnap()" id="vsSnapBtn">🧲 Snap: ON</button><button onclick="VS.toggleLeft()">☰ Strumenti</button></div><div class="vsHelp">Clic sull’anta per aprirla · Alt + trascina per ruotare</div></main><aside class="vsRight" id="vsRight"><div class="vsRightHead"><strong>Proprietà</strong><button class="btn" onclick="VS.toggleRight()">×</button></div><div id="vsProps"></div><details id="vsQuoteDetails"><summary>Commessa</summary><div id="vsQuote"></div>${[['labour','Lavorazioni €'],['installation','Posa €'],['transport','Trasporto €'],['margin','Ricarico %'],['discount','Sconto %'],['vat','IVA %']].map(([k,l])=>`<label class="label">${l}</label><input class="field" type="number" value="${N(model()[k])}" onchange="VS.cost('${k}',this.value)">`).join('')}<hr><label class="label">Titolo progetto</label><input class="field" value="${esc(S.current.title)}" oninput="S.current.title=this.value;VS.title();VS.saveState()"><label class="label">Cliente</label><select onchange="S.current.client_id=this.value;VS.saveState()"><option value="">Non assegnato</option>${S.clients.map(c=>`<option value="${c.id}" ${c.id===S.current.client_id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></details></aside></div></div>`}
// Three.js rendering. Single source of truth: model().objects.
function glassPanels(){return model().objects.filter(o=>['glass','mirror'].includes(o.kind));}
const cadColors=['#126776','#a24921','#5455a0','#39764b','#945173','#68503a'];
function cadPlan(panels){
 if(!panels.length)return '';
 const bounds=panels.map((o,i)=>{
  const [dx,,dz]=panelVector(o,N(o.w)/2,0,0);
  const x=N(o.x),z=N(o.z)+showerTrackOffset(o);
  const points=o.curve?Array.from({length:17},(_,step)=>{
   const curve=o.curve,angle=(curve.start+(curve.end-curve.start)*step/16)*Math.PI/180;
   return [curve.x+curve.radius*Math.cos(angle),curve.z+curve.radius*Math.sin(angle)];
  }):[[x-dx,z-dz],[x+dx,z+dz]];
  return {i,x,z,points};
 });
 const walls=model().objects.filter(o=>o.kind==='wall').map(o=>{
  const points=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([u,v])=>{
   const [x,,z]=panelVector(o,u*N(o.w),0,v*N(o.d));
   return [N(o.x)+x,N(o.z)+z];
  });
  return {points};
 });
 const points=[...bounds,...walls].flatMap(o=>o.points);
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
 const left=Math.min(...xs),top=Math.min(...zs),w=Math.max(...xs)-left,h=Math.max(...zs)-top;
 const pad=Math.max(w,h,500)*.16;
 const palette=cadColors;
 return `<h3>Posizione delle lastre · vista dall’alto</h3>
 <svg viewBox="${left-pad} ${top-pad} ${w+2*pad} ${h+2*pad}" width="100%" height="220" role="img" aria-label="Pianta delle lastre numerate">
 ${walls.map(wall=>`<polygon points="${wall.points.join(' ')}" fill="#c4cacb"/>`).join('')}
 ${bounds.map(o=>`<g><polyline points="${o.points.join(' ')}" fill="none" stroke="${palette[o.i%palette.length]}" stroke-width="5" vector-effect="non-scaling-stroke"/>
 <circle cx="${o.x}" cy="${o.z}" r="${pad*.22}" fill="${palette[o.i%palette.length]}"/><text x="${o.x}" y="${o.z}" fill="white" text-anchor="middle" dominant-baseline="central" font-size="${pad*.24}">${o.i+1}</text></g>`).join('')}
 </svg>`;
}
function cadPanelCard(panel,index){
 const color=cadColors[index%cadColors.length];
 const width=N(panel.w),height=N(panel.h);
 let outline;
 try{outline=technicalGlassShape(panel).outline;}catch{outline=panel.shape;}
 const points=(outline||[[0,0],[width,0],[width,height],[0,height]]).map(([x,y])=>`${N(x)},${-N(y)}`).join(' ');
 return `<button class="btn cadPanelCard" data-cad-panel="${esc(panel.id)}" onclick="VS.${panel.curve?'show3D':'openCad'}(this.dataset.cadPanel)">
 <svg width="64" height="58" viewBox="-8 ${-height-8} ${width+16} ${height+16}" aria-hidden="true"><polygon points="${points}" fill="${color}" fill-opacity=".2" stroke="${color}" vector-effect="non-scaling-stroke"/></svg>
 <span><strong>${index+1}. ${esc(panel.name)}</strong><br>${width} × ${height} × ${N(panel.d)} mm${panel.curve?' · R '+panel.curve.radius+' mm':''}</span></button>`;
}
function cadPage(){
 initProject();
 const panels=glassPanels();
 const active=model().objects.find(o=>o.id===U.selected);
 const selected=panels.find(o=>o.id===(active?.attachTo||active?.id));
 return `<div class="panel"><h2>${esc(S.current.title)}</h2>
 ${cadPlan(panels)}
 <div class="grid2"><label>Lastra
 <select id="vsCadPanel" ${panels.length?'':'disabled'}>
 ${panels.map((o,i)=>`<option value="${esc(o.id)}" ${o.id===selected?.id?'selected':''}>${i+1}. ${esc(o.name)} · ${N(o.w)} × ${N(o.h)} mm</option>`).join('')}
 </select></label></div>
 <div class="actions">
 <button class="btn primary" onclick="VS.openCad()" ${panels.length?'':'disabled'}>Apri in 2D</button>
 <button class="btn" onclick="VS.addCadPanel()">Aggiungi lastra</button>
 <button class="btn" onclick="VS.show3D(document.getElementById('vsCadPanel').value)">Apri in 3D</button>
 <button class="btn" onclick="saveCurrent()">Salva progetto</button>
 </div>
 <div class="grid2">${panels.map(cadPanelCard).join('')}</div>
 </div>`;
}
function openCad(id=$id('vsCadPanel')?.value,fittingId=null){
 const panel=glassPanels().find(o=>o.id===id);
 if(!panel)return;
 if(panel.curve)return toast('Lastra curva: aprila in 3D per visualizzare il raggio');
 select(id);window.VSCAD2D.open(fittingId);
}
function show3D(id){
 if(id)select(id);
 if(S.view!=='designer')navigate('designer');
}
function addCadPanel(){
 add('glass');
 $id('page').innerHTML=cadPage();
 openCad();
}
const doorPreviews=new Map();
let renderMeshes=new Map(),orbit={az:.62,el:.34,dist:5500,target:null},viewMode='real';
// Shared, cached procedural PBR textures; texture scale is in real millimetres.
const materialCache=new Map();
function makeSurfaceTexture(Three,finish){
 const key=finish||'concrete';if(materialCache.has(key))return materialCache.get(key);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
 const palette={wood:['#a87c53','#b89066','#6d503a'],stone:['#9f9789','#b8b1a5','#77766d'],tile:['#8e8b83','#d7d1c4','#bcb6aa'],tileSage:['#646d62','#adbcad','#778b7c'],tileSlate:['#555d60','#77838b','#535f68'],ceramic:['#d4d6d4','#e4e4df','#aeb7b5'],marble:['#c8c7c3','#e0dfda','#9b9c9b'],concrete:['#8e9797','#a8ada9','#737c7b'],brick:['#a56b58','#bb8271','#d5a18e']};
 const p=palette[key]||palette.concrete;ctx.fillStyle=p[0];ctx.fillRect(0,0,512,512);
 let seed=key.split('').reduce((a,b)=>a+b.charCodeAt(0),0)+13;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<2800;i++){ctx.fillStyle=i%3?'#fff':'#222';ctx.globalAlpha=.007+rnd()*.04;let x=rnd()*512,y=rnd()*512,s=1+rnd()*8;ctx.fillRect(x,y,s,s)}ctx.globalAlpha=1;
 if(key.startsWith('tile')||key==='stone'||key==='brick'){
  const tw=key==='tileSlate'?512:key==='tileSage'||key==='brick'?128:256,th=key==='brick'?64:key==='tileSlate'?256:128;
  for(let y=0,row=0;y<512;y+=th,row++){
   const offset=key.startsWith('tile')?0:row%2?tw/2:0;
   for(let x=-offset;x<512;x+=tw){
    const face=ctx.createLinearGradient(x,y,x+tw,y+th);
    face.addColorStop(0,p[1]);
    face.addColorStop(1,p[2]);
    ctx.globalAlpha=.78+rnd()*.2;
    ctx.fillStyle=face;
    ctx.fillRect(x+1,y+1,tw-2,th-2);
    ctx.globalAlpha=.15;
    ctx.fillStyle='#fff';
    ctx.fillRect(x+2,y+2,tw-4,1);
   }
  }
  ctx.globalAlpha=1;
 }else if(key==='wood'){
  for(let j=0;j<75;j++){let yy=rnd()*512;ctx.strokeStyle=j%3?'#5c3926':'#e0ba85';ctx.globalAlpha=.08+rnd()*.15;ctx.lineWidth=1+rnd()*3;ctx.beginPath();ctx.moveTo(0,yy);ctx.bezierCurveTo(180,yy+12,310,yy-14,512,yy+rnd()*5);ctx.stroke()}ctx.globalAlpha=1;
 }else if(key==='marble'){
  ctx.strokeStyle='#69716e';for(let j=0;j<14;j++){ctx.globalAlpha=.07+rnd()*.12;ctx.lineWidth=.8+rnd()*2;let x=rnd()*512;ctx.beginPath();ctx.moveTo(x,-10);ctx.bezierCurveTo(x+110,180,x-90,330,x+180,525);ctx.stroke()}ctx.globalAlpha=1;
 }
 const texture=new Three.CanvasTexture(canvas);texture.colorSpace=Three.SRGBColorSpace||undefined;texture.encoding=Three.sRGBEncoding;texture.wrapS=texture.wrapT=Three.RepeatWrapping;texture.anisotropy=4;
 materialCache.set(key,texture);return texture;
}
const cutCoordinate=n=>Math.round(n*10000)/10000;
function technicalHoles(o,excludedId=null,pending=[]){
 const result=(o.holes||[]).map(h=>({...h}));
 if(o.kind!=='glass'&&o.kind!=='mirror')return result;
 for(const a of [...model().objects,...pending]){if(a.kind!=='accessory'||a.attachTo!==o.id||!a.technicalSpec||(excludedId instanceof Set?excludedId.has(a.id):a.id===excludedId))continue;
  for(const h of a.technicalSpec.holes||[])result.push({type:'circle',x:cutCoordinate(a.localX+N(h.x)),y:cutCoordinate(a.localY+N(h.y)),r:N(h.r),technicalInstanceId:a.id});
 }
 return result;
}
function technicalCutouts(o,excludedId=null,pending=[]){const result=[];
 for(const a of [...model().objects,...pending]){if(a.kind!=='accessory'||a.attachTo!==o.id||!a.technicalSpec||(excludedId instanceof Set?excludedId.has(a.id):a.id===excludedId))continue;
  for(const poly of a.technicalSpec.cutouts||[])result.push(poly.map(p=>[cutCoordinate(a.localX+N(p[0])),cutCoordinate(a.localY+N(p[1]))]));
 }return result;
}
function panelVector(owner,x,y,z,inverse=false){
 const [ax,ay,az]=['rx','ry','rz'].map(key=>N(owner[key])*Math.PI/180*(inverse?-1:1));
 const rotateX=()=>{[y,z]=[y*Math.cos(ax)-z*Math.sin(ax),y*Math.sin(ax)+z*Math.cos(ax)];};
 const rotateY=()=>{[x,z]=[x*Math.cos(ay)+z*Math.sin(ay),-x*Math.sin(ay)+z*Math.cos(ay)];};
 const rotateZ=()=>{[x,y]=[x*Math.cos(az)-y*Math.sin(az),x*Math.sin(az)+y*Math.cos(az)];};
 if(inverse){rotateX();rotateY();rotateZ();}else{rotateZ();rotateY();rotateX();}
 return [x,y,z];
}
function linkedAccessoryPosition(o){
 const owner=model().objects.find(p=>p.id===o.attachTo);
 if(!owner)return;
 const [x,y,z]=panelVector(owner,o.localX-owner.w/2,o.localY-owner.h/2,owner.d/2);
 o.x=mm(owner.x+x);o.y=mm(owner.y+y);o.z=mm(owner.z+z);
 o.rx=N(owner.rx);o.ry=N(owner.ry);o.rz=N(owner.rz);
}
function moveTechnicalAccessory(o,position,preview=false){
 const owner=model().objects.find(p=>p.id===o.attachTo);
 if(!owner)return 'Lastra di riferimento non disponibile';
 const [x,y]=panelVector(owner,position.x-owner.x,position.y-owner.y,position.z-owner.z,true);
 const edge=o.mountEdge;
 const localX=['left','right'].includes(edge)?o.localX:mm(owner.w/2+x);
 const localY=['bottom','top'].includes(edge)?o.localY:mm(owner.h/2+y);
 const candidate={...o,localX,localY,verticalAnchor:o.localY===localY?o.verticalAnchor:null};
 linkedAccessoryPosition(candidate);
 if(preview){
  const mesh=renderMeshes.get(o.id);
  mesh?.position.set(candidate.x,candidate.y,candidate.z+closedTrackOffset(o));
  return null;
 }
 const error=technicalPatternValid(owner,o.technicalSpec,localX,localY,o.id);
 if(error)return error;
 remember();
 Object.assign(o,candidate);
 return null;
}
function insidePanel(owner,x,y,r=0){const poly=owner.shape||[[0,0],[owner.w,0],[owner.w,owner.h],[0,owner.h]];
 if(x-r<0||x+r>owner.w||y-r<0||y+r>owner.h)return false;
 const inside=(px,py)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>py)!==(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 return [[x-r,y],[x+r,y],[x,y-r],[x,y+r],[x,y]].every(p=>inside(...p));
}
function technicalGlassShape(o,additional=[],excludedId=null,pending=[]){
 const outer=o.shape?.length>=3?o.shape:[[0,0],[o.w,0],[o.w,o.h],[0,o.h]];
 const all=[...technicalCutouts(o,excludedId,pending),...additional];
 if(!all.length)return {outline:outer,voids:[],edgeNotch:false,removedArea:0};
 if(!window.VSGlassCut?.difference)throw Error('Motore di sottrazione dei tagli non caricato');
 return window.VSGlassCut.difference(outer,all);
}
function technicalContourProfile(panel,outline){
 const arcs=[];
 for(const part of model().objects){
  if(part.attachTo!==panel.id)continue;
  for(const path of part.technicalSpec?.exactPaths||[]){
   if(!Array.isArray(path?.points)||!Array.isArray(path.bulges)||path.points.length!==path.bulges.length)continue;
   const points=path.points.map(p=>[cutCoordinate(part.localX+N(p?.[0])),cutCoordinate(part.localY+N(p?.[1]))]);
   for(const [i,bulge] of path.bulges.entries()){
    if(Number.isFinite(bulge)&&Math.abs(bulge)>1e-9)arcs.push({a:points[i],b:points[(i+1)%points.length],bulge});
   }
  }
 }
 return window.VSGeometry.restoreContourArcs(outline,arcs);
}
function technicalPatternValid(owner,spec,x,y,excludedId=null,pending=[]){
 if(!owner)return 'Lastra di riferimento non disponibile';
 if(!Number.isFinite(x)||!Number.isFinite(y))return 'Coordinate non valide';
 if(!spec.holes?.length&&!spec.cutouts?.length&&(x<0||x>owner.w||y<0||y>owner.h))return 'Il punto di fissaggio deve essere entro l’ingombro della lastra';
 const added=(spec.cutouts||[]).map(poly=>poly.map(p=>[cutCoordinate(x+N(p[0])),cutCoordinate(y+N(p[1]))]));
 const existing=technicalHoles(owner,excludedId,pending),newHoles=(spec.holes||[]).map(h=>({x:cutCoordinate(x+N(h.x)),y:cutCoordinate(y+N(h.y)),r:N(h.r)}));
 for(const h of newHoles)if(!(h.r>0)||!insidePanel(owner,h.x,h.y,h.r))return 'Una foratura esce dal vetro: sposta l’accessorio';
 let result;
 try{
  if(spec.edgeNotch){
   const outer=owner.shape?.length>=3?owner.shape:[[0,0],[owner.w,0],[owner.w,owner.h],[0,owner.h]];
   if(!added.length||!window.VSGlassCut.difference(outer,added).edgeNotch)return 'Lo scasso deve aprirsi sul bordo della lastra';
  }
  result=technicalGlassShape(owner,added,excludedId,pending);
 }
 catch(err){return 'Taglio non applicabile: '+err.message}

 const verified=window.VSGeometry.validate(result.outline,[...existing,...newHoles]);
 if(!verified.ok)return 'Conflitto fra le lavorazioni: '+verified.error;
 for(const h of [...existing,...newHoles]){
  const check=window.VSGeometry.validate(result.outline,[h]);
  if(!check.ok)return 'Una foratura tocca uno scasso o il bordo: '+check.error;
  if(result.voids.some(poly=>window.VSGeometry.pointInside([h.x,h.y],poly)))return 'Una foratura coincide con uno scasso';
 }
 // The boolean engine rejects disconnected pieces. The CAD 2D and 3D render from this same derived outline.
 return null;
}
function technicalPlacement(item,x,y,pending=[],excluded=null){
 const owner=model().objects.find(o=>o.id===U.selected&&['glass','mirror'].includes(o.kind));
 if(!owner)return {ok:false,error:'Seleziona prima una lastra'};
 if(owner.curve)return {ok:false,error:'Le lavorazioni su vetro curvo richiedono una scheda dedicata'};
 if(item.status!=='approved')return {ok:false,error:'La scheda tecnica non è stata approvata'};
 if(owner.d<N(item.glass_min)||owner.d>N(item.glass_max))return {ok:false,error:'Spessore vetro non compatibile con la scheda accessorio'};
 const spec=item.cut_spec||{holes:[],cutouts:[]};
 const error=technicalPatternValid(owner,spec,x,y,excluded,pending);
 return error?{ok:false,error}:{ok:true,owner,spec};
}
function orientTechnicalItem(item,edge){
 const transforms={right:([x,y])=>[-x,y],bottom:([x,y])=>[-y,x],top:([x,y])=>[y,-x]};
 const transform=transforms[edge];
 if(!transform)return {...item,mountEdge:edge};
 const spec=item.cut_spec;
 return {...item,mountEdge:edge,cut_spec:{...spec,
  holes:(spec.holes||[]).map(h=>{const [x,y]=transform([N(h.x),N(h.y)]);return {...h,x,y};}),
  cutouts:(spec.cutouts||[]).map(poly=>poly.map(point=>transform(point.map(Number)))),
  exactPaths:spec.exactPaths?.map(path=>({points:path.points.map(point=>transform(point.map(Number))),bulges:path.bulges.map(b=>edge==='right'?-b:b)}))
 }};
}
function orientHardware(T,edge,model){
 const mount=new T.Group();
 mount.add(model);
 if(edge==='right')mount.scale.x=-1;
 if(edge==='bottom')mount.rotation.z=Math.PI/2;
 if(edge==='top')mount.rotation.z=-Math.PI/2;
 return mount;
}
function prepareTechnicalBatch(placements){
 const pending=[];
 const excluded=new Set(placements.map(p=>p.existingId).filter(Boolean));
 if(!placements.length)return {ok:false,error:'Aggiungi almeno una posizione'};
 for(const [index,{item,x,y,existingId,anchor,upgrade}] of placements.entries()){
  const placement=technicalPlacement(item,x,y,pending,excluded);
  if(!placement.ok)return {ok:false,error:'Accessorio '+(index+1)+' · '+placement.error};
  const {owner,spec}=placement;
  const original=existingId?model().objects.find(o=>o.id===existingId&&o.attachTo===owner.id&&o.technicalId===item.id):null;
  if(existingId&&(!original||pending.some(o=>o.existingId===existingId)))return {ok:false,error:'Accessorio da spostare non disponibile'};
  if([...model().objects.filter(o=>!excluded.has(o.id)),...pending].some(o=>o.attachTo===owner.id&&o.technicalId===item.id&&Math.hypot(o.localX-x,o.localY-y)<.1))
   return {ok:false,error:'Accessorio '+(index+1)+' · già presente in questa posizione'};
  pending.push({kind:'accessory',attachTo:owner.id,technicalId:item.id,technicalSpec:spec,localX:x,localY:y,verticalAnchor:anchor||null,item,existingId,upgrade});
 }
 return {ok:true,pending};
}
function placeTechnicalBatch(placements){
 const result=prepareTechnicalBatch(placements);
 if(!result.ok)return result;
 remember();
 const added=result.pending.map(({item,kind,existingId,upgrade,...position})=>{
  const data={
   ...position,accessoryType:item.category,technicalCode:item.code,
   technicalSpec:structuredClone(position.technicalSpec),technicalUpdatedAt:item.updated_at,mountEdge:item.mountEdge,
   technicalUnitPrice:Math.max(0,N(item.price))
  };
  const o=existingId?model().objects.find(o=>o.id===existingId):object(kind,item.name,0,0,0,50,65,35,data);
  if(existingId)Object.assign(o,upgrade?data:{...position,technicalSpec:data.technicalSpec,mountEdge:item.mountEdge});
  linkedAccessoryPosition(o);
  return o;
 });
 model().objects.push(...added.filter(o=>!model().objects.includes(o)));
 refresh(true);
 return {ok:true,id:added[0].id};
}
function placeTechnicalAccessory(item,x,y){return placeTechnicalBatch([{item,x,y}]);}
function curvedShowerGeometry(Three,o){
 const curve=o.curve||{x:-o.w/2,z:-o.d/2,radius:o.trayRadius,start:0,end:90};
 const start=curve.start*Math.PI/180,end=curve.end*Math.PI/180;
 const [cx,,cz]=o.curve?panelVector(o,curve.x-o.x,0,curve.z-o.z,true):[curve.x,0,curve.z];
 const angle=N(o.ry)*Math.PI/180;
 const outer=curve.radius+(o.curve?o.d/2:0),inner=o.curve?curve.radius-o.d/2:0;
 const shape=new Three.Shape();
 for(const [radius,from,to] of [[outer,start,end],[inner,end,start]]){
  for(let i=0;i<=24;i++){
   const theta=from+(to-from)*i/24+angle;
   const x=cx+Math.cos(theta)*radius,y=-(cz+Math.sin(theta)*radius);
   if(radius===outer&&i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
   if(!radius)break;
  }
 }
 shape.closePath();
 const mesh=new Three.ExtrudeGeometry(shape,{depth:o.h,bevelEnabled:false});
 mesh.rotateX(-Math.PI/2);
 mesh.translate(0,-o.h/2,0);
 return mesh;
}
function createMesh(o){
 const Three=T(),glass=['glass','mirror'].includes(o.kind),building=['wall','floor','stair','balcony'].includes(o.kind);let geo;
 if(o.curve||o.trayRadius)geo=curvedShowerGeometry(Three,o);
 else if(glass&&o.shape?.length>=3){
  const profile=new Three.Shape();
  for(const [index,[x,y]] of o.shape.entries()){
   profile[index?'lineTo':'moveTo'](x-o.w/2,y-o.h/2);
  }
  profile.closePath();
  geo=new Three.ExtrudeGeometry(profile,{depth:Math.max(1,o.d),bevelEnabled:false});
  geo.translate(0,0,-o.d/2);
 }
 else geo=new Three.BoxGeometry(Math.max(1,o.w),Math.max(1,o.h),Math.max(1,o.d));
 let material;
 if(glass){material=new Three.MeshPhysicalMaterial({color:o.kind==='mirror'?0xdde6e8:0xb5dfd8,metalness:o.kind==='mirror'?1:0,roughness:o.kind==='mirror'?.095:.045,transmission:o.kind==='mirror'?0:.96,transparent:false,opacity:1,ior:1.5,thickness:Math.max(1,o.d),side:Three.FrontSide,envMapIntensity:1.15,depthWrite:true});
  if(viewMode==='technical'){material.transmission=0;material.transparent=true;material.opacity=.55;material.depthWrite=false}
 }else if(building){
  const source=makeSurfaceTexture(Three,o.finish||'concrete');const surface=o.finish||'concrete';
  const makeFace=(a,b)=>{const t=source.clone();t.needsUpdate=true;t.repeat.set(Math.max(.2,a/650),Math.max(.2,b/650));return new Three.MeshStandardMaterial({map:t,roughness:surface==='marble'?.3:.8,metalness:0,color:0xffffff})};
  material=[makeFace(o.d,o.h),makeFace(o.d,o.h),makeFace(o.w,o.d),makeFace(o.w,o.d),makeFace(o.w,o.h),makeFace(o.w,o.h)];
 }else material=new Three.MeshStandardMaterial({color:o.accessoryType==='borchia'?0x647275:0x323d42,metalness:.83,roughness:.24});
 const mesh=new Three.Mesh(geo,material);mesh.position.set(N(o.x),N(o.y),N(o.z));mesh.rotation.set(N(o.rx)*Math.PI/180,N(o.ry)*Math.PI/180,N(o.rz)*Math.PI/180);mesh.castShadow=!glass;mesh.receiveShadow=true;mesh.userData.studioId=o.id;
 if(glass){const edges=new Three.LineSegments(new Three.EdgesGeometry(geo,12),new Three.LineBasicMaterial({color:viewMode==='technical'?0x217fa1:0x245c58,transparent:true,opacity:viewMode==='technical'?1:.48,depthTest:true}));mesh.add(edges)}
 if(o.kind==='floor'&&o.name==='Piatto doccia'){
  const drain=new Three.Mesh(new Three.CylinderGeometry(34,34,2,32),new Three.MeshStandardMaterial({color:0x798083,metalness:.83,roughness:.34}));
  drain.position.set(0,o.h/2+1,-o.d*.3);
  mesh.add(drain);
 }
 if(o.kind==='stair'){
   const nose=new Three.Mesh(new Three.BoxGeometry(Math.max(20,o.w),7,9),new Three.MeshStandardMaterial({color:0x8a7766,roughness:.5}));nose.position.set(0,o.h/2-7,o.d/2-9);mesh.add(nose);
 }
 if(o.kind==='accessory'){
   const type=o.accessoryType||'borchia';const group=new Three.Group();group.position.copy(mesh.position);group.rotation.copy(mesh.rotation);group.userData.studioId=o.id;
   const metal=new Three.MeshStandardMaterial({color:0x839094,metalness:.86,roughness:.24});
   const add=(g,x,y,z)=>{const m=new Three.Mesh(g,metal);m.position.set(x,y,z);m.castShadow=true;m.userData.studioId=o.id;group.add(m);return m};
   if(type==='borchia'||type==='morsetto'){
     let disc=add(new Three.CylinderGeometry(25,25,9,32),0,0,0);disc.rotation.x=Math.PI/2;
     let cap=add(new Three.CylinderGeometry(14,14,12,32),0,0,11);cap.rotation.x=Math.PI/2;
     let screw=add(new Three.CylinderGeometry(4,4,1,16),0,0,18);screw.rotation.x=Math.PI/2;
   }else if(type==='maniglia'){
     const owner=standardDoorHandleOwner(o);
     const length=Math.max(130,o.h||220);
     if(owner){
      const face=owner.d/2,grip=face+27;
      add(new Three.CylinderGeometry(9,9,length,28),0,0,grip);
      for(const y of [-length*.35,length*.35]){
       add(new Three.CylinderGeometry(6,6,grip+face,20),0,y,(grip-face)/2).rotation.x=Math.PI/2;
       add(new Three.CylinderGeometry(11,11,4,24),0,y,face+2).rotation.x=Math.PI/2;
       add(new Three.CylinderGeometry(10,10,4,24),0,y,-face-2).rotation.x=Math.PI/2;
      }
     }else{
      add(new Three.CylinderGeometry(10,10,length,20),0,0,28);
      for(const y of [-length*.35,length*.35]){
       add(new Three.CylinderGeometry(7,7,36,16),0,y,11).rotation.x=Math.PI/2;
       add(new Three.CylinderGeometry(12,12,5,20),0,y,-7).rotation.x=Math.PI/2;
      }
     }
   }else if(type==='roller'){
     add(new Three.BoxGeometry(26,22,18),0,0,0);
     const wheel=add(new Three.CylinderGeometry(8,8,12,16),0,14,0);
     wheel.rotation.x=Math.PI/2;
   }else if(type==='cerniera'&&o.technicalSpec){
     const glass=glassPanels().find(panel=>panel.id===o.attachTo);
     const thickness=N(glass?.d,8);
     for(const side of [-1,1])add(new Three.BoxGeometry(32,72,5),10,0,side*(thickness/2+2.5));
     add(new Three.BoxGeometry(9,72,thickness+10),-10,0,0);
     add(new Three.BoxGeometry(50,90,4),-19,0,0).rotation.y=Math.PI/2;
   }else if(type==='cerniera'){
     add(new Three.BoxGeometry(35,70,9),-24,0,0);add(new Three.BoxGeometry(35,70,9),24,0,0);add(new Three.CylinderGeometry(6,6,76,20),0,0,9);
   }else if(type==='barra'){add(new Three.CylinderGeometry(10,10,Math.max(o.w,200),24),0,0,0).rotation.z=Math.PI/2;}
   else{group.add(mesh.clone());group.children[0].position.set(0,0,0)}
   if(o.technicalSpec){
    const bounds=new Three.Box3();
    for(const child of group.children){
     child.geometry.computeBoundingBox();
     child.updateMatrix();
     bounds.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrix));
    }
    const hardware=new Three.Group();
    hardware.add(...group.children);
    const owner=glassPanels().find(panel=>panel.id===o.attachTo);
    const clamped=o.accessoryType==='cerniera'&&owner;
    for(const child of hardware.children)child.position.z-=clamped?owner.d/2:bounds.min.z;
    if(clamped)group.userData.hingeFit='reference';
    const mount=orientHardware(Three,o.mountEdge,hardware);
    const [dx,dy]=glassContactOffset(o);
    mount.position.set(dx+N(o.mountX),dy+N(o.mountY),N(o.mountZ));
    group.add(mount);
   }
   return group;
 }
 return mesh;
}
const techGLBCache=new Map(),hingeSlotCache=new WeakMap();
function hardwareContact(mount,box){
 const Three=T(),point=new Three.Vector3();
 const tolerance=Math.min(2,Math.max(.2,(box.max.z-box.min.z)*.04));
 mount.updateMatrixWorld(true);
 const scan=visit=>mount.traverse(mesh=>{
  const vertices=mesh.geometry?.attributes.position;
  if(!vertices)return;
  for(let i=0;i<vertices.count;i++){
   point.fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld);
   if(point.z<=box.min.z+tolerance)visit(point);
  }
 });
 const contact=new Three.Box3();
 scan(p=>contact.expandByPoint(p));
 if(contact.isEmpty())return box.getCenter(new Three.Vector3());
 // In the canonical orientation the glass is on the +X side of edge hardware.
 const midpoint=(contact.min.x+contact.max.x)/2;
 contact.makeEmpty();
 scan(p=>{if(p.x>=midpoint)contact.expandByPoint(p);});
 return contact.getCenter(new Three.Vector3());
}
function glassContactOffset(o){
 const owner=glassPanels().find(panel=>panel.id===o.attachTo);
 const directions={left:[1,0],right:[-1,0],bottom:[0,1],top:[0,-1]};
 const inward=directions[o.mountEdge];
 if(!owner||!inward)return [0,0];
 const outline=owner.shape?.length>=3?owner.shape:[[0,0],[owner.w,0],[owner.w,owner.h],[0,owner.h]];
 const inside=distance=>{
  const p=[o.localX+inward[0]*distance,o.localY+inward[1]*distance];
  return window.VSGeometry.pointInside(p,outline);
 };
 for(let distance=0;distance<=Math.min(160,Math.max(owner.w,owner.h));distance++){
  if(inside(distance)&&inside(distance+2))return inward.map(axis=>axis*(distance+2));
 }
 return [0,0];
}
function findHingeSlot(mount,thickness,autoOrient){
 const Three=T(),raycaster=new Three.Raycaster();
 const direction=new Three.Vector3(0,0,1);
 const materials=new Map();
 mount.traverse(node=>{
  if(!node.isMesh)return;
  for(const material of Array.isArray(node.material)?node.material:[node.material]){
   if(!materials.has(material))materials.set(material,material.side);
   material.side=Three.DoubleSide;
  }
 });
 const base=mount.rotation.y;
 let best=null;
 for(const turn of autoOrient?[0,Math.PI/2,-Math.PI/2,Math.PI]:[0]){
  mount.rotation.y=base+turn;
  mount.updateMatrixWorld(true);
  const box=new Three.Box3().setFromObject(mount),size=box.getSize(new Three.Vector3());
  const gaps=[];
  for(const fx of [.64,.77,.9])for(const fy of [.24,.42,.58,.76]){
   const x=box.min.x+size.x*fx,y=box.min.y+size.y*fy;
   raycaster.set(new Three.Vector3(x,y,box.min.z-1),direction);
   const cuts=[];
   for(const hit of raycaster.intersectObject(mount,true)){
    const z=hit.point.z;
    if(!cuts.length||Math.abs(z-cuts.at(-1))>.05)cuts.push(z);
   }
   for(let i=1;i+1<cuts.length;i+=2){
    const width=cuts[i+1]-cuts[i];
    if(width>=thickness-.2&&width<=thickness+Math.max(4,thickness*.45)){
     gaps.push({x,y,z:(cuts[i]+cuts[i+1])/2});
    }
   }
  }
  for(const sample of gaps){
   const group=gaps.filter(gap=>Math.abs(gap.z-sample.z)<=.8);
   if(group.length<3||group.length<=(best?.score||0))continue;
   const center=new Three.Vector3();
   for(const point of group)center.add(point);
   best={center:center.multiplyScalar(1/group.length),angle:mount.rotation.y,score:group.length};
  }
 }
 for(const [material,side] of materials)material.side=side;
 mount.rotation.y=best?.angle??base;
 return best?.center??null;
}
function cachedHingeSlot(asset,mount,thickness,autoOrient){
 let settings=hingeSlotCache.get(asset);
 if(!settings){settings=new Map();hingeSlotCache.set(asset,settings);}
 const key=[thickness,mount.scale.x,mount.rotation.y,mount.rotation.z,autoOrient].join('/');
 if(!settings.has(key)){
  const center=findHingeSlot(mount,thickness,autoOrient);
  settings.set(key,{center,angle:mount.rotation.y});
 }
 const {center,angle}=settings.get(key);
 mount.rotation.y=angle;
 return center;
}
function gasketHingeSlot(mount,thickness){
 const Three=T(),pads=[];
 const axisNames=['x','y','z'];
 mount.updateMatrixWorld(true);
 mount.traverse(node=>{
  if(!node.isMesh||!/tesnenie|gasket|guarnizione/i.test(node.name))return;
  const box=new Three.Box3().setFromObject(node);
  pads.push({box,size:box.getSize(new Three.Vector3()),center:box.getCenter(new Three.Vector3())});
 });
 if(pads.length!==2)return null;
 const [a,b]=pads;
 const normal=axisNames.reduce((best,axis)=>a.size[axis]<a.size[best]?axis:best);
 const tangents=axisNames.filter(axis=>axis!==normal);
 if(a.size[normal]>5||b.size[normal]>5||tangents.some(axis=>
  Math.abs(a.center[axis]-b.center[axis])>1||Math.abs(a.size[axis]-b.size[axis])>2))return null;
 const vertical=tangents.reduce((best,axis)=>a.size[axis]>a.size[best]?axis:best);
 const inward=tangents.find(axis=>axis!==vertical);
 const [rear,front]=a.center[normal]<b.center[normal]?[a,b]:[b,a];
 const gap=front.box.min[normal]-rear.box.max[normal];
 if(gap<=0)return null;
 const midpoint=a.center.clone().lerp(b.center,.5);
 midpoint[normal]=(front.box.min[normal]+rear.box.max[normal])/2;
 const assembly=new Three.Box3().setFromObject(mount).getCenter(new Three.Vector3());
 const x=new Three.Vector3(),y=new Three.Vector3();
 x[inward]=midpoint[inward]>=assembly[inward]?1:-1;
 y[vertical]=1;
 const z=new Three.Vector3().crossVectors(x,y);
 const rotation=new Three.Matrix4().makeBasis(x,y,z).transpose();
 mount.quaternion.setFromRotationMatrix(rotation);
 return {center:midpoint.applyMatrix4(rotation),fits:Math.abs(gap-thickness)<=.5};
}
async function loadTechnicalGLB(o,placeholder){
 if(!window.THREE?.GLTFLoader||!V?.studio||!o.technicalId)return;
 const key=o.technicalId;
 try{
  if(!techGLBCache.has(key))techGLBCache.set(key,(async()=>{const r=await fetch('/api/technical-accessories/'+key+'/files/glb',{credentials:'same-origin'});if(!r.ok)return null;const bytes=await r.arrayBuffer();return await new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(bytes,'',v=>resolve(v.scene),reject))})());
  const obj=await techGLBCache.get(key);if(!obj||!placeholder.parent||!V?.studio)return;
  const child=obj.clone(true);
  const mount=new THREE.Group();
  mount.add(child);
  mount.rotation.set(0,THREE.MathUtils.degToRad(N(o.mountYaw)),THREE.MathUtils.degToRad(N(o.mountSpin)));
  mount.scale.setScalar(N(o.mountScale,100)/100);
  child.traverse(mesh=>{
   if(!mesh.isMesh)return;
   mesh.geometry=mesh.geometry.clone();
   mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();
   mesh.userData.sharedStudioMaps=true;
   mesh.castShadow=true;
   mesh.receiveShadow=true;
  });
  const owner=glassPanels().find(panel=>panel.id===o.attachTo);
  const hinge=o.accessoryType==='cerniera'&&owner;
  const autoOrient=!Object.hasOwn(o,'mountYaw')&&!Object.hasOwn(o,'mountSpin');
  const gasket=hinge&&autoOrient?gasketHingeSlot(mount,owner.d):null;
  const slot=hinge&&!gasket?cachedHingeSlot(obj,mount,owner.d,autoOrient):null;
  const box=new THREE.Box3().setFromObject(mount);
  const edgeMounted=['left','right','top','bottom'].includes(o.mountEdge);
  const center=gasket?.center||slot||(edgeMounted?hardwareContact(mount,box):box.getCenter(new THREE.Vector3()));
  const depth=hinge?-center.z-owner.d/2:-box.min.z;
  mount.position.set(-center.x,-center.y,depth);
  if(hinge)placeholder.userData.hingeFit=slot||gasket?.fits?'glb':'glb-review';
  const oriented=orientHardware(THREE,o.mountEdge,mount);
  const [dx,dy]=glassContactOffset(o);
  oriented.position.set(dx+N(o.mountX),dy+N(o.mountY),N(o.mountZ));
  placeholder.traverse(mesh=>{mesh.geometry?.dispose();mesh.material?.dispose();});
  placeholder.clear();placeholder.add(oriented);placeholder.traverse(n=>{if(n.isMesh)n.userData.studioId=o.id});updateSlideLimits();highlight();if(U.selected===o.id)renderProps();
 }catch(e){console.warn('GLB accessorio non disponibile:',e)}
}
function disposeModel(group){
 for(const child of [...group.children]){
  group.remove(child);
  child.traverse(node=>{
   node.geometry?.dispose();
   const materials=Array.isArray(node.material)?node.material:[node.material];
   for(const material of materials){
    if(!material)continue;
    if(material.map&&!node.userData.sharedStudioMaps&&material.map!==materialCache.get(material.userData?.surface))material.map.dispose();
    material.dispose();
   }
  });
 }
 renderMeshes.clear();
}
function showerTrackOffset(panel){
 const {category,template}=model().studio;
 if(category!=='doccia'||!['D02','D04'].includes(template)||panel.interiorTrack||!panel.name?.startsWith('Anta'))return 0;
 const fixed=glassPanels().find(o=>o.name==='Lato fisso');
 return fixed?fixed.z-panel.z-(fixed.d+panel.d)/2-6:0;
}
function closedTrackOffset(object){
 const panel=object.kind==='glass'?object:model().objects.find(o=>o.id===object.attachTo)||
  (object.kind==='accessory'&&object.name==='Maniglia'?glassPanels().find(o=>o.name?.startsWith('Anta')&&Math.abs(o.x-object.x)<o.w/2):null);
 return panel?showerTrackOffset(panel):0;
}
const slideLimits=new Map(),hingePlates=new Map();
function legacyHandle(o,panel){
 return ['D02','D03','D04','D05'].includes(model().studio.template)&&o.kind==='accessory'&&o.name==='Maniglia'&&!o.attachTo&&Math.abs(o.x-panel.x)<panel.w/2;
}
function standardDoorHandleOwner(o){
 if(o.accessoryType!=='maniglia'||o.technicalSpec||!['doccia','porta'].includes(model().studio.category))return null;
 return glassPanels().find(panel=>panel.id===o.attachTo||legacyHandle(o,panel));
}
function seatDoorHandle(o){
 const owner=standardDoorHandleOwner(o);
 if(!owner)return;
 const [x,y]=panelVector(owner,o.x-owner.x,o.y-owner.y,o.z-owner.z,true);
 const maxX=Math.max(0,owner.w/2-13),maxY=Math.max(0,owner.h/2-Math.max(130,o.h||220)/2);
 const [px,py,pz]=panelVector(owner,Math.max(-maxX,Math.min(maxX,x)),Math.max(-maxY,Math.min(maxY,y)),0);
 o.x=mm(owner.x+px);o.y=mm(owner.y+py);o.z=mm(owner.z+pz);
 o.rx=N(owner.rx);o.ry=N(owner.ry);o.rz=N(owner.rz);
}
function doorParts(panel){
 return model().objects.filter(o=>o.id===panel.id||o.attachTo===panel.id||legacyHandle(o,panel));
}
function slideDirection(panel,opening){
 return !panel.openingType&&['D02','D04'].includes(model().studio.template)?-1:opening.side;
}
function doorBounds(object,frame){
 const root=renderMeshes.get(object.id);
 if(!root)return [];
 const Three=T(),boxes=[];
 root.updateWorldMatrix(true,true);
 const inverseRoot=root.matrixWorld.clone().invert();
 const pose=new Three.Matrix4().compose(
  new Three.Vector3(object.x,object.y,object.z+closedTrackOffset(object)),
  new Three.Quaternion().setFromEuler(new Three.Euler(...['rx','ry','rz'].map(key=>Three.MathUtils.degToRad(N(object[key]))))),
  root.scale
 );
 const local=frame.clone().multiply(pose).multiply(inverseRoot);
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.geometry.computeBoundingBox();
  boxes.push(mesh.geometry.boundingBox.clone().applyMatrix4(local.clone().multiply(mesh.matrixWorld)));
 });
 return boxes;
}
function curveTravel(panel,opening){
 const curve=panel.curve;
 let limit=curve.end-curve.start-1;
 const clearanceAngle=3/curve.radius*180/Math.PI;
 const bounds=doorParts(panel).filter(o=>o.id!==panel.id).flatMap(o=>doorBounds(o,new (T().Matrix4)()));
 for(const fixed of glassPanels()){
  const arc=fixed.curve;
  if(!arc||arc.x!==curve.x||arc.z!==curve.z||doorOpening(fixed))continue;
  const inner=arc.radius-fixed.d/2,outer=arc.radius+fixed.d/2;
  for(const box of bounds){
   if(box.min.y>=fixed.y+fixed.h/2||box.max.y<=fixed.y-fixed.h/2)continue;
   const x0=box.min.x-arc.x,x1=box.max.x-arc.x,z0=box.min.z-arc.z,z1=box.max.z-arc.z;
   const near=Math.hypot(Math.max(0,x0,-x1),Math.max(0,z0,-z1));
   const far=Math.hypot(Math.max(Math.abs(x0),Math.abs(x1)),Math.max(Math.abs(z0),Math.abs(z1)));
   if(near>=outer||far<=inner)continue;
   const angles=[x0,x1].flatMap(x=>[z0,z1].map(z=>Math.atan2(z,x)*180/Math.PI));
   const gap=opening.side>0?arc.start-Math.max(...angles):Math.min(...angles)-arc.end;
   if(gap>=0)limit=Math.min(limit,Math.max(0,gap-clearanceAngle));
  }
 }
 return limit;
}
function updateSlideLimits(){
 slideLimits.clear();
 const Three=T(),objects=model().objects;
 for(const panel of glassPanels()){
  const opening=doorOpening(panel);
  if(opening?.type==='curve'){slideLimits.set(panel.id,curveTravel(panel,opening));continue;}
  if(opening?.type!=='slide')continue;
  const direction=slideDirection(panel,opening),clearance=3;
  let limit=panel.slideTravel??panel.w*.92;
  const frame=new Three.Matrix4().makeRotationFromEuler(new Three.Euler(...['rx','ry','rz'].map(key=>Three.MathUtils.degToRad(N(panel[key])))));
  frame.setPosition(panel.x,panel.y,panel.z+closedTrackOffset(panel)).invert();
  const parts=doorParts(panel);
  const moving=parts.flatMap(o=>doorBounds(o,frame));
  const blockers=objects.filter(o=>!parts.includes(o)&&['wall','glass','mirror','profile','accessory'].includes(o.kind)).flatMap(o=>doorBounds(o,frame));
  for(const part of moving)for(const fixed of blockers){
   if(part.min.y>=fixed.max.y||part.max.y<=fixed.min.y||part.min.z>=fixed.max.z||part.max.z<=fixed.min.z)continue;
   const gap=direction>0?fixed.min.x-part.max.x:part.min.x-fixed.max.x;
   if(gap>=-.1)limit=Math.min(limit,Math.max(0,gap-clearance));
  }
  slideLimits.set(panel.id,limit);
 }
}
function doorHingePivot(panel,side){
 const [x,y,z]=panelVector(panel,side*panel.w/2,0,panel.d/2+5);
 return new (T().Vector3)(panel.x+x,panel.y+y,panel.z+z);
}
function addDoorHinges(panel,side,group){
 const Three=T(),plates=[];
 const finish=new Three.MeshStandardMaterial({color:0x68777b,metalness:.88,roughness:.25});
 const o=doorHingePivot(panel,side);
 const returnGlass=glassPanels().some(other=>{
  if(other.id===panel.id||other.curve)return false;
  const perpendicular=Math.abs(Math.sin((N(other.ry)-N(panel.ry))*Math.PI/180))>.95;
  if(!perpendicular)return false;
  const [x,,z]=panelVector(other,o.x-other.x,0,o.z-other.z,true);
  return Math.abs(z)<25&&Math.abs(x)<other.w/2+28;
 });
 for(const y of [-panel.h*.34,panel.h*.34]){
  const hinge=new Three.Group();
  const [dx,dy,dz]=panelVector(panel,0,y,0);
  hinge.position.set(o.x+dx,o.y+dy,o.z+dz);
  hinge.rotation.set(...['rx','ry','rz'].map(key=>Three.MathUtils.degToRad(N(panel[key]))));
  const box=(w,h,d,x,z)=>{
   const part=new Three.Mesh(new Three.BoxGeometry(w,h,d),finish);
   part.position.set(x,0,z);part.castShadow=true;hinge.add(part);return part;
  };
  const fixed=returnGlass?box(31,52,8,side*6,-17):box(25,52,10,side*17,-3);
  if(returnGlass)fixed.rotation.y=Math.PI/2;
  const mobile=box(31,52,8,-side*20,-3);
  const pin=new Three.Mesh(new Three.CylinderGeometry(6,6,60,20),finish);
  hinge.add(pin);
  plates.push({hinge,mobile,x:mobile.position.x,z:mobile.position.z});
  group.add(hinge);
 }
 hingePlates.set(panel.id,plates);
}
function drawScene(){
 if(!V?.studio)return;
 const group=V.group;
 disposeModel(group);
 hingePlates.clear();
 const objects=model().objects;
 for(const o of objects){
  if(o.technicalSpec)linkedAccessoryPosition(o);
  if(o.accessoryType==='maniglia')seatDoorHandle(o);
  const mesh=createMesh(o);
  mesh.position.z+=closedTrackOffset(o);
  group.add(mesh);renderMeshes.set(o.id,mesh);
  if(o.technicalId)loadTechnicalGLB(o,mesh);
 }
 if(['doccia','porta'].includes(model().studio.category)){
  for(const panel of glassPanels()){
   const opening=doorOpening(panel);
   if(opening?.type==='swing'&&!objects.some(o=>o.attachTo===panel.id&&o.accessoryType==='cerniera'))
    addDoorHinges(panel,opening.side,group);
  }
 }
 updateSlideLimits();
 highlight();
}
function doorOpening(panel){
 if(panel.kind!=='glass')return null;
 if(panel.openingType==='fixed')return null;
 if(['swing','slide','fold','curve'].includes(panel.openingType))return {type:panel.openingType,side:panel.openingSide===1?1:-1};
 const {category,template}=model().studio;
 const door=panel.name?.startsWith('Anta');
 if(!door)return null;
 if(category==='doccia'&&['D02','D03','D04','D05'].includes(template))
  return {type:['D02','D04'].includes(template)?'slide':'swing',side:panel.openingSide??1};
 if(category==='porta'&&['O01','O02','O03','O04'].includes(template))
  return {type:['O03','O04'].includes(template)?'slide':'swing',side:panel.openingSide??(['O02','O04'].includes(template)&&panel.x>0?1:-1)};
 return null;
}
function toggleDoor(id){
 let panel=model().objects.find(o=>o.id===id);
 if(panel?.foldRoot)panel=model().objects.find(o=>o.id===panel.foldRoot);
 if(!panel||!doorOpening(panel))return;
 id=panel.id;
 const preview=doorPreviews.get(id)||{value:0,target:0};
 preview.target=preview.target?0:1;
 doorPreviews.set(id,preview);
 renderProps();
}
function setHingeSide(id,side){
 const panel=glassPanels().find(o=>o.id===id);
 const opening=panel&&doorOpening(panel);
 if(opening?.type!=='swing'||![-1,1].includes(side)||side===opening.side)return;
 const hardware=doorParts(panel).filter(o=>o.id!==id&&['cerniera','maniglia'].includes(o.accessoryType));
 const before=hardware.map(o=>structuredClone(o));
 for(const o of hardware){
  if(o.technicalSpec){
   o.localX=mm(panel.w-o.localX);
   o.technicalSpec=orientTechnicalItem({cut_spec:o.technicalSpec},'right').cut_spec;
   o.mountEdge=o.mountEdge==='right'?'left':'right';
   o.mountX=-N(o.mountX);
   linkedAccessoryPosition(o);
  }else{
   const [x,y,z]=panelVector(panel,o.x-panel.x,o.y-panel.y,o.z-panel.z,true);
   const [dx,dy,dz]=panelVector(panel,-x,y,z);
   o.x=mm(panel.x+dx);o.y=mm(panel.y+dy);o.z=mm(panel.z+dz);
  }
 }
 const conflict=hardware.find(o=>o.technicalSpec&&technicalPatternValid(panel,o.technicalSpec,o.localX,o.localY,o.id));
 const after=hardware.map(o=>structuredClone(o));
 hardware.forEach((o,i)=>{for(const key of Object.keys(o))if(!Object.hasOwn(before[i],key))delete o[key];Object.assign(o,before[i]);});
 if(conflict){
  renderProps();
  return toast('Cambio lato bloccato: le lavorazioni della ferramenta specchiata entrano in conflitto');
 }
 remember();
 hardware.forEach((o,i)=>Object.assign(o,after[i]));
 panel.openingSide=side;
 doorPreviews.delete(id);
 refresh(true);
}
function setOpening(id,key,value){
 const panel=model().objects.find(o=>o.id===id&&o.kind==='glass');
 if(!panel)return;
 remember();
 panel[key]=value;
 doorPreviews.delete(id);
 refresh(true);
}
function previewDoors(dt){
 if(!doorPreviews.size)return;
 const Three=T(),objects=model().objects;
 for(const [id,state] of doorPreviews){
  const panel=objects.find(o=>o.id===id);
  const opening=panel&&doorOpening(panel);
  if(!opening){doorPreviews.delete(id);continue;}
  state.value=state.target===1?Math.min(1,state.value+dt):Math.max(0,state.value-dt);
  const progress=state.value*state.value*(3-2*state.value);
  const position=new Three.Vector3(panel.x,panel.y,panel.z);
  const angle=new Three.Euler(...['rx','ry','rz'].map(key=>Three.MathUtils.degToRad(N(panel[key]))));
  const side=new Three.Vector3(1,0,0).applyEuler(angle);
  const pivot=hingePlates.has(id)?doorHingePivot(panel,opening.side):position.clone().addScaledVector(side,opening.side*panel.w/2);
  const rotation=new Three.Quaternion().setFromAxisAngle(new Three.Vector3(0,1,0).applyEuler(angle),opening.side*progress*Math.PI*.43);
  const shift=side.clone().multiplyScalar(slideDirection(panel,opening)*(slideLimits.get(id)??panel.slideTravel??panel.w*.92)*progress);
  const hingeAngle=opening.side*progress*Math.PI*.43;
  for(const {mobile,x,z} of hingePlates.get(id)||[]){
   mobile.position.set(x*Math.cos(hingeAngle)+z*Math.sin(hingeAngle),0,-x*Math.sin(hingeAngle)+z*Math.cos(hingeAngle));
   mobile.rotation.y=hingeAngle;
  }
  if(opening.type==='curve'){
   pivot.set(panel.curve.x,panel.y,panel.curve.z);
   rotation.setFromAxisAngle(new Three.Vector3(0,1,0),-opening.side*progress*Three.MathUtils.degToRad(slideLimits.get(id)??panel.curve.end-panel.curve.start-1));
  }
  const partner=opening.type==='fold'?objects.find(o=>o.id===panel.foldPartner):null;
  const foldRotation=new Three.Quaternion().setFromAxisAngle(new Three.Vector3(0,1,0).applyEuler(angle),-opening.side*progress*Math.PI*.43);
  const joint=pivot.clone().addScaledVector(side,panel.foldSpan||0);
  const foldedJoint=joint.clone().sub(pivot).applyQuaternion(rotation).add(pivot);
  for(const o of objects){
   const oldShowerHandle=legacyHandle(o,panel);
   const secondary=partner&&(o.id===partner.id||o.attachTo===partner.id);
   if(o.id!==id&&o.attachTo!==id&&!oldShowerHandle&&!secondary)continue;
   const mesh=renderMeshes.get(o.id);
   if(!mesh)continue;
   mesh.position.set(N(o.x),N(o.y),N(o.z)+closedTrackOffset(o));
   mesh.rotation.set(...['rx','ry','rz'].map(key=>Three.MathUtils.degToRad(N(o[key]))));
   if(opening.type==='slide')mesh.position.add(shift);
   else if(secondary){
    mesh.position.sub(joint).applyQuaternion(foldRotation).add(foldedJoint);
    mesh.quaternion.premultiply(foldRotation);
   }else{
    mesh.position.sub(pivot).applyQuaternion(rotation).add(pivot);
    mesh.quaternion.premultiply(rotation);
   }
  }
  if(!state.value&&!state.target)doorPreviews.delete(id);
 }
}
function highlight(){for(const [id,node] of renderMeshes){node.traverse(v=>{if(v.isMesh&&v.material?.emissive){v.material.emissive.setHex(id===U.selected?0x13798b:0);v.material.emissiveIntensity=id===U.selected?.24:0}})}}
function positionCamera(){if(!V?.studio)return;const target=orbit.target||new (T().Vector3)(0,1000,0);let camera=V.camera;camera.position.set(target.x+orbit.dist*Math.sin(orbit.az)*Math.cos(orbit.el),target.y+orbit.dist*Math.sin(orbit.el),target.z+orbit.dist*Math.cos(orbit.az)*Math.cos(orbit.el));camera.lookAt(target);camera.updateMatrixWorld()}
function frameModel(){
 if(!V?.studio)return;
 const Three=T(),bounds=new Three.Box3().setFromObject(V.group);
 if(bounds.isEmpty())return;
 orbit.target=bounds.getCenter(new Three.Vector3());
 const sphere=bounds.getBoundingSphere(new Three.Sphere());
 const vertical=Three.MathUtils.degToRad(V.camera.fov/2);
 const horizontal=Math.atan(Math.tan(vertical)*Math.max(.15,V.camera.aspect));
 orbit.dist=Math.max(600,sphere.radius/Math.sin(Math.min(vertical,horizontal))*1.12);
 const span=Math.max(sphere.radius,750);
 V.floor.position.set(orbit.target.x,bounds.min.y-.5,orbit.target.z);
 V.floor.scale.setScalar(Math.max(span*30,30000));
 V.backdrop.position.set(orbit.target.x,bounds.min.y+span*3,orbit.target.z-span*3);
 V.backdrop.scale.set(12*span,6*span,1);
 V.sun.target.position.copy(orbit.target);
 V.sun.position.copy(orbit.target).add(new Three.Vector3(1.5,2.4,1.2).multiplyScalar(span));
 Object.assign(V.sun.shadow.camera,{left:-span*1.5,right:span*1.5,top:span*1.5,bottom:-span*1.5,far:span*7});
 V.sun.shadow.camera.updateProjectionMatrix();
 positionCamera();
}
function disposeStudio(){
 doorPreviews.clear();
 hingePlates.clear();slideLimits.clear();
 if(!V?.studio)return;
 disposeModel(V.group);
 V.environment.dispose();
 V.floor.geometry.dispose();
 V.floor.material.dispose();
 V.backdrop.geometry.dispose();
 V.backdrop.material.map.dispose();
 V.backdrop.material.dispose();
 V.sun.shadow.map?.dispose();
 V.renderer.dispose();
 renderMeshes.clear();
 V=null;
}
function studioEnvironment(renderer,Three){
 const scene=new Three.Scene();
 scene.background=new Three.Color(0xc4cbd0);
 const panels=[
  {size:[4,6],position:[-4,2,3],intensity:3.3},
  {size:[2.6,5],position:[4,1,-3],intensity:2.2},
  {size:[5,3],position:[0,5,0],intensity:2.8},
  {size:[2,3],position:[2,1,5],intensity:1.25},
 ];
 for(const {size,position,intensity} of panels){
  const panel=new Three.Mesh(new Three.PlaneGeometry(...size),new Three.MeshBasicMaterial({color:new Three.Color(intensity,intensity,intensity)}));
  panel.position.set(...position);
  panel.lookAt(0,0,0);
  scene.add(panel);
 }
 const generator=new Three.PMREMGenerator(renderer);
 const environment=generator.fromScene(scene,.05);
 generator.dispose();
 for(const panel of scene.children){panel.geometry.dispose();panel.material.dispose();}
 return environment;
}
function studioBackdrop(Three){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 const base=ctx.createLinearGradient(0,230,255,35);
 base.addColorStop(0,'#a1adb6');
 base.addColorStop(1,'#e6e8e6');
 ctx.fillStyle=base;
 ctx.fillRect(0,0,256,256);
 const windowLight=ctx.createRadialGradient(137,130,5,137,130,90);
 windowLight.addColorStop(0,'rgba(255,250,233,0.6)');
 windowLight.addColorStop(1,'rgba(255,250,233,0)');
 ctx.fillStyle=windowLight;
 ctx.fillRect(0,0,256,256);
 const map=new Three.CanvasTexture(canvas);
 map.encoding=Three.sRGBEncoding;
 return new Three.Mesh(new Three.PlaneGeometry(1,1),new Three.MeshBasicMaterial({map}));
}
function initStudio(){
 if(!T())return toast('Three.js non caricato');
 const canvas=$id('canvas3d');
 if(!canvas)return;
 disposeStudio();
 const Three=T();
 const renderer=new Three.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=Three.PCFSoftShadowMap;
 renderer.outputEncoding=Three.sRGBEncoding;
 renderer.toneMapping=Three.ACESFilmicToneMapping;
 renderer.toneMappingExposure=.9;
 const scene=new Three.Scene();
 scene.background=new Three.Color('#dce3e7');
 const environment=studioEnvironment(renderer,Three);
 scene.environment=environment.texture;
 const camera=new Three.PerspectiveCamera(38,canvas.clientWidth/Math.max(1,canvas.clientHeight),1,200000);
 scene.add(new Three.HemisphereLight(0xf5fbff,0xb5b6b1,.7));
 const sun=new Three.DirectionalLight(0xfff6ec,1.15);
 sun.position.set(3200,5200,2500);
 sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 sun.shadow.normalBias=2;
 sun.shadow.radius=3;
 scene.add(sun,sun.target);
 const floor=new Three.Mesh(new Three.PlaneGeometry(1,1),new Three.MeshStandardMaterial({color:0xa6b0b6,roughness:.64,envMapIntensity:.32}));
 floor.rotation.x=-Math.PI/2;
 floor.receiveShadow=true;
 scene.add(floor);
 const backdrop=studioBackdrop(Three);
 scene.add(backdrop);
 const group=new Three.Group();
 scene.add(group);
 V={studio:true,renderer,scene,camera,group,environment,floor,backdrop,sun};
 U.cat=model().studio.category in catalog?model().studio.category:'doccia';
 renderSidebar();renderProps();updatePricing();saveState();drawScene();frameModel();
 const ray=new Three.Raycaster(),mouse=new Three.Vector2();let drag=null;
 function pick(event){
  const rect=canvas.getBoundingClientRect();
  mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  ray.setFromCamera(mouse,camera);
  const objects=model().objects;
  let glass=null;
  for(const hit of ray.intersectObjects(group.children,true)){
   if(!hit.object.isMesh)continue;
   const id=hit.object.userData?.studioId||hit.object.parent?.userData?.studioId;
   const object=objects.find(entry=>entry.id===id);
   if(!object)continue;
   if(object.kind==='glass'){glass??=id;continue;}
   // Glass leaves are transparent. Allow selection of mounted hardware behind them.
   if(object.kind==='accessory'&&object.attachTo)return id;
   return glass??id;
  }
  return glass;
 }

 // Drag diretto: oggetto con clic, Alt+drag orbita; Shift+drag sposta sul piano XZ.
 const worldScale=()=>2*orbit.dist*Math.tan(camera.fov*Math.PI/360)/Math.max(250,canvas.clientHeight);
 function magnetic(moved){if(!U.snap)return;const threshold=65;let best={x:null,y:null,z:null};for(const q of model().objects){if(q.id===moved.id)continue;for(const axis of ['x','y','z']){const size=axis==='x'?'w':axis==='y'?'h':'d',a=moved[size]/2,b=q[size]/2;let options=[q[axis],q[axis]+a+b,q[axis]-a-b,q[axis]+b-a,q[axis]-b+a];for(const v of options){let d=Math.abs(moved[axis]-v);if(d<=threshold&&(!best[axis]||d<best[axis].d))best[axis]={v,d}}}}for(const axis of ['x','y','z'])if(best[axis])moved[axis]=mm(best[axis].v)}
 canvas.addEventListener('pointerdown',e=>{const id=pick(e),o=model().objects.find(x=>x.id===id);drag={x:e.clientX,y:e.clientY,az:orbit.az,el:orbit.el,id,mode:e.altKey||doorPreviews.size||o?.curve||o?.trayRadius?'orbit':id?'move':'orbit',start:o?{x:o.x,y:o.y,z:o.z}:null,shift:e.shiftKey,moved:false,recorded:false};if(id){U.selected=id;renderProps();renderSidebar();highlight()}canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<3&&!drag.moved)return;drag.moved=true;if(drag.mode==='move'&&drag.start){const o=model().objects.find(v=>v.id===drag.id);if(!o)return;if(!drag.recorded&&!o.technicalSpec){remember();drag.recorded=true}if(o.technicalSpec){
  const Three=T(),mesh=renderMeshes.get(o.id),selected=model().objects.find(v=>v.id===o.attachTo);
  if(!mesh||!selected)return;
  const panelMesh=renderMeshes.get(selected.id);
  if(!panelMesh)return;
  const rect=canvas.getBoundingClientRect();
  const intersection=(clientX,clientY)=>{
   mouse.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
   ray.setFromCamera(mouse,camera);
   const normal=new Three.Vector3(0,0,1).applyQuaternion(panelMesh.quaternion);
   const plane=new Three.Plane().setFromNormalAndCoplanarPoint(normal,new Three.Vector3(drag.start.x,drag.start.y,drag.start.z+closedTrackOffset(o)));
   return ray.ray.intersectPlane(plane,new Three.Vector3());
  };
  const start=intersection(drag.x,drag.y),end=intersection(e.clientX,e.clientY);
  if(start&&end){
   const delta=end.sub(start);
   drag.technicalPosition={x:drag.start.x+delta.x,y:drag.start.y+delta.y,z:drag.start.z+delta.z};
   moveTechnicalAccessory(o,drag.technicalPosition,true);
  }
  return;
 }
 const step=worldScale();const right=new Three.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new Three.Vector3().setFromMatrixColumn(camera.matrixWorld,1);if(drag.shift){o.x=mm(drag.start.x+right.x*dx*step-up.x*dy*step);o.z=mm(drag.start.z+right.z*dx*step-up.z*dy*step)}else{o.x=mm(drag.start.x+(right.x*dx-up.x*dy)*step);o.y=mm(drag.start.y+(right.y*dx-up.y*dy)*step);o.z=mm(drag.start.z+(right.z*dx-up.z*dy)*step)}
 drawScene();
 }else{orbit.az=drag.az-dx*.006;orbit.el=Math.max(-1.4,Math.min(1.5,drag.el+dy*.005));positionCamera()}});
 canvas.addEventListener('pointerup',event=>{if(drag&&!drag.moved&&!event.altKey){
  const clicked=model().objects.find(o=>o.id===drag.id);
  const door=clicked?.attachTo?model().objects.find(o=>o.id===clicked.attachTo):clicked;
  if(door&&(door.foldRoot||doorOpening(door)))toggleDoor(door.id);
 }
 if(drag?.mode==='move'&&drag.moved){
  const o=model().objects.find(v=>v.id===drag.id);
  if(o?.technicalSpec){
   if(drag.technicalPosition){
    const error=moveTechnicalAccessory(o,drag.technicalPosition);
    if(error)toast(error);
   }
  }else if(o)magnetic(o);
  refresh(true);
 }
 drag=null;
 });
 canvas.addEventListener('pointercancel',()=>{if(drag?.technicalPosition)drawScene();drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();orbit.dist=Math.max(250,Math.min(70000,orbit.dist*(e.deltaY>0?1.1:.9)));positionCamera()},{passive:false});
 let lastFrame=performance.now();
 function tick(now=lastFrame){if(!V?.studio||V.renderer!==renderer||!document.contains(canvas))return;let rect=canvas.parentElement.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}previewDoors(Math.max(0,Math.min(.1,(now-lastFrame)/620)));lastFrame=now;renderer.render(scene,camera);requestAnimationFrame(tick)}tick()}
function select(id){U.selected=id;highlight();renderProps();renderSidebar()}
function add(kind){remember();let data={glass:[1000,1700,10],wall:[1900,2300,150],floor:[2000,90,1500],stair:[950,50,285],balcony:[2600,130,1100],profile:[50,1200,35],mirror:[800,1400,6]}[kind]||[900,1200,10],o=object(kind,{glass:'Lastra',wall:'Muro',floor:'Pavimento',stair:'Gradino',balcony:'Balcone',profile:'Profilo',mirror:'Specchio'}[kind],0,data[1]/2,0,...data);if(['wall','floor','balcony','stair'].includes(kind))o.finish=kind==='stair'?'wood':kind==='floor'?'stone':'concrete';model().objects.push(o);U.selected=o.id;refresh(true)}
function accessory(kind){let owner=model().objects.find(o=>o.id===U.selected&&['glass','mirror'].includes(o.kind));if(!owner)return toast('Seleziona prima un vetro');remember();let o=object('accessory',kind,owner.x+owner.w*.28,owner.y,owner.z+owner.d/2+25,50,kind==='maniglia'?220:65,35,{accessoryType:kind,attachTo:owner.id});model().objects.push(o);U.selected=o.id;refresh(true)}
function resizeTechnicalAnchors(panel){
 const changed=model().objects.filter(o=>o.attachTo===panel.id&&o.technicalSpec&&o.verticalAnchor);
 if(!changed.length)return null;
 const excluded=new Set(changed.map(o=>o.id));
 const pending=[];
 for(const o of changed){
  const ref=o.verticalAnchor;
  if(ref.edge==='uniform'&&panel.h<=ref.top+ref.bottom)return 'La lastra è troppo bassa per mantenere le distanze dai bordi';
  const y=ref.edge==='uniform'?ref.bottom+(panel.h-ref.bottom-ref.top)*ref.fraction:ref.edge==='top'?panel.h-ref.distance:ref.distance;
  if(y<0||y>panel.h)return 'Una quota della ferramenta supera l’altezza della lastra';
  const error=technicalPatternValid(panel,o.technicalSpec,o.localX,y,excluded,pending);
  if(error)return o.name+' · '+error;
  pending.push({...o,id:null,sourceId:o.id,localY:cutCoordinate(y)});
 }
 for(const candidate of pending)model().objects.find(o=>o.id===candidate.sourceId).localY=candidate.localY;
 return null;
}
function edit(id,key,val){
 const o=model().objects.find(o=>o.id===id);if(!o)return;
 if((o.curve||o.trayRadius)&&['w','h','d','x','y','z','rx','ry','rz'].includes(key))return toast('Modifica le misure partendo dal modello semicircolare');
 const value=key==='name'?val:N(val),oldValue=o[key];
 if(key!=='name'&&!Number.isFinite(value))return toast('Valore numerico non valido');
 if(key==='mountScale'&&(value<.1||value>100000))return toast('La scala GLB deve essere tra 0,1% e 100000%');
 if(['w','h','d'].includes(key)&&value<=0)return toast('La dimensione deve essere maggiore di zero');
 if(key==='name'&&(!value||!String(value).trim()))return toast('Inserisci un nome valido');
 if(o.technicalSpec&&['x','y','z'].includes(key)){
  const error=moveTechnicalAccessory(o,{...o,[key]:value});
  refresh(true);
  if(error)toast(error);
  return;
 }
 const originalHeight=key==='h'?structuredClone(o):null;
 remember();o[key]=value;
 if((key==='w'||key==='h')&&o.shape?.length>=3){
  const idx=key==='w'?0:1,ratio=value/Math.max(1,oldValue);
  o.shape=o.shape.map(p=>p.map((v,i)=>i===idx?mm(v*ratio):v));
  if(o.cadProfile?.points){
   o.cadProfile.points=o.cadProfile.points.map(p=>p.map((v,i)=>i===idx?mm(v*ratio):v));
   const sampled=window.VSGeometry.tessellateProfile(o.cadProfile.points,o.cadProfile.bulges||[],.35);
   const check=window.VSGeometry.validate(sampled,o.holes||[]);
   if(check.ok)o.shape=sampled;else delete o.cadProfile;
  }
  o.holes=(o.holes||[]).map(h=>({...h,[idx===0?'x':'y']:mm(h[idx===0?'x':'y']*ratio)}));
 }
 if(originalHeight&&['glass','mirror'].includes(o.kind)){
  const error=resizeTechnicalAnchors(o);
  if(error){Object.assign(o,originalHeight);U.undo.pop();refresh(true);return toast(error);}
 }
 if(['x','y','z'].includes(key)&&['glass','mirror'].includes(o.kind))for(const item of model().objects){if(item.attachTo===o.id)item[key]=mm(N(item[key])+(value-N(oldValue)))}
 refresh(true);
 return true;
}
function duplicate(){let o=model().objects.find(o=>o.id===U.selected);if(!o)return;if(o.technicalSpec)return toast('Per duplicare una lavorazione tecnica, seleziona la lastra e inserisci una nuova istanza dalla libreria');remember();let copy=structuredClone(o);copy.id=uid();copy.x+=140;copy.name+=' (copia)';model().objects.push(copy);U.selected=copy.id;refresh(true)}
function remove(){if(!U.selected)return;remember();model().objects=model().objects.filter(o=>o.id!==U.selected&&o.attachTo!==U.selected);U.selected=null;refresh(true)}
function applyModernScene(){remember();for(const o of model().objects){if(o.kind==='wall')o.finish='concrete';if(['floor','balcony'].includes(o.kind))o.finish='stone';if(o.kind==='stair')o.finish='wood'}refresh(true)}
function finish(f){let o=model().objects.find(o=>o.id===U.selected);if(!o||!['wall','floor','stair','balcony'].includes(o.kind))return toast('Seleziona un muro, un pavimento, un balcone o un gradino');remember();o.finish=f;refresh(true)}
function shapeEditor(){
 const panel=selectedPanel()||glassPanels()[0];
 if(!panel)return toast('Aggiungi una lastra per aprire il CAD 2D');
 openCad(panel.id,U.selected===panel.id?null:U.selected);
}
function deliveryRevision(){
 const p=S.current;
 return p?.id&&Number.isInteger(p.revision)&&projectSignature()===savedProjectState?`Revisione ${p.revision}`:'Bozza';
}
function deliveryFilename(){
 return safeFile(S.current.title)+(deliveryRevision()==='Bozza'?'-bozza':'-r'+S.current.revision);
}
function panelDeliveryIssue(panel){
 if(panel.curve)return 'Lastra curva: mancano gli elaborati piani';
 try{
  const shape=technicalGlassShape(panel),holes=technicalHoles(panel);
  const result=window.VSGeometry.validate(shape.outline,holes);
  if(!result.ok)return result.error;
  for(const part of model().objects.filter(o=>o.attachTo===panel.id&&o.technicalSpec)){
   const error=technicalPatternValid(panel,part.technicalSpec,part.localX,part.localY,part.id);
   if(error)return part.name+' · '+error;
  }
 }catch(e){return e.message;}
 return null;
}
let deliveryReview;
function reviewMarkup(review){
 const {panels,format,panelId,library,error}=review;
 const blocked=panels.some(p=>p.issue);
 const label={pdf:'Apri preventivo',workshop:'Scarica scheda',dxf:'Scarica DXF'}[format];
 const revision=deliveryRevision();
 const cards=panels.map(({panel,index,parts,issue})=>`<section class="panel">
 <strong>Lastra ${index+1} · ${esc(panel.name)}</strong>
 <p>${panel.w} × ${panel.h} × ${panel.d} mm · ${technicalHoles(panel).length} forature/asole · ${parts.reduce((n,p)=>n+(p.technicalSpec.cutouts?.length||0),0)} scassi</p>
 ${issue?`<p class="danger">${esc(issue)}</p>`:''}
 ${parts.length?`<ul>${parts.map(part=>{
  const row=library?.find(o=>o.id===part.technicalId);
  const compare=row?.status==='approved';
  const newer=compare&&row.updated_at!==part.technicalUpdatedAt;
  const key=review.parts.indexOf(part.id);
  return `<li>${esc(part.technicalCode||part.name)} · Y ${N(part.localY)} mm
   <button class="btn" onclick="VS.reviewInspect(${index},${key})">Apri in 2D</button>
   ${library&&!row?'<span class="small">Scheda non disponibile</span>':row?.status==='draft'?'<span class="small">Scheda in bozza</span>':compare?`<button class="btn" onclick="VS.compareFitting(${key})">${newer?'Confronta revisione':'Confronta scheda'}</button>`:''}</li>`;
 }).join('')}</ul>`:''}
 <button class="btn" onclick="VS.reviewInspect(${index})" ${panel.curve?'disabled':''}>Controlla lastra in 2D</button>
 </section>`).join('');
 return `<div class="vsDelivery"><h3>Controllo commessa</h3><p>${esc(revision)}${revision==='Bozza'?' · Salva la commessa per assegnare la revisione.':''}</p>
 ${error?`<p class="small">${esc(error)}</p>`:!library&&review.parts.length?'<p class="small">Verifica Libreria tecnica in corso…</p>':''}
 ${cards}
 <div class="actions">
 ${revision==='Bozza'?'<button class="btn" onclick="VS.saveDelivery()">Salva revisione</button>':''}
 ${label?`<button class="btn primary" onclick="VS.finishDelivery()" ${blocked&&format!=='pdf'?'disabled':''}>${label}</button>`:`<button class="btn primary" onclick="VS.reviewDelivery('workshop')">Scheda lavorazioni</button><button class="btn" onclick="VS.reviewDelivery('dxf')">DXF commessa</button>`}
 </div></div>`;
}
async function reviewDelivery(format=null,panelId){
 const panels=glassPanels().map((panel,index)=>({panel,index})).filter(o=>!panelId||o.panel.id===panelId);
 if(!panels.length&&format!=='pdf')return toast('Nessuna lastra da controllare');
 for(const item of panels){
  item.parts=model().objects.filter(o=>o.attachTo===item.panel.id&&o.technicalSpec);
  item.issue=panelDeliveryIssue(item.panel);
 }
 const review={format,panelId,panels,parts:panels.flatMap(o=>o.parts.map(p=>p.id)),signature:projectSignature()};
 deliveryReview=review;
 openModal(reviewMarkup(review));
 if(!review.parts.length)return;
 try{review.library=(await api('/technical-accessories')).items||[];}
 catch{review.error='La Libreria tecnica non è disponibile per il confronto.';}
 const root=$id('modal');
 if(deliveryReview===review&&!root.classList.contains('hidden')&&root.querySelector('.vsDelivery')&&!root.querySelector('[data-fitting-compare]'))
  openModal(reviewMarkup(review));
}
function patternSummary(spec){
 const points=(spec.cutouts||[]).flat();
 const dims=spec.sourceDimensions;
 const format=(n)=>Number(n.toFixed(3));
 const extents=points.length?[0,1].map(axis=>format(Math.max(...points.map(p=>p[axis]))-Math.min(...points.map(p=>p[axis])))):null;
 const measurements=dims?` · Ø ${dims.diameter} · Interasse ${dims.centerSpacing} · Apertura ${dims.opening} · Profondità ${dims.notchDepth} mm`:extents?` · Ingombro tagli ${extents.join(' × ')} mm`:'';
 return `${spec.holes?.length||0} fori · ${spec.cutouts?.length||0} scassi${measurements}`;
}
async function compareFitting(index){
 const review=deliveryReview;
 const mounted=model().objects.find(o=>o.id===review?.parts[index]);
 if(!mounted)return;
 try{
  const {item}=await api('/technical-accessories/'+encodeURIComponent(mounted.technicalId));
  if(deliveryReview!==review||$id('modal').classList.contains('hidden'))return;
  if(item.status!=='approved')return toast('La nuova scheda deve essere approvata');
  const panel=glassPanels().find(o=>o.id===mounted.attachTo);
  const updated=orientTechnicalItem({...item,cut_spec:JSON.parse(item.cut_spec)},mounted.mountEdge||'free');
  const cuts=updated.cut_spec;
  const edge=mounted.mountEdge;
  const horizontal=['left','right'].includes(edge),vertical=['bottom','top'].includes(edge);
  let {localX:x,localY:y}=mounted;
  if(horizontal||vertical){
   const far=edge==='right'||edge==='top';
   const coords=cuts.cutouts.flat().map(p=>p[horizontal?0:1]);
   const border=coords.length?(far?Math.max(...coords):Math.min(...coords)):0;
   if(horizontal)x=(far?panel.w:0)-border;
   else y=(far?panel.h:0)-border;
  }
  const oldSpec=mounted.technicalSpec;
  const unchanged=JSON.stringify([oldSpec.holes,oldSpec.cutouts,oldSpec.exactPaths])===JSON.stringify([cuts.holes,cuts.cutouts,cuts.exactPaths]);
  review.upgrade={mountedId:mounted.id,updated,x,y};
  openModal(`<div class="vsDelivery" data-fitting-compare><h3>Confronto scheda · ${esc(mounted.name)}</h3>
   <p><strong>In commessa</strong><br>${esc(patternSummary(oldSpec))} · ${eur(mounted.technicalUnitPrice||0)}</p>
   <p><strong>In Libreria tecnica</strong><br>${esc(patternSummary(cuts))} · ${eur(item.price||0)}</p>
   <p>${unchanged?'Geometria coincidente.':'La geometria della nuova scheda è diversa.'}</p>
   <p>Quota proposta · X ${cutCoordinate(x)}, Y ${cutCoordinate(y)} mm</p>
   <div class="actions"><button class="btn" onclick="VS.backToReview()">Torna al controllo</button>
   <button class="btn primary" onclick="VS.applyFittingRevision()">Applica scheda alla commessa</button></div></div>`);
 }catch(e){toast(e.message);}
}
function backToReview(){
 if(deliveryReview)openModal(reviewMarkup(deliveryReview));
}
function applyFittingRevision(){
 const review=deliveryReview;
 if(!review?.upgrade||review.signature!==projectSignature())return;
 const {mountedId,updated,x,y}=review.upgrade;
 const mounted=model().objects.find(o=>o.id===mountedId);
 if(!mounted)return;
 const selection=U.selected;
 U.selected=mounted.attachTo;
 const result=placeTechnicalBatch([{item:updated,x,y,existingId:mounted.id,anchor:mounted.verticalAnchor,upgrade:true}]);
 U.selected=selection;
 if(!result.ok)return toast(result.error);
 techGLBCache.delete(mounted.technicalId);
 refresh(true);
 reviewDelivery(review.format,review.panelId);
}
function reviewInspect(index,fitting){
 const panel=glassPanels()[index];
 if(!panel||panel.curve)return;
 closeModal();
 window.VSCAD2D.close();
 openCad(panel.id,deliveryReview.parts[fitting]);
}
async function saveDelivery(){
 const review=deliveryReview;
 await saveCurrent();
 if(review===deliveryReview)reviewDelivery(review.format,review.panelId);
}
function finishDelivery(){
 const review=deliveryReview;
 if(!review)return;
 if(review.signature!==projectSignature())return reviewDelivery(review.format,review.panelId);
 if(review.format!=='pdf'&&review.panels.some(p=>panelDeliveryIssue(p.panel)))return reviewDelivery(review.format,review.panelId);
 closeModal();
 if(review.format==='dxf')exportDXF(review.panelId);
 if(review.format==='workshop')exportWorkshopSheet();
 if(review.format==='pdf')exportQuote();
}
function downloadDxf(id=selectedPanel()?.id){return reviewDelivery('dxf',id);}

function shapeModal(){
 openModal(`<div class="vsCadHead"><div><h3>Disegno tecnico 2D · Lastra</h3><p class="small">Quote in millimetri. Clicca e trascina un vertice oppure inserisci le coordinate. Doppio clic su un lato per creare un nuovo punto.</p></div></div>
 <div class="vsCadTools"><label>Passo griglia <select id="vsCadGrid" onchange="VS.cadGrid(this.value)"><option value="1">1 mm</option><option value="5">5 mm</option><option value="10" selected>10 mm</option><option value="25">25 mm</option><option value="50">50 mm</option></select></label><label><input id="vsCadSnap" type="checkbox" checked onchange="VS.cadSnap(this.checked)"> Aggancio griglia</label><button class="btn" onclick="VS.cadZoom(1.25)">Zoom +</button><button class="btn" onclick="VS.cadZoom(.8)">Zoom −</button><button class="btn" onclick="VS.cadZoom(0)">Adatta</button></div>
 <div class="vsCadDrawing" id="vsShapePreview"></div><p id="vsCadMessage" class="vsCadStatus" role="status"></p>
 <div class="vsCadTabs"><section><h4>Vertici del contorno</h4><div id="vsShapeFields"></div><button class="btn" onclick="VS.addVertex()">+ Aggiungi vertice</button></section><section><h4>Forature circolari</h4><div id="vsHoleFields"></div><button class="btn" onclick="VS.addHole()">+ Aggiungi foro</button></section></div>
 <div class="vsCadActions"><button class="btn" onclick="VS.shapePreset('rectangle')">Rettangolo</button><button class="btn" onclick="VS.shapePreset('trapezoid')">Trapezio</button><button class="btn" onclick="VS.shapePreset('triangle')">Triangolo</button><button class="btn primary" onclick="VS.applyShape()">Verifica e applica al 3D</button></div>`);
 renderShapeFields();
}
function shapeCheck(){return window.VSGeometry.validate(U.shape.vertices,U.shape.holes)}
function renderShapeFields(){
 const sh=U.shape;if(!sh)return;
 const field=$id('vsShapeFields'),holes=$id('vsHoleFields');if(!field||!holes)return;
 field.innerHTML=sh.vertices.map((p,i)=>`<div class="vsCadField"><b>P${i+1}</b><label>X <input type="number" step="0.1" value="${p[0]}" onchange="VS.vertex(${i},0,this.value)"></label><label>Y <input type="number" step="0.1" value="${p[1]}" onchange="VS.vertex(${i},1,this.value)"></label><button title="Elimina vertice" onclick="VS.removeVertex(${i})">×</button></div>`).join('');
 holes.innerHTML=sh.holes.map((h,i)=>`<div class="vsCadField"><b>F${i+1}</b><label>X <input type="number" step="0.1" value="${h.x}" onchange="VS.hole(${i},'x',this.value)"></label><label>Y <input type="number" step="0.1" value="${h.y}" onchange="VS.hole(${i},'y',this.value)"></label><label>Ø <input type="number" min="0.1" step="0.1" value="${2*h.r}" onchange="VS.hole(${i},'diameter',this.value)"></label><button title="Elimina foro" onclick="VS.removeHole(${i})">×</button></div>`).join('')||'<p class="small">Nessuna foratura</p>';
 drawCadShape();
}
function drawCadShape(){
 const sh=U.shape,target=$id('vsShapePreview');if(!sh||!target)return;
 const pts=sh.vertices,holes=sh.holes,geom=window.VSGeometry;
 const allX=[0,...pts.map(p=>p[0]),...holes.map(h=>h.x-h.r),...holes.map(h=>h.x+h.r)],allY=[0,...pts.map(p=>p[1]),...holes.map(h=>h.y-h.r),...holes.map(h=>h.y+h.r)];
 const minX=Math.min(...allX),maxX=Math.max(...allX),minY=Math.min(...allY),maxY=Math.max(...allY);
 const spanX=Math.max(150,maxX-minX),spanY=Math.max(150,maxY-minY),sc=Math.min(680/spanX,390/spanY)*sh.zoom;
 const midX=(maxX+minX)/2,midY=(maxY+minY)/2;
 const point=p=>[410+(p[0]-midX)*sc,240-(p[1]-midY)*sc];
 const lines=pts.map((p,i)=>{const a=point(p),b=point(pts[(i+1)%pts.length]);return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="transparent" stroke-width="16" data-edge="${i}"/>`}).join('');
 const vertices=pts.map((p,i)=>{const q=point(p);return `<circle data-point="${i}" cx="${q[0]}" cy="${q[1]}" r="7" fill="#fff" stroke="#087b89" stroke-width="2.5"/><text x="${q[0]+10}" y="${q[1]-9}" fill="#184552" font-size="12" pointer-events="none">P${i+1}</text>`}).join('');
 const circles=holes.map((h,i)=>{const q=point([h.x,h.y]);return `<circle cx="${q[0]}" cy="${q[1]}" r="${h.r*sc}" fill="#eaf0f3" stroke="#c76a3d" stroke-width="2"/><path d="M${q[0]-7},${q[1]}h14 M${q[0]},${q[1]-7}v14" stroke="#c76a3d"/><text x="${q[0]+8}" y="${q[1]-10}" fill="#a3542f" font-size="12">Ø${+(2*h.r).toFixed(1)}</text>`}).join('');
 const first=pts.map(p=>point(p).join(',')).join(' ');
 const gr=sh.grid*sc,grid=gr>=10?`<pattern id="vsCadGridPattern" width="${gr}" height="${gr}" patternUnits="userSpaceOnUse" x="${point([0,0])[0]}" y="${point([0,0])[1]}"><path d="M${gr} 0H0V${gr}" fill="none" stroke="#b0c9d2" stroke-width=".65"/></pattern><rect x="0" y="0" width="820" height="480" fill="url(#vsCadGridPattern)"/>`:'';
 target.innerHTML=`<svg id="vsCadSvg" viewBox="0 0 820 480" aria-label="Editor sagoma quotato"><rect width="820" height="480" fill="#eaf0f3"/>${grid}<polygon points="${first}" fill="#86c6d344" stroke="#117a91" stroke-width="2.5"/>${circles}${lines}${vertices}</svg>`;
 const result=geom.validate(pts,holes),status=$id('vsCadMessage');if(status){status.textContent=result.ok?`Sagoma valida · Area netta ${(result.areaMm2/1e6).toFixed(4)} m² · Ingombro ${result.bounds.width.toFixed(1)} × ${result.bounds.height.toFixed(1)} mm`:`Errore: ${result.error}`;status.className='vsCadStatus '+(result.ok?'vsCadOk':'vsCadError')}
 const svg=$id('vsCadSvg');let dragging=null;const toLocal=e=>{const r=svg.getBoundingClientRect();return [(e.clientX-r.left)*820/r.width,(e.clientY-r.top)*480/r.height]};
 const coord=e=>{const q=toLocal(e),x=(q[0]-410)/sc+midX,y=(240-q[1])/sc+midY;let p=[x,y];if(sh.snap){p=p.map(v=>Math.round(v/sh.grid)*sh.grid)}return p.map(v=>Math.round(v*10)/10)};
 svg.addEventListener('pointerdown',e=>{const i=e.target.getAttribute('data-point');if(i!==null){dragging=+i;svg.setPointerCapture(e.pointerId)}});
 svg.addEventListener('pointermove',e=>{if(dragging===null)return;sh.vertices[dragging]=coord(e);drawCadPolygonOnly();});
 svg.addEventListener('pointerup',()=>{if(dragging!==null){dragging=null;renderShapeFields()}});
 svg.addEventListener('pointercancel',()=>{dragging=null;renderShapeFields()});
 svg.addEventListener('dblclick',e=>{const idx=e.target.getAttribute('data-edge');if(idx===null)return;sh.vertices.splice(+idx+1,0,coord(e));renderShapeFields()});
 function drawCadPolygonOnly(){const pol=svg.querySelector('polygon');pol.setAttribute('points',sh.vertices.map(p=>point(p).join(',')).join(' '));const handles=svg.querySelectorAll('[data-point]');handles.forEach((el,i)=>{const q=point(sh.vertices[i]);el.setAttribute('cx',q[0]);el.setAttribute('cy',q[1])});}
}
function applyShape(){
 if(!U.shape)return;const o=model().objects.find(o=>o.id===U.shape.id);if(!o)return;
 const result=window.VSGeometry.normalize(U.shape.vertices,U.shape.holes);
 if(!result.ok){toast('Sagoma non valida: '+result.error);return}
 remember();
 const left=o.x-o.w/2,bottom=o.y-o.h/2;
 o.x=mm(left+result.bounds.minX+result.width/2);o.y=mm(bottom+result.bounds.minY+result.height/2);
 o.w=mm(result.width);o.h=mm(result.height);
 o.shape=result.points;o.holes=result.holes;
 closeModal();refresh(true);toast('Sagoma e forature aggiornate nel modello 3D');
}
function changeSettings(key,v){const studio=model().studio;if(studio.category!=='scala')return;const before=structuredClone(studio.settings),updated={...before,[key]:['fix','side','finish','layout'].includes(key)?v:key==='handrail'?v==='true':N(v)};if(['rise','tread','width','steps','maxPanel','railHeight','thickness'].includes(key)&&updated[key]<=0){toast('Inserisci una misura maggiore di zero');return}if(['steps','layout','width','rise','tread'].includes(key)&&!confirm('Aggiornare la geometria della scala e dei pannelli collegati? Gli oggetti aggiunti manualmente saranno conservati.'))return;remember();studio.settings=updated;const detached=model().objects.filter(o=>o.manual);model().objects=[...runStairs(updated),...detached];U.selected=null;refresh(true);frameModel()}
function updateParamPanel(){const el=$id('vsParams');if(!el)return;const st=model().studio;if(st.category!=='scala'){el.innerHTML='';return}const s=st.settings;el.innerHTML=`<h3 style="margin-top:20px">Configura scala</h3><p class="small">Modifica il modello completo. I valori sono in millimetri.</p><label class="label">Tipo scala</label><select class="field" onchange="VS.changeSettings('layout',this.value)">${[['straight','Dritta'],['L','A L'],['U','A U']].map(([v,l])=>`<option value="${v}" ${s.layout===v?'selected':''}>${l}</option>`).join('')}</select><label class="label">Sistema di fissaggio</label><select class="field" onchange="VS.changeSettings('fix',this.value)">${[['borchie','Borchie laterali'],['profilo','Profilo continuo'],['morsetti','Morsetti'],['montanti','Montanti']].map(([v,l])=>`<option value="${v}" ${s.fix===v?'selected':''}>${l}</option>`).join('')}</select><label class="label">Lato parapetto</label><select class="field" onchange="VS.changeSettings('side',this.value)">${[['right','Destro'],['left','Sinistro'],['both','Entrambi']].map(([v,l])=>`<option value="${v}" ${s.side===v?'selected':''}>${l}</option>`).join('')}</select><label class="label"><input type="checkbox" ${s.handrail?'checked':''} onchange="VS.changeSettings('handrail',String(this.checked))"> Corrimano</label>${[['steps','Numero alzate'],['rise','Alzata mm'],['tread','Pedata mm'],['width','Larghezza mm'],['railHeight','Altezza parapetto mm'],['maxPanel','Larghezza massima lastra mm'],['thickness','Spessore vetro mm']].map(([k,l])=>`<label class="label">${l}</label><input class="field" type="number" min="1" step="1" value="${N(s[k])}" onchange="VS.changeSettings('${k}',this.value)">`).join('')}`}
function navToolbar(){}
function toggleLeft(){document.body.classList.toggle('vsLeftClosed')}
function toggleRight(){document.body.classList.toggle('vsRightClosed')}
function toggleQuote(){document.body.classList.remove('vsRightClosed');$id('vsQuoteDetails').open=!$id('vsQuoteDetails').open}
function cameraPreset(k){const p={iso:[.65,.35],front:[0,0],side:[Math.PI/2,0],top:[0,Math.PI/2-.02]}[k]||[.65,.35];orbit.az=p[0];orbit.el=p[1];positionCamera()}
function switchMode(){viewMode=viewMode==='real'?'technical':'real';$id('vsVisualBtn').textContent=viewMode==='real'?'✦ Realistico':'▦ Tecnico';drawScene()}
function exports(v){if(v==='pdf')reviewDelivery('pdf');if(v==='csv')exportCSV();if(v==='png')exportPNG();if(v==='dxf')reviewDelivery('dxf');if(v==='dxf-panel'){const id=selectedPanel()?.id;if(id)reviewDelivery('dxf',id);else toast('Seleziona una lastra da esportare');}if(v==='workshop')reviewDelivery('workshop');if(v==='gltf')downloadGLTF()}
function bindUI(){renderSidebar();navToolbar();document.querySelectorAll('[data-vstab]').forEach(b=>b.classList.toggle('active',b.dataset.vstab===U.tab))}
function cost(k,v){model()[k]=N(v);updatePricing();saveState();queueAutosave()}
window.VSTechBridge={mounted(ownerId){
 return model().objects.filter(o=>o.attachTo===ownerId&&o.technicalId&&o.technicalSpec).map(o=>({
  existingId:o.id,x:o.localX,y:o.localY,anchor:o.verticalAnchor,item:{id:o.technicalId,name:o.name,code:o.technicalCode,category:o.accessoryType,
   status:'approved',glass_min:0,glass_max:100,price:o.technicalUnitPrice,cut_spec:structuredClone(o.technicalSpec),mountEdge:o.mountEdge||'free'}
 }));
},selected(){const o=model().objects.find(v=>v.id===U.selected&&['glass','mirror'].includes(v.kind));return o?structuredClone(o):null},validate:(item,x,y)=>{const {ok,error}=technicalPlacement(item,x,y);return {ok,error}},orient:orientTechnicalItem,validateBatch:placements=>{const {ok,error}=prepareTechnicalBatch(placements);return {ok,error}},placeBatch:placeTechnicalBatch,place:placeTechnicalAccessory};
window.VSCADBridge={
 fittings(panelId){return model().objects.filter(o=>o.attachTo===panelId&&o.technicalSpec).map(o=>({
  id:o.id,name:o.name,label:fittingLabel(o),x:o.localX,y:o.localY,edge:o.mountEdge,dimensions:fittingDimensions(o),
  points:(o.technicalSpec.cutouts||[]).flat()
 }));},
 moveFitting:moveFittingTo,
 resizeHeight:(id,height)=>edit(id,'h',height),
 panels:()=>glassPanels().map(({id,name})=>({id,name})),
 selected(excluded=null){const o=model().objects.find(o=>o.id===U.selected&&['glass','mirror'].includes(o.kind));if(!o)return null;const shape=technicalGlassShape(o,[],excluded);return {...structuredClone(o),shape:shape.outline,holes:technicalHoles(o,excluded),cutouts:shape.voids,derivedTechnicalOutline:shape.edgeNotch,technicalProfile:shape.edgeNotch?technicalContourProfile(o,shape.outline):null}},
 commit(outline,holes,profile){const o=model().objects.find(o=>o.id===U.selected&&['glass','mirror'].includes(o.kind));if(!o)return {ok:false,error:'Nessuna lastra selezionata'};
 if(model().objects.some(a=>a.attachTo===o.id&&a.technicalSpec))return {ok:false,error:'Per modificare il profilo base rimuovi prima gli accessori tecnici; gli scassi sono calcolati automaticamente.'};
 const manualHoles=(holes||[]).filter(h=>!h.technicalInstanceId);const r=window.VSGeometry.normalize(outline,manualHoles);if(!r.ok)return r;
 remember();const left=o.x-o.w/2,bottom=o.y-o.h/2;
 o.x=mm(left+r.bounds.minX+r.width/2);o.y=mm(bottom+r.bounds.minY+r.height/2);o.w=mm(r.width);o.h=mm(r.height);o.shape=r.points;o.holes=r.holes;for(const a of model().objects)if(a.attachTo===o.id&&a.technicalSpec){a.localX=mm(a.localX-r.bounds.minX);a.localY=mm(a.localY-r.bounds.minY);linkedAccessoryPosition(a);}
 if(profile&&Array.isArray(profile.points)){o.cadProfile={points:profile.points.map(v=>[v[0]-r.bounds.minX,v[1]-r.bounds.minY]),bulges:[...(profile.bulges||[])],constraints:{...(profile.constraints||{})}}}
 else delete o.cadProfile;
 refresh(true);return {ok:true};},
};
window.VS={deliveryRevision,reviewDelivery,reviewInspect,saveDelivery,finishDelivery,compareFitting,backToReview,applyFittingRevision,downloadDxf,editFitting,saveState,toggleDoor,setHingeSide,setOpening,cadPage,openCad,show3D,addCadPanel,choose,blank,add,accessory,applyModernScene,edit,duplicate,remove,finish,select,shapeEditor,addVertex:()=>{if(!U.shape)return;const p=U.shape.vertices,q=p[p.length-1];p.push([q[0]+100,q[1]+100]);renderShapeFields()},removeVertex:i=>{if(U.shape.vertices.length<=3)return toast('Servono almeno 3 vertici');U.shape.vertices.splice(i,1);renderShapeFields()},addHole:()=>{const result=window.VSGeometry.validate(U.shape.vertices);if(!result.ok)return toast(result.error);let p=U.shape.vertices,x=p.reduce((a,v)=>a+v[0],0)/p.length,y=p.reduce((a,v)=>a+v[1],0)/p.length;U.shape.holes.push({x:mm(x),y:mm(y),r:15});renderShapeFields()},removeHole:i=>{U.shape.holes.splice(i,1);renderShapeFields()},hole:(i,k,v)=>{U.shape.holes[i][k==='diameter'?'r':k]=k==='diameter'?N(v)/2:N(v);renderShapeFields()},cadZoom:f=>{U.shape.zoom=f?Math.max(.4,Math.min(5,U.shape.zoom*f)):1;drawCadShape()},cadGrid:v=>{U.shape.grid=N(v,10);drawCadShape()},cadSnap:v=>{U.shape.snap=!!v},shapePreset:t=>{const o=model().objects.find(o=>o.id===U.shape.id),w=o.w,h=o.h;U.shape.vertices=t==='rectangle'?[[0,0],[w,0],[w,h],[0,h]]:t==='triangle'?[[0,0],[w,0],[w/2,h]]:[[0,0],[w,0],[w*.8,h],[w*.2,h]];U.shape.holes=[];renderShapeFields()},vertex:(i,j,v)=>{U.shape.vertices[i][j]=N(v);renderShapeFields()},applyShape,undo,redo,cost,export:exports,frame:frameModel,camera:cameraPreset,toggleLeft,toggleRight,toggleQuote,toggleSnap:()=>{U.snap=!U.snap;const b=$id('vsSnapBtn');if(b)b.textContent=U.snap?'🧲 Snap: ON':'🧲 Snap: OFF'},viewMode:switchMode,title:updateTitle,changeSettings,tab:t=>{U.tab=t;document.body.classList.remove('vsLeftClosed');bindUI()},setCategory:c=>{U.cat=c;bindUI()}};
// Existing SaaS remains untouched. Only the old editor entrypoints are replaced.
designer=designerHTML;init3d=initStudio;rebuild3d=drawScene;camPreset=cameraPreset;calc=pricingModel;
exportDXF=function(panelId){
 const panels=model().objects.filter(o=>['glass','mirror'].includes(o.kind));
 if(!panels.length)return toast('Nessuna lastra da esportare');
 if(panelId!==undefined&&!panels.some(o=>o.id===panelId))return toast('Seleziona una lastra da esportare');
 const rows=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1015','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','ENTITIES'];
 const line=(a,b,layer)=>rows.push('0','LINE','8',layer,'10',String(a[0]),'20',String(a[1]),'30','0','11',String(b[0]),'21',String(b[1]),'31','0');
 const contour=(profile,layer)=>{
  const {points,bulges}=profile;
  if(!bulges?.some(b=>Math.abs(b)>1e-9)){
   for(const [j,point] of points.entries())line(point,points[(j+1)%points.length],layer);
   return;
  }
  rows.push('0','LWPOLYLINE','100','AcDbEntity','8',layer,'100','AcDbPolyline','90',String(points.length),'70','1');
  for(const [j,[x,y]] of points.entries())rows.push('10',String(x),'20',String(y),'42',String(bulges[j]||0));
 };
 for(const [i,o] of panels.entries()){
  if(panelId!==undefined&&o.id!==panelId)continue;
  if(o.curve)return toast('DXF piano non disponibile per la lastra curva '+o.name);
  let derived;
  try{derived=technicalGlassShape(o)}catch(error){return toast('Esportazione DXF bloccata per '+o.name+': '+error.message)}
  const layer='LASTRA_'+(i+1),pts=derived.outline;
  if(!window.VSGeometry.validate(pts,technicalHoles(o)).ok){toast('Esportazione DXF bloccata: geometria non valida '+o.name);return}
  const profile=!technicalCutouts(o).length&&o.cadProfile?.points?.length>=3?o.cadProfile:technicalContourProfile(o,pts);
  contour(profile,layer);
  for(const h of technicalHoles(o)){if(h.type==='slot'&&h.length>2*h.r){const poly=window.VSGeometry.slotOutline(h,32);for(let j=0;j<poly.length;j++)line(poly[j],poly[(j+1)%poly.length],layer+'_ASOLE')}else rows.push('0','CIRCLE','8',layer+'_FORI','10',String(h.x),'20',String(h.y),'30','0','40',String(h.r))}for(const polygon of derived.voids)contour(technicalContourProfile(o,polygon),layer+'_TAGLI')
 }
 rows.splice(rows.indexOf('ENTITIES')+1,0,'999','VetroStudio · '+deliveryRevision());
 rows.push('0','ENDSEC','0','EOF');download('vetri-'+deliveryFilename()+(panelId===undefined?'':'-lastra-'+(panels.findIndex(o=>o.id===panelId)+1))+'.dxf',rows.join('\n'),'application/dxf')};
function exportWorkshopSheet(){
 const panels=model().objects.filter(o=>['glass','mirror'].includes(o.kind));
 if(!panels.length)return toast('Nessuna lastra da esportare');
 const sections=[];
 for(const [i,panel] of panels.entries()){
  if(panel.curve)return toast('Scheda piana non disponibile per la lastra curva '+panel.name);
  let shape;
  try{shape=technicalGlassShape(panel)}catch(error){return toast('Scheda bloccata per '+panel.name+': '+error.message)}
  const holes=technicalHoles(panel);
  if(!window.VSGeometry.validate(shape.outline,holes).ok)return toast('Scheda bloccata: geometria non valida per '+panel.name);
  const accessories=model().objects.filter(o=>o.attachTo===panel.id&&o.technicalSpec);
  const holeRows=holes.map((h,n)=>`<tr><td>${n+1}</td><td>${N(h.x)}</td><td>${N(h.y)}</td><td>${mm(h.r*2)}</td><td>${h.type==='slot'?'Asola · '+N(h.length)+' mm · '+N(h.angle)+'°':'Foro'}</td></tr>`).join('');
  const fittings=accessories.map(a=>`<li>${esc(a.technicalCode||'')} · ${esc(a.name)} · X ${N(a.localX)}, Y ${N(a.localY)} mm · ${a.technicalSpec.cutouts?.length||0} scassi</li>`).join('');
  const points=poly=>poly.map(([x,y])=>[N(x),-N(y)].join(',')).join(' ');
  const innerCuts=shape.voids.map(poly=>`<polygon points="${points(poly)}" fill="white" stroke="#333" vector-effect="non-scaling-stroke"/>`).join('');
  const drillMarks=holes.map(h=>h.type==='slot'
   ?`<polygon points="${points(window.VSGeometry.slotOutline(h))}" fill="white" stroke="#333" vector-effect="non-scaling-stroke"/>`
   :`<circle cx="${N(h.x)}" cy="${-h.y}" r="${N(h.r)}" fill="white" stroke="#333" vector-effect="non-scaling-stroke"/>`).join('');
  sections.push(`<section><h2>Lastra ${i+1} · ${esc(panel.name)}</h2>
   <p>Ingombro ${N(panel.w)} × ${N(panel.h)} mm · Spessore ${N(panel.d)} mm</p>
   <svg width="100%" height="220" viewBox="-2 ${-panel.h-2} ${N(panel.w)+4} ${N(panel.h)+4}" aria-label="Contorno e lavorazioni">
    <polygon points="${points(shape.outline)}" fill="#e5f3f7" stroke="#333" vector-effect="non-scaling-stroke"/>${innerCuts}${drillMarks}
   </svg>
   ${holes.length?`<table><thead><tr><th>N.</th><th>X (mm)</th><th>Y (mm)</th><th>Ø (mm)</th><th>Tipo</th></tr></thead><tbody>${holeRows}</tbody></table>`:'<p>Nessuna foratura.</p>'}
   ${fittings?`<h3>Ferramenta tecnica</h3><ul>${fittings}</ul>`:''}</section>`);
 }
 const title=esc(S.current.title);
 const page=`<!doctype html><html lang="it"><meta charset="utf-8"><title>Scheda lavorazioni · ${title}</title>
 <style>body{font:14px system-ui;color:#132835;max-width:780px;margin:30px auto;padding:0 16px}section{border-top:1px solid #b8c6ca;margin-top:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd4d8;padding:6px;text-align:left}svg{display:block}tr{break-inside:avoid}</style>
 <h1>Scheda lavorazioni · ${title}</h1><p>${esc(deliveryRevision())}</p><p>Quote in millimetri, origine in basso a sinistra della vista frontale. Per la geometria degli scassi usa il DXF della lastra e verifica gli elaborati prima della lavorazione.</p>
 ${sections.join('')}</html>`;
 download('scheda-lavorazioni-'+deliveryFilename()+'.html',page,'text/html;charset=utf-8');
}
exportCSV=function(){const p=pricingModel(),rows=[['Voce','Valore'],['Superficie vetro m²',p.area.toFixed(2)],['Materiali €',p.material.toFixed(2)],['Accessori €',p.accessories.toFixed(2)],['Imponibile €',p.net.toFixed(2)],['IVA €',p.tax.toFixed(2)],['Totale €',p.total.toFixed(2)]];download('distinta-'+safeFile(S.current.title)+'.csv','\uFEFF'+rows.map(r=>r.map(v=>String(v)).join(';')).join('\r\n'),'text/csv')};
const style=document.createElement('style');style.textContent=`
.modal:has(.vsDelivery){z-index:100001}.vsDelivery section{margin:.6rem 0}.vsDelivery li{margin:.4rem 0}#vsSaveState{display:block;margin-top:3px;font-size:11px;color:#536f79}.vsFieldGrid[hidden]{display:none}.vsTreeGroup{display:grid;gap:4px}.vsTreeChildren{display:grid;gap:4px;margin-left:14px}.vsTreeRow[aria-pressed=true]{font-weight:700}.cadPanelCard{display:flex;align-items:center;gap:12px;text-align:left}.cadPanelCard svg{flex:none}body.vsActive{overflow:hidden}body.vsActive .sidebar,body.vsActive .top{display:none!important}body.vsActive .main{width:100%;height:100vh;overflow:hidden}body.vsActive #page{padding:0;max-width:none;margin:0;height:100vh;overflow:hidden}
.vsWorkspace{display:flex;flex-direction:column;height:100vh;background:#edf1f2}.vsHeader{height:66px;background:white;border-bottom:1px solid #dce7e8;display:flex;align-items:center;justify-content:space-between;padding:8px 18px;gap:12px}.vsLogo{font-weight:900;font-size:19px;white-space:nowrap}.vsLogo span{color:#22a994}.vsLogo small{font-size:12px;color:#8b9da6;margin-left:12px;font-weight:500}.vsHeadActions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.vsHeadActions .btn{font-size:12px;padding:9px 11px}.vsExport{width:105px;font-size:12px;padding:9px}.vsContent{flex:1;display:flex;min-height:0}.vsRail{width:76px;background:#103240;display:flex;flex-direction:column;gap:9px;padding:14px 6px;flex-shrink:0}.vsRail button{border:0;color:#daebed;background:transparent;padding:10px 2px;border-radius:10px;font-size:11px;cursor:pointer}.vsRail button b{display:block;font-size:22px;margin-bottom:6px}.vsRail button.active,.vsRail button:hover{background:#205b65}.vsLeft{width:288px;background:#fff;border-right:1px solid #dce6e8;padding:20px;overflow:auto;flex-shrink:0;transition:width .2s,padding .2s}.vsLeft h3{margin:0 0 12px}.vsCollapse{float:right;border:0;background:#e9f3f3;border-radius:7px;padding:6px 10px;cursor:pointer}.vsModels{display:grid;gap:7px;margin:12px 0}.vsModel{display:flex;justify-content:space-between;gap:10px;text-align:left;background:#f8fafb;border:1px solid #d9e4e7;padding:12px;border-radius:10px;cursor:pointer;color:#1b3a46}.vsModel:hover{border-color:#1a9c92;background:#ecfaf7}.vsModel strong{color:#15827b}.vsModel span{flex:1}.vsTree{display:grid;gap:5px}.vsTreeRow{background:white;text-align:left;border:1px solid #e0e8ea;padding:9px;border-radius:8px;cursor:pointer}.vsTreeRow small{float:right;color:#91a2a8}.vsTreeRow.active{background:#def5ef;border-color:#3aab9d}.vsViewport{position:relative;flex:1;min-width:0;overflow:hidden;background:#61737b}.vsViewport canvas{display:block;width:100%;height:100%;touch-action:none}.vsCam,.vsViewTools,.vsBottom{position:absolute;display:flex;gap:5px;padding:5px;background:#ffffffed;border-radius:10px;box-shadow:0 3px 12px #3343}.vsCam{top:14px;left:14px}.vsViewTools{top:14px;right:14px}.vsBottom{bottom:16px;right:16px}.vsCam button,.vsViewTools button,.vsBottom button{border:0;background:white;color:#203b48;padding:10px 12px;border-radius:7px;cursor:pointer;font-weight:650;font-size:12px}.vsCam button:hover,.vsViewTools button:hover,.vsBottom button:hover{background:#def5ef}.vsHelp{position:absolute;bottom:16px;left:12px;background:#14343bd9;color:white;padding:8px 12px;border-radius:8px;font-size:11px;pointer-events:none}.vsRight{width:300px;background:white;border-left:1px solid #dde7e9;padding:20px;overflow:auto;flex-shrink:0;transition:width .2s,padding .2s}.vsRightHead{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e0e8ea;padding-bottom:12px;margin-bottom:15px}.vsFieldGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.vsFieldGrid label{font-size:11px;font-weight:650;color:#70858e}.vsFieldGrid input{margin-top:4px;font-size:13px;padding:7px}.vsRight details{padding:15px 0;border-top:1px solid #e3ebed;margin-top:15px}.vsRight summary{font-weight:700;cursor:pointer}.vsMetric{display:flex;justify-content:space-between;gap:8px;margin:11px 0;font-size:12px}.vsMetric strong{color:#16756c}.vsLeftClosed .vsLeft,.vsRightClosed .vsRight{width:0;padding:0;border:0;overflow:hidden}.vsWorkspace .btn{white-space:nowrap}@media(max-width:1050px){.vsLeft{width:230px}.vsRight{width:255px}.vsHeader{height:auto;min-height:65px}.vsHeadActions{justify-content:flex-end}}@media(max-width:760px){.vsRail{width:52px}.vsRail button{font-size:9px}.vsLogo small{display:none}.vsLeft,.vsRight{position:absolute;z-index:5;top:66px;bottom:0;box-shadow:0 8px 24px #1234}.vsLeft{left:52px}.vsRight{right:0}.vsHeadActions .btn{font-size:10px}.vsHelp{display:none}}`;
style.textContent+=`
.vsCadHead h3{margin:0 0 6px}.vsCadTools,.vsCadActions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:12px 0}.vsCadTools label{font-size:12px}.vsCadTools select{width:auto;min-width:105px;padding:7px}.vsCadDrawing{height:min(53vh,460px);background:#eaf0f3;border:1px solid #cddce2;border-radius:12px;overflow:hidden}.vsCadDrawing svg{width:100%;height:100%;touch-action:none}.vsCadStatus{margin:8px 0;padding:9px 12px;border-radius:7px;font-size:12px}.vsCadOk{background:#e9f6f1;color:#146c57}.vsCadError{background:#fff0ed;color:#a13b26}.vsCadTabs{display:grid;grid-template-columns:1fr 1fr;gap:16px}.vsCadTabs h4{margin:5px 0}.vsCadField{display:flex;gap:6px;align-items:center;margin:5px 0}.vsCadField b{width:28px;font-size:11px}.vsCadField label{font-size:10px;color:#667f8a;flex:1}.vsCadField input{width:100%;padding:6px;font-size:12px;border:1px solid #c9dbe1;border-radius:6px}.vsCadField button{background:#fff;border:1px solid #dde6e8;border-radius:6px;cursor:pointer}.modal>div:has(.vsCadDrawing){width:min(1020px,98vw);max-height:94vh}@media(max-width:700px){.vsCadTabs{grid-template-columns:1fr}.vsCadDrawing{height:330px}}
`;
document.head.append(style);
document.addEventListener('keydown',e=>{if(!document.body.classList.contains('vsActive'))return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}else if(e.key==='Delete'&&U.selected){e.preventDefault();remove()}});const oldNavigate=navigate;navigate=function(v){if(v!=='designer'){document.body.classList.remove('vsActive');disposeStudio();}else document.body.classList.add('vsActive');return oldNavigate(v)};
})();
