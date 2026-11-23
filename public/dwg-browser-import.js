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
function normalize(database,layers=[],unitConfirmed=false) {
 if(!database||!Array.isArray(database.entities))throw Error('DWG: geometrie del Model Space non disponibili');
 const header=database.header||{};
 const rawUnit=header.insunits??header.INSUNITS??header['$INSUNITS']??header?.variables?.INSUNITS;
 const units=rawUnit===undefined||rawUnit===null||rawUnit===''?'unknown':Number(rawUnit);
 if(units!=='unknown'&&units!==0&&units!==4)throw Error('DWG: unità del disegno diverse da millimetri (INSUNITS '+units+').');
 if((units==='unknown'||units===0)&&!unitConfirmed)throw Error('DWG: unità assenti o non definite. Conferma i millimetri con la scheda originale del produttore.');
 const entities=database.entities.filter(e=>e&&!e.isInPaperSpace&&e.isVisible!==true&&e.isVisible!==1);
 const names=[...new Set(entities.map(e=>String(e.layer||'0')))];
 const selected=new Set(layers.map(x=>String(x).trim().toUpperCase()).filter(Boolean));
 if(!selected.size&&names.length>1)throw Error('DWG: presenti più layer ('+names.slice(0,16).join(', ')+'). Inserisci i layer contenenti SOLO i tagli.');
 for(const name of selected)if(!names.some(n=>n.toUpperCase()===name))throw Error('DWG: layer inesistente: '+name);
 const valid=entities.filter(e=>!selected.size||selected.has(String(e.layer||'0').toUpperCase()));
 const holes=[],polys=[],unsupported=[];
 for(const e of valid) {
  const type=String(e.type||'').toUpperCase();
  if(type==='CIRCLE'){
   const p=e.center||{},r=Number(e.radius),normal=e.extrusionDirection||{z:1};
   if(!safe(p.x)||!safe(p.y)||!safe(r)||r<=0||r>300||Math.abs(Number(p.z||0))>0.001||Math.abs(Number(normal.z??1)-1)>0.001){unsupported.push('CIRCLE');continue}
   holes.push({x:Number(p.x),y:Number(p.y),r});
  } else if(type==='LWPOLYLINE'){
   const points=e.vertices||[];
   const isClosed=(Number(e.flag||0)&1)!==0;
   if(!isClosed||points.length<3||points.length>300||Math.abs(Number(e.elevation||0))>0.001||points.some(p=>!safe(p.x)||!safe(p.y)||Math.abs(Number(p.bulge||0))>0.00000001)){
    unsupported.push('LWPOLYLINE aperta/curva');continue;
   }
   const v=points.map(p=>[Number(p.x),Number(p.y)]);
   if(v.length>3&&Math.hypot(v[0][0]-v.at(-1)[0],v[0][1]-v.at(-1)[1])<0.000001)v.pop();
   if(v.length<3){unsupported.push('LWPOLYLINE degenerata');continue}
   polys.push(v);
  } else {
   unsupported.push(type||'UNKNOWN');
  }
 }
 if(unsupported.length)throw Error('DWG: sul layer selezionato ci sono entità non convertibili in tagli sicuri: '+[...new Set(unsupported)].slice(0,9).join(', ')+'. Isola i contorni chiusi e i cerchi su un layer dedicato.');
 if(!holes.length&&!polys.length)throw Error('DWG: nessun foro circolare o contorno chiuso riconosciuto. Non verranno creati tagli.');
 if(holes.length>80||polys.length>40)throw Error('DWG: troppi elementi per una lavorazione: seleziona soltanto il layer di taglio.');
 const pts=[...holes.flatMap(h=>[[h.x-h.r,h.y-h.r],[h.x+h.r,h.y+h.r]]),...polys.flat()];
 const cx=(Math.min(...pts.map(p=>p[0]))+Math.max(...pts.map(p=>p[0])))/2;
 const cy=(Math.min(...pts.map(p=>p[1]))+Math.max(...pts.map(p=>p[1])))/2;
 const round=n=>Math.round(n*10000)/10000;
 return {cuts:{holes:holes.map(h=>({x:round(h.x-cx),y:round(h.y-cy),r:round(h.r)})),cutouts:polys.map(poly=>poly.map(p=>[round(p[0]-cx),round(p[1]-cy)])),origin:[round(cx),round(cy)]},layers:names,ignored:[],warning:'DWG interpretato nel browser (LibreDWG GPL-3.0). Punto di origine centrato sul pattern: verificare posizione, quote, spessori e scheda del produttore. Non è un file CNC.',format:'DWG'};
}
async function parseDwg(file,layers=[],unitConfirmed=false) {
 if(!file||!/\.dwg$/i.test(file.name)||file.size<128||file.size>12*1024*1024)throw Error('Seleziona un DWG valido, massimo 12 MB');
 const buf=new Uint8Array(await file.arrayBuffer());
 if(!/^AC10\d\d/.test(new TextDecoder().decode(buf.subarray(0,6))))throw Error('Firma DWG non riconosciuta');
 if(!engine)engine=import(MODULE).then(async lib=>({
  parser:await lib.LibreDwg.create(BASE),
  kind:lib.Dwg_File_Type.DWG
 })).catch(err=>{
   engine=null;
   throw Error('Motore DWG locale non disponibile: controlla che /vendor/libredwg/dist/libredwg-web.js e /vendor/libredwg/wasm/libredwg-web.wasm siano presenti nel deployment. Dettaglio: '+err.message);
 });
 const {parser,kind}=await engine;
 const ptr=parser.dwg_read_data(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),kind);
 if(!ptr)throw Error('DWG non leggibile dalla libreria LibreDWG');
 let db;
 try{db=parser.convert(ptr)}finally{try{parser.dwg_free(ptr)}catch(_){}}
 return normalize(db,layers,unitConfirmed);
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
root.VSDWGImport={parseDwg,normalize,toDxf,license:'LibreDWG GPL-3.0',version:PACKAGE_VERSION};
if(typeof module!=='undefined'&&module.exports)module.exports={normalize,toDxf};
})(typeof window!=='undefined'?window:globalThis);
