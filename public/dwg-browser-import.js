/* VetroStudio DWG (browser) - reader of simple, verified 2D cutting geometry.
 * Optional GPL-3.0 dependency: @mlightcad/libredwg-web; keep license notices.
 * Never derive the glass cut-out from the accessory's STEP model.
 */
(function(root) {
'use strict';
const PACKAGE_VERSION='0.7.14';
const BASE=new URL('/vendor/libredwg/wasm',typeof location!=='undefined'?location.href:'https://localhost/').href;
const MODULE='/vendor/libredwg/dist/libredwg-web.js';
let engine;
const safe=n=>Number.isFinite(Number(n));
const MM_TOL=0.025;
const CHORD_ERROR=0.025; // maximum sagitta in mm for CAD preview ONLY
const pt=(p)=>[Number(p?.x),Number(p?.y)];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const unitOf=db=>{
 const h=db?.header||{};
 const val=h.insunits??h.INSUNITS??h['$INSUNITS']??h?.variables?.INSUNITS;
 return val===undefined||val===null||val===''?'unknown':Number(val);
};
function summarize(database){
 const entities=(database?.entities||[]).filter(e=>e&&!e.isInPaperSpace&&e.isVisible!==true&&e.isVisible!==1);
 const layers={};
 for(const e of entities){
  const layer=String(e.layer||'0'),type=String(e.type||'UNKNOWN').toUpperCase();
  if(!layers[layer])layers[layer]={total:0,types:{}};
  layers[layer].total++;
  layers[layer].types[type]=(layers[layer].types[type]||0)+1;
 }
 return {units:unitOf(database),layers,entities:entities.length};
}
function arcPoints(center,r,start,delta,includeStart=true){
 if(![...center,r,start,delta].every(Number.isFinite)||r<=0||r>20000||Math.abs(delta)>2*Math.PI+1e-6)throw Error('Geometria ARC con quote non valide');
 const maxStep=2*Math.acos(Math.max(-1,1-Math.min(CHORD_ERROR,r/2)/r));
 const steps=Math.max(1,Math.ceil(Math.abs(delta)/maxStep));
 if(steps>1000)throw Error('ARC troppo dettagliato: verifica unità e dimensioni');
 const pts=[];
 for(let i=includeStart?0:1;i<=steps;i++){
  const a=start+delta*i/steps;
  pts.push([center[0]+r*Math.cos(a),center[1]+r*Math.sin(a)]);
 }
 return pts;
}
function segmentFromBulge(p,q,bulge){
 const b=Number(bulge||0);
 if(!Number.isFinite(b))throw Error('Bulge non valido');
 if(Math.abs(b)<1e-10)return [p,q];
 const ch=dist(p,q);
 if(ch<MM_TOL)throw Error('Arco con corda troppo corta');
 const center=[(p[0]+q[0])/2-(q[1]-p[1])*(1-b*b)/(4*b),
               (p[1]+q[1])/2+(q[0]-p[0])*(1-b*b)/(4*b)];
 const radius=ch*(1+b*b)/(4*Math.abs(b));
 const start=Math.atan2(p[1]-center[1],p[0]-center[0]);
 return arcPoints(center,radius,start,4*Math.atan(b));
}
function cleanedPolygon(points){
 let v=[];
 for(const p of points){if(!Array.isArray(p)||p.length<2||p.some(x=>!Number.isFinite(x)))throw Error('Vertice non valido');
   if(!v.length||dist(v[v.length-1],p)>1e-8)v.push(p);
 }
 if(v.length>1&&dist(v[0],v[v.length-1])<=MM_TOL)v.pop();
 if(v.length<3)throw Error('Contorno con meno di tre vertici');
 if(v.length>300)throw Error('Contorno troppo complesso per l’editor 2D: lavorazione non esportata');
 let area=0;
 for(let i=0;i<v.length;i++){const a=v[i],b=v[(i+1)%v.length];area+=a[0]*b[1]-b[0]*a[1];}
 if(Math.abs(area)<0.0001)throw Error('Contorno degenerato');
 return v;
}
function polylinePoints(e){
 const vertices=e.vertices||[],flag=Number(e.flag??0);
 const closed=!!(flag&1)||e.closed===true||e.isClosed===true;
 if(!closed||vertices.length<3||vertices.length>300)throw Error('Polilinea aperta o degenerata');
 const elevation=Number(e.elevation||0),normal=e.extrusionDirection||{z:1};
 if(!Number.isFinite(elevation)||Math.abs(elevation)>0.001||Math.abs(Number(normal.z??1)-1)>1e-6)throw Error('Polilinea non planare');
 const input=vertices.map(v=>{
  const q=(v.position&&typeof v.position==='object')?v.position:v;
  return {p:pt(q),bulge:Number(v.bulge||0)}
 });
 if(input.some(v=>!v.p.every(Number.isFinite)))throw Error('Coordinate polilinea non valide');
 const out=[];
 for(let i=0;i<input.length;i++){
  const p=input[i],q=input[(i+1)%input.length],piece=segmentFromBulge(p.p,q.p,p.bulge);
  if(out.length)out.push(...piece.slice(1));else out.push(...piece);
 }
 return cleanedPolygon(out);
}
function lineArcLoops(edges){
 const pending=edges.slice(),out=[];
 while(pending.length){
  const first=pending.shift();
  let pts=first.slice(),closed=false,guard=0;
  while(guard++<1000){
   if(pts.length>2&&dist(pts[0],pts[pts.length-1])<=MM_TOL){closed=true;break}
   const last=pts[pts.length-1];
   const idx=pending.findIndex(seg=>dist(seg[0],last)<=MM_TOL||dist(seg[seg.length-1],last)<=MM_TOL);
   if(idx<0)break;
   let e=pending.splice(idx,1)[0];
   if(dist(e[e.length-1],last)<=MM_TOL)e=e.slice().reverse();
   pts.push(...e.slice(1));
  }
  if(!closed)throw Error('LINE/ARC aperti: i segmenti non formano un contorno continuo. Seleziona il layer delle sole lavorazioni.');
  out.push(cleanedPolygon(pts));
 }
 return out;
}
function normalize(database,layers=[],unitConfirmed=false) {
 if(!database||!Array.isArray(database.entities))throw Error('DWG: geometrie del Model Space non disponibili');
 const units=unitOf(database),report=summarize(database);
 if(units!=='unknown'&&units!==0&&units!==4)throw Error('DWG: unità diverse dai millimetri (INSUNITS '+units+').');
 if((units==='unknown'||units===0)&&!unitConfirmed)throw Error('DWG: unità non specificate. Conferma i millimetri usando la scheda del produttore.');
 const entities=database.entities.filter(e=>e&&!e.isInPaperSpace&&e.isVisible!==true&&e.isVisible!==1);
 const names=Object.keys(report.layers),selected=new Set(layers.map(x=>String(x).trim().toUpperCase()).filter(Boolean));
 const explanation=names.map(name=>name+': '+Object.entries(report.layers[name].types).map(([k,n])=>k+' '+n).join(', ')).join(' | ');
 if(!selected.size&&names.length>1)throw Error('DWG: seleziona il layer delle lavorazioni. Layer disponibili: '+explanation.slice(0,600));
 for(const requested of selected)if(!names.some(n=>n.toUpperCase()===requested))throw Error('Layer non trovato: '+requested+'. Disponibili: '+names.join(', '));
 const chosen=entities.filter(e=>!selected.size||selected.has(String(e.layer||'0').toUpperCase()));
 const holes=[],polys=[],edges=[],unsupported=[],ignored=[];
 let curved=false;
 for(const e of chosen){
  const type=String(e.type||'UNKNOWN').toUpperCase();
  try{
   if(type==='CIRCLE'){
    const center=e.center||{},r=Number(e.radius),normal=e.extrusionDirection||{z:1};
    if(![center.x,center.y,r].every(safe)||r<=0||r>300||Math.abs(Number(center.z||0))>0.001||Math.abs(Number(normal.z??1)-1)>0.001)throw Error('Cerchio fuori piano o non valido');
    holes.push({x:Number(center.x),y:Number(center.y),r});
   }else if(type==='LWPOLYLINE'||type==='POLYLINE_2D'){
    const poly=polylinePoints(e);
    polys.push(poly);
    if((e.vertices||[]).some(v=>Math.abs(Number(v.bulge||0))>1e-10))curved=true;
   }else if(type==='LINE'){
    const start=pt(e.startPoint||e.start),end=pt(e.endPoint||e.end);
    if(![...start,...end].every(Number.isFinite)||dist(start,end)<MM_TOL||Math.abs(Number((e.startPoint||e.start)?.z||0))>0.001||Math.abs(Number((e.endPoint||e.end)?.z||0))>0.001)throw Error('Segmento LINE non valido');
    edges.push([start,end]);
   }else if(type==='ARC'){
    const center=pt(e.center),r=Number(e.radius),start=Number(e.startAngle),end=Number(e.endAngle);
    if(![...center,r,start,end].every(Number.isFinite)||r<=0||r>20000||Math.abs(Number(e.center?.z||0))>0.001)throw Error('ARC con dati non validi');
    let delta=(end-start)%(2*Math.PI);
    if(delta<=0)delta+=2*Math.PI;
    // The LibreDWG database documents arc angles in radians.
    if(delta>2*Math.PI-0.000001)throw Error('ARC completo non supportato');
    edges.push(arcPoints(center,r,start,delta));
    curved=true;
   }else if(/^(TEXT|MTEXT|DIMENSION|DIMENSION_.+|LEADER|HATCH|POINT)$/.test(type)){
    ignored.push(type);
   }else unsupported.push(type||'UNKNOWN');
  }catch(err){unsupported.push(type+': '+err.message)}
 }
 if(unsupported.length)throw Error('DWG: geometrie non supportate sul layer selezionato: '+[...new Set(unsupported)].slice(0,8).join(' | ')+'. Layer: '+explanation.slice(0,400));
 if(edges.length)polys.push(...lineArcLoops(edges));
 if(!holes.length&&!polys.length)throw Error('DWG: nessun contorno di taglio riconosciuto. Entità lette: '+explanation.slice(0,650)+'. Prova a selezionare il layer del taglio, oppure verifica se il profilo è contenuto in un blocco INSERT.');
 if(holes.length>80||polys.length>40)throw Error('DWG: troppi elementi per una sola lavorazione');
 const all=[...holes.flatMap(h=>[[h.x-h.r,h.y-h.r],[h.x+h.r,h.y+h.r]]),...polys.flat()];
 const cx=(Math.min(...all.map(p=>p[0]))+Math.max(...all.map(p=>p[0])))/2;
 const cy=(Math.min(...all.map(p=>p[1]))+Math.max(...all.map(p=>p[1])))/2;
 const round=n=>Math.round(n*10000)/10000;
 return {cuts:{holes:holes.map(h=>({x:round(h.x-cx),y:round(h.y-cy),r:round(h.r)})),cutouts:polys.map(poly=>poly.map(p=>[round(p[0]-cx),round(p[1]-cy)])),origin:[round(cx),round(cy)]},layers:names,report,ignored,curved,approximationMm:curved?CHORD_ERROR:0,warning:'DWG in bozza: origine centrata automaticamente. '+(curved?'Le curve sono campionate con errore teorico massimo 0,025 mm per ANTEPRIMA, non per CNC. ':'')+'Verificare interassi, geometrie e scheda del produttore.',format:'DWG'};
}
/* LibreDWG's convert() is NOT an entity database converter. Its public DWG→DXF
   API returns the actual CAD file, whose ENTITIES section must be parsed here. */
function parseConvertedDxf(text){
 if(typeof text!=='string'||!text.trim())throw Error('LibreDWG: file DXF convertito vuoto');
 const lines=text.replace(/\r/g,'').split('\n'),pairs=[];
 for(let i=0;i+1<lines.length;i+=2)pairs.push([lines[i].trim(),lines[i+1].trim()]);
 let section='',current=null,entities=[],units='unknown';
 const number=(arr,code,fallback=0)=>{
  const found=arr.find(x=>x[0]===String(code));
  return found?Number(found[1]):fallback;
 };
 const value=(arr,code,fallback='')=>{
  const found=arr.find(x=>x[0]===String(code));
  return found?found[1]:fallback;
 };
 let haveHeader=false,haveEntities=false;
 for(let i=0;i<pairs.length;i++){
  const [key,val]=pairs[i];
  if(key==='0'&&val==='SECTION'&&pairs[i+1]?.[0]==='2'){
   if(current){entities.push(current);current=null}
   section=pairs[++i][1];
   if(section==='HEADER')haveHeader=true;
   if(section==='ENTITIES')haveEntities=true;
   continue;
  }
  if(key==='0'&&val==='ENDSEC'){
   if(current){entities.push(current);current=null}
   section='';continue;
  }
  if(section==='HEADER'){
   if(key==='9'&&val==='$INSUNITS'&&pairs[i+1]?.[0]==='70'){
    units=Number(pairs[++i][1]);
   }
   continue;
  }
  if(section!=='ENTITIES')continue;
  if(key==='0'){
   if(current)entities.push(current);
   current={type:val,data:[]};
  }else if(current)current.data.push([key,val]);
 }
 if(current)entities.push(current);
 if(!haveEntities)throw Error('Il DXF ricavato dal DWG non contiene la sezione ENTITIES (modello non utilizzabile)');
 const result=[];
 // POLYLINE+VERTEX+SEQEND are one entity; retain bulges/closed flag
 for(let i=0;i<entities.length;i++){
  const item=entities[i],type=item.type.toUpperCase(),d=item.data;
  if(type==='SEQEND')continue;
  if(type==='POLYLINE'){
   const points=[];
   while(entities[i+1]?.type.toUpperCase()==='VERTEX'){
    const v=entities[++i].data;
    points.push({x:number(v,10,NaN),y:number(v,20,NaN),bulge:number(v,42,0)});
   }
   const f=number(d,70,0);
   result.push({type:'POLYLINE_2D',layer:value(d,8,'0'),flag:f,vertices:points,elevation:number(d,30,0),isInPaperSpace:number(d,67,0)===1});
   continue;
  }
  const layer=value(d,8,'0'),space=number(d,67,0)===1;
  let entity={type,layer,isInPaperSpace:space};
  if(type==='LINE'){
   entity.startPoint={x:number(d,10,NaN),y:number(d,20,NaN),z:number(d,30,0)};
   entity.endPoint={x:number(d,11,NaN),y:number(d,21,NaN),z:number(d,31,0)};
  }else if(type==='CIRCLE'||type==='ARC'){
   entity.center={x:number(d,10,NaN),y:number(d,20,NaN),z:number(d,30,0)};
   entity.radius=number(d,40,NaN);
   if(type==='ARC'){
    entity.startAngle=number(d,50,NaN)*Math.PI/180;
    entity.endAngle=number(d,51,NaN)*Math.PI/180;
   }
  }else if(type==='LWPOLYLINE'){
   const vert=[];let p=null;
   for(const [code,val] of d){
    if(code==='10'){if(p)vert.push(p);p={x:Number(val),y:NaN,bulge:0};}
    if(code==='20'&&p)p.y=Number(val);
    if(code==='42'&&p)p.bulge=Number(val);
   }
   if(p)vert.push(p);
   entity.flag=number(d,70,0);
   entity.vertices=vert;
   entity.elevation=number(d,38,0);
  }else if(type==='INSERT'){
   entity.blockName=value(d,2);
  }
  result.push(entity);
 }
 return {header:{insunits:units},entities:result,sourceInfo:{haveHeader,haveEntities,source:'LibreDWG DWG→DXF',count:result.length}};
}
async function readDwg(file) {
 if(!file||!/\.dwg$/i.test(file.name)||file.size<128||file.size>12*1024*1024)throw Error('Seleziona un DWG valido (max 12 MB)');
 const buf=new Uint8Array(await file.arrayBuffer());
 if(!/^AC10\d\d/.test(new TextDecoder().decode(buf.subarray(0,6))))throw Error('Firma DWG non riconosciuta');
 if(!engine)engine=import(MODULE).then(async lib=>({
   parser:await lib.LibreDwg.create(BASE)
 })).catch(err=>{engine=null;throw Error('Motore LibreDWG non disponibile: '+err.message)});
 const {parser}=await engine;
 // Use the actual published LibreDWG DWG-to-DXF API; do not call convert(ptr).
 const converted=parser.dwg_write_dxf(buf);
 if(!converted||converted.length<20)throw Error('LibreDWG non è riuscito a convertire il DWG in DXF. Il file può essere incompatibile o danneggiato.');
 const decoded=new TextDecoder('utf-8').decode(converted);
 if(!decoded.includes('SECTION'))throw Error('La conversione LibreDWG non ha restituito un DXF ASCII valido');
 const db=parseConvertedDxf(decoded);
 if(!db.entities.length)throw Error('DWG convertito, ma nessuna entità nel Model Space. Le geometrie potrebbero essere solo all’interno di blocchi o nel Layout.');
 return db;
}
/*
 * Hinge edge-notch detector. The manufacturer drawing can contain hundreds of
 * unrelated circles/lines. Do not treat those as holes. A match must have:
 *  - a unique pair of equal-radius reliefs in the same CAD layer;
 *  - their centres vertically aligned;
 *  - two independent horizontal cut edges sharing the same left boundary,
 *    with endpoints near the round relief centres.
 * The width is MEASURED from CAD line coordinates, never assumed from a model
 * number, picture, or default template.
 * The geometric union is a single border notch, NOT two drilled holes.
 */
function autoHingeNotch(database,clipper){
 const ents=(database?.entities||[]).filter(e=>e&&!e.isInPaperSpace&&e.isVisible!==true&&e.isVisible!==1);
 const circles=[],lines=[],validLayers=new Set();
 for(let i=0;i<ents.length;i++){
  const e=ents[i],kind=String(e.type||'').toUpperCase(),layer=String(e.layer||'0');
  if(layer.toUpperCase()==='FORMAT')continue;
  if(kind==='ARC'||kind==='CIRCLE'){
   const x=Number(e.center?.x),y=Number(e.center?.y),r=Number(e.radius);
   if([x,y,r].every(Number.isFinite)&&r>=1&&r<=40)circles.push({x,y,r,layer,kind,index:i});
  }else if(kind==='LINE'){
   const a=pt(e.startPoint||e.start),b=pt(e.endPoint||e.end);
   if(a.every(Number.isFinite)&&b.every(Number.isFinite)&&Math.abs(a[1]-b[1])<0.08&&Math.abs(a[0]-b[0])>8)lines.push({xmin:Math.min(a[0],b[0]),xmax:Math.max(a[0],b[0]),y:(a[1]+b[1])/2,layer,index:i});
  }else if(kind==='LWPOLYLINE'||kind==='POLYLINE_2D'){
   const verts=e.vertices||[],closed=(Number(e.flag||0)&1)!==0||e.closed===true;
   for(let k=0;k<(closed?verts.length:verts.length-1);k++){
    const from=verts[k],to=verts[(k+1)%verts.length];
    if(!from||!to)continue;
    const p=pt(from),q=pt(to),bulge=Number(from.bulge||0);
    if(![...p,...q,bulge].every(Number.isFinite))continue;
    if(Math.abs(bulge)<1e-9){
     if(Math.abs(p[1]-q[1])<0.08&&Math.abs(p[0]-q[0])>8)lines.push({xmin:Math.min(p[0],q[0]),xmax:Math.max(p[0],q[0]),y:(p[1]+q[1])/2,layer,index:i});
    }else{
     const chord=dist(p,q);
     if(chord<MM_TOL)continue;
     const cen=[(p[0]+q[0])/2-(q[1]-p[1])*(1-bulge*bulge)/(4*bulge),
                (p[1]+q[1])/2+(q[0]-p[0])*(1-bulge*bulge)/(4*bulge)];
     const rad=chord*(1+bulge*bulge)/(4*Math.abs(bulge));
     if([...cen,rad].every(Number.isFinite)&&rad>=1&&rad<=40)circles.push({x:cen[0],y:cen[1],r:rad,layer,kind:'BULGE',index:i});
    }
   }
  }
 }
 // One centre can be represented by multiple ARC fragments: collapse exactly,
 // but only within the same layer.
 const reliefs=[];
 for(const e of circles){
  if(!reliefs.some(p=>p.layer===e.layer&&Math.hypot(p.x-e.x,p.y-e.y)<0.12&&Math.abs(p.r-e.r)<0.12))reliefs.push(e);
 }
 const possibilities=[];
 for(let i=0;i<reliefs.length;i++)for(let j=i+1;j<reliefs.length;j++){
  let a=reliefs[i],b=reliefs[j];if(a.layer!==b.layer||a.y>b.y)[a,b]=[b,a];
  if(a.layer!==b.layer||Math.abs(a.x-b.x)>0.15||Math.abs(a.r-b.r)>0.15)continue;
  const spacing=b.y-a.y,r=(a.r+b.r)/2;
  if(spacing<r*3||spacing>250)continue;
  // Both horizontal segments are part of the actual cutting geometry, not
  // dimension text. Their ends may meet the CIRCLE centre OR its tangency.
  const near=(line,relief)=>Math.min(Math.abs(line.y-relief.y),Math.abs(line.y-(relief.y+r)),Math.abs(line.y-(relief.y-r)))<0.2;
  const low=lines.filter(l=>l.layer===a.layer&&near(l,a)&&l.xmin<a.x-r*1.5&&Math.abs(l.xmax-a.x)<r+0.4);
  const high=lines.filter(l=>l.layer===a.layer&&near(l,b)&&l.xmin<b.x-r*1.5&&Math.abs(l.xmax-b.x)<r+0.4);
  for(const l of low)for(const h of high){
   if(Math.abs(l.xmin-h.xmin)>0.25)continue;
   const depth=a.x-(l.xmin+h.xmin)/2;
   if(depth<r*1.5||depth>180)continue;
   const keys=[a.index,b.index,l.index,h.index];
   possibilities.push({layer:a.layer,r,spacing,depth,centerX:(a.x+b.x)/2,lowY:a.y,highY:b.y,sourceIds:keys});
  }
 }
 // Deduplicate the same geometry created from multi-arc CAD entities.
 const distinct=[];
 for(const p of possibilities){
  if(!distinct.some(q=>Math.abs(p.centerX-q.centerX)<0.1&&Math.abs(p.lowY-q.lowY)<0.1&&Math.abs(p.highY-q.highY)<0.1&&Math.abs(p.depth-q.depth)<0.1&&Math.abs(p.r-q.r)<0.1))distinct.push(p);
 }
 if(distinct.length!==1)return {status:distinct.length?'ambiguous':'not_found',matches:distinct.length,reason:distinct.length?'Trovate più lavorazioni geometricamente compatibili: impossibile scegliere senza rischiare il taglio sbagliato.':'Non si trovano due raccordi circolari allineati insieme ai due segmenti orizzontali quotati della tasca. Nessun taglio generato.'};
 const p=distinct[0],engine=clipper||root.polygonClipping;
 if(!engine?.union)return {status:'blocked',reason:'Motore geometrico della lavorazione non disponibile'};
 const rect=[[[p.centerX-p.depth,p.lowY],[p.centerX,p.lowY],[p.centerX,p.highY],[p.centerX-p.depth,p.highY],[p.centerX-p.depth,p.lowY]]];
 function disk(cx,cy,r){
  const n=Math.min(256,Math.max(48,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-CHORD_ERROR/r)))));
  const pts=Array.from({length:n},(_,i)=>[cx+r*Math.cos(2*Math.PI*i/n),cy+r*Math.sin(2*Math.PI*i/n)]);
  pts.push(pts[0]);return [pts];
 }
 let union;
 try{union=engine.union(rect,disk(p.centerX,p.lowY,p.r),disk(p.centerX,p.highY,p.r))}
 catch(err){return {status:'blocked',reason:'Impossibile unire la tasca ai raccordi: '+err.message}}
 if(!union||union.length!==1||union[0].length!==1)return {status:'blocked',reason:'La tasca non forma un unico contorno chiuso'};
 const outline=cleanedPolygon(union[0][0]);
 if(outline.length>300)return {status:'blocked',reason:'Contorno troppo dettagliato per l’editor corrente'};
 const xs=outline.map(q=>q[0]),ys=outline.map(q=>q[1]),ox=(Math.min(...xs)+Math.max(...xs))/2,oy=(Math.min(...ys)+Math.max(...ys))/2;
 const round=n=>Math.round(n*10000)/10000;
 const cuts={holes:[],cutouts:[outline.map(q=>[round(q[0]-ox),round(q[1]-oy)])],origin:[round(ox),round(oy)]};
 return {status:'matched',format:'DWG',cuts,dimensions:{diameter:round(p.r*2),centerSpacing:round(p.spacing),notchDepth:round(p.depth)},layer:p.layer,sourceIds:p.sourceIds,warning:'Scasso laterale con due raccordi circolari ricostruito da entità geometriche DWG. I raccordi sono campionati per anteprima DXF (errore geometrico teorico massimo 0,025 mm): obbligatoria verifica dimensionale sul disegno del produttore; non è un programma CNC.'};
}
function geometricCandidates(database){
 const entities=(database?.entities||[]).filter(e=>e&&!e.isInPaperSpace&&e.isVisible!==true&&e.isVisible!==1);
 const candidates=[],issues=[],segments=[];
 function addPoly(id,layer,type,points){
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
  if(w<0.1||h<0.1||w>3000||h>3000)throw Error('dimensioni fuori scala');
  candidates.push({id,layer,kind:'contorno',type,width:+w.toFixed(3),height:+h.toFixed(3),points});
 }
 for(let index=0;index<entities.length;index++){
  const e=entities[index],type=String(e.type||'').toUpperCase(),layer=String(e.layer||'0');
  try{
   if(type==='LWPOLYLINE'||type==='POLYLINE_2D'){
    addPoly('e'+index,layer,type,polylinePoints(e));
   }else if(type==='CIRCLE'){
    const r=Number(e.radius),c=e.center||{};
    if(![r,c.x,c.y].every(Number.isFinite)||r<=0||r>300)throw Error('coordinate o diametro non validi');
    candidates.push({id:'e'+index,layer,kind:'foro',type,width:+(r*2).toFixed(3),height:+(r*2).toFixed(3),hole:{x:Number(c.x),y:Number(c.y),r}});
   }else if(type==='LINE'){
    const a=pt(e.startPoint||e.start),b=pt(e.endPoint||e.end);
    if(!a.every(Number.isFinite)||!b.every(Number.isFinite)||dist(a,b)<MM_TOL)throw Error('segmento aperto non valido');
    segments.push({id:index,layer,pts:[a,b]});
   }else if(type==='ARC'){
    const c=pt(e.center),r=Number(e.radius),start=Number(e.startAngle),end=Number(e.endAngle);
    if(![...c,r,start,end].every(Number.isFinite)||r<=0)throw Error('arco non valido');
    let d=(end-start)%(2*Math.PI);if(d<=0)d+=2*Math.PI;
    segments.push({id:index,layer,pts:arcPoints(c,r,start,d)});
   }
  }catch(err){if(issues.length<80)issues.push({layer,type,index,reason:String(err.message)})}
 }
 // Find closed paths among LINE/ARC fragments. Unconnected and ambiguous networks
 // stay excluded: these often represent annotations or construction geometry.
 const byLayer=new Map();
 for(const seg of segments){if(!byLayer.has(seg.layer))byLayer.set(seg.layer,[]);byLayer.get(seg.layer).push(seg)}
 for(const [layer,list] of byLayer){
  const taken=new Set();
  for(const seed of list){
   if(taken.has(seed.id))continue;
   const path=seed.pts.slice(),ids=[seed.id];let closed=false,ambiguous=false;
   for(let guard=0;guard<list.length;guard++){
    const first=path[0],last=path.at(-1);
    if(path.length>2&&dist(first,last)<=MM_TOL){closed=true;break}
    const matches=list.filter(seg=>!taken.has(seg.id)&&!ids.includes(seg.id)&&(dist(seg.pts[0],last)<=MM_TOL||dist(seg.pts.at(-1),last)<=MM_TOL));
    if(matches.length!==1){ambiguous=matches.length>1;break}
    const part=matches[0],pts=dist(part.pts[0],last)<=MM_TOL?part.pts:part.pts.slice().reverse();
    path.push(...pts.slice(1));ids.push(part.id);
    if(path.length>400)break;
   }
   if(closed){
    try{const poly=cleanedPolygon(path);addPoly('chain'+seed.id,layer,'LINE+ARC',poly);ids.forEach(id=>taken.add(id))}
    catch(err){if(issues.length<80)issues.push({layer,type:'LINE+ARC',index:seed.id,reason:String(err.message)})}
   }else if(ambiguous&&issues.length<80){
    issues.push({layer,type:'LINE+ARC',index:seed.id,reason:'giunzione ambigua: non selezionata'});
   }
  }
 }
 return {candidates:candidates.slice(0,150),issues,detected:candidates.length,truncated:candidates.length>150,unjoinedSegments:segments.length};
}
function cutsFromCandidates(report,ids){
 const selected=new Set(ids||[]);
 const list=(report?.candidates||[]).filter(item=>selected.has(item.id));
 if(!list.length)throw Error('Seleziona almeno un profilo o foro nella diagnosi CAD');
 if(list.length>60)throw Error('Selezione troppo ampia: verifica i tagli individualmente');
 const holes=list.filter(x=>x.kind==='foro').map(x=>x.hole);
 const cutouts=list.filter(x=>x.kind==='contorno').map(x=>x.points);
 if(!holes.length&&!cutouts.length)throw Error('Nessun elemento geometrico selezionato');
 const all=[...holes.flatMap(h=>[[h.x-h.r,h.y-h.r],[h.x+h.r,h.y+h.r]]),...cutouts.flat()];
 const xs=all.map(x=>x[0]),ys=all.map(x=>x[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const round=n=>Math.round(n*10000)/10000;
 return {cuts:{holes:holes.map(h=>({x:round(h.x-cx),y:round(h.y-cy),r:round(h.r)})),cutouts:cutouts.map(p=>p.map(q=>[round(q[0]-cx),round(q[1]-cy)])),origin:[round(cx),round(cy)]},format:'DWG',warning:'Elementi geometrici selezionati manualmente da layer misti: controllare dimensioni e corrispondenza esatta con il disegno del produttore, non utilizzare direttamente per CNC.',selectedIds:[...selected]};
}
async function inspectDwg(file){
 const db=await readDwg(file);
 return {...summarize(db),...geometricCandidates(db),autoNotch:autoHingeNotch(db)};
}
async function parseDwg(file,layers=[],unitConfirmed=false){
 return normalize(await readDwg(file),layers,unitConfirmed);
}
function toDxf(cuts) {
 if(!cuts||!Array.isArray(cuts.holes)||!Array.isArray(cuts.cutouts))throw Error('Geometrie di taglio mancanti');
 if(!cuts.holes.length&&!cuts.cutouts.length)throw Error('Non ci sono lavorazioni da esportare');
 const out=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1015','9','$INSUNITS','70','4','0','ENDSEC',
  '0','SECTION','2','ENTITIES','999','VETROSTUDIO - pattern relativo al punto di fissaggio (0,0), non certificato per produzione'];
 const n=v=>{if(!Number.isFinite(Number(v)))throw Error('Coordinata DXF non valida');return Number(v).toFixed(4)};
 for(const hole of cuts.holes) {
  if(!(hole.r>0&&hole.r<=300))throw Error('Raggio foro non valido');
  out.push('0','CIRCLE','8','GLASS_CUT','10',n(hole.x),'20',n(hole.y),'30','0','40',n(hole.r));
 }
 for(const points of cuts.cutouts) {
  if(!Array.isArray(points)||points.length<3||points.length>300)throw Error('Contorno DXF non valido');
  out.push('0','LWPOLYLINE','8','GLASS_CUT','90',String(points.length),'70','1');
  for(const [x,y] of points)out.push('10',n(x),'20',n(y));
 }
 out.push('0','ENDSEC','0','EOF');
 return out.join('\n')+'\n';
}
root.VSDWGImport={parseDwg,inspectDwg,autoHingeNotch,geometricCandidates,cutsFromCandidates,parseConvertedDxf,normalize,summarize,toDxf,license:'LibreDWG GPL-3.0',version:PACKAGE_VERSION};
if(typeof module!=='undefined'&&module.exports)module.exports={autoHingeNotch,geometricCandidates,cutsFromCandidates,parseConvertedDxf,normalize,summarize,toDxf};
})(typeof window!=='undefined'?window:globalThis);
