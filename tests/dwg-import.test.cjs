// Test della normalizzazione geometrica DWG senza richiedere la libreria WASM.
const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const cadModule={exports:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/dwg-browser-import.js'),'utf8'),{module:cadModule,globalThis:{},URL});
const {normalize,toDxf}=cadModule.exports;
const base=(entities,unit=4)=>({header:{insunits:unit},entities});
const circle=(x,y,r,layer='CUT')=>({type:'CIRCLE',layer,center:{x,y,z:0},radius:r,extrusionDirection:{z:1}});
const poly=(layer='CUT')=>({type:'LWPOLYLINE',layer,flag:1,elevation:0,vertices:[{x:0,y:0,bulge:0},{x:10,y:0,bulge:0},{x:10,y:5,bulge:0},{x:0,y:5,bulge:0}]});
test('Foro DWG in millimetri',()=>{
 const result=normalize(base([circle(100,100,7)]),[]);
 assert.equal(result.cuts.holes.length,1);
 assert.equal(result.cuts.holes[0].r,7);
 assert.equal(result.cuts.holes[0].x,0);
 assert.equal(result.cuts.origin[0],100);
});
test('Polilinea chiusa con quattro vertici',()=>{
 const result=normalize(base([poly()]),[]);
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.cuts.cutouts[0].length,4);
});
test('Blocca DWG in pollici',()=>{
 assert.throws(()=>normalize(base([circle(0,0,7)],1)),/millimetri/);
});
test('Richiede conferma esplicita se unità ignote',()=>{
 assert.throws(()=>normalize(base([circle(0,0,7)],null)),/unità/);
 assert.equal(normalize(base([circle(0,0,7)],null),[],true).cuts.holes.length,1);
});
test('Blocca layer misti se non selezionati',()=>{
 assert.throws(()=>normalize(base([circle(0,0,7),{type:'TEXT',layer:'NOTES'}])),/layer/);
 assert.equal(normalize(base([circle(0,0,7),{type:'TEXT',layer:'NOTES'}]),['CUT']).cuts.holes.length,1);
});
test('Riconosce i contorni curvi Bulge senza inventare fori',()=>{
 const p=poly();p.vertices[0].bulge=0.5;
 const result=normalize(base([p]));
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.curved,true);
});
test('Blocca INSERT sul layer di taglio',()=>{
 assert.throws(()=>normalize(base([{type:'INSERT',layer:'CUT'}])),/INSERT/);
});

test('DXF generato mantiene quote, millimetri e fori',()=>{
 const source=normalize(base([circle(100,80,7),circle(130,80,5)]));
 const dxf=toDxf(source.cuts);
 assert.match(dxf,/\$INSUNITS/);
 assert.match(dxf,/GLASS_CUT/);
 const cadModule2={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/cad-browser-import.js'),'utf8'),{module:cadModule2,globalThis:{}});
 const result=cadModule2.exports.parseDxf(dxf);
 assert.equal(result.cuts.holes.length,2);
 assert.equal(result.cuts.holes[0].r,7);
 assert.equal(result.cuts.holes[1].r,5);
 assert.equal(result.cuts.cutouts.length,0);
});
test('Non consente esportazione DXF senza geometrie',()=>{
 assert.throws(()=>toDxf({holes:[],cutouts:[]}),/Non ci sono/);
});
test('Contorno chiuso esportato e reimportato come sagoma',()=>{
 const source=normalize(base([poly()]));
 const dxf=toDxf(source.cuts);
 const cadModule2={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/cad-browser-import.js'),'utf8'),{module:cadModule2,globalThis:{}});
 const result=cadModule2.exports.parseDxf(dxf);
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.cuts.cutouts[0].length,4);
});

test('Riconosce una sagoma costruita da segmenti LINE indipendenti',()=>{
 const a=(x,y)=>({x,y,z:0});
 const lines=[[[0,0],[30,0]],[[30,30],[0,30]],[[30,0],[30,30]],[[0,30],[0,0]]].map(([p,q])=>({type:'LINE',layer:'CUT',startPoint:a(...p),endPoint:a(...q)}));
 const result=normalize(base(lines));
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.cuts.cutouts[0].length,4);
});
test('Riconosce un arco di polilinea tramite bulge positivo',()=>{
 const item={type:'LWPOLYLINE',layer:'CUT',flag:1,elevation:0,vertices:[{x:0,y:0,bulge:1},{x:16,y:0,bulge:0},{x:16,y:16,bulge:0},{x:0,y:16,bulge:0}]};
 const result=normalize(base([item]));
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.curved,true);
 assert.ok(result.cuts.cutouts[0].length>4);
});
test('Collega LINE e ARC in un unico profilo chiuso',()=>{
 const line=(p,q)=>({type:'LINE',layer:'CUT',startPoint:{x:p[0],y:p[1],z:0},endPoint:{x:q[0],y:q[1],z:0}});
 const arc={type:'ARC',layer:'CUT',center:{x:10,y:0,z:0},radius:10,startAngle:0,endAngle:Math.PI};
 const result=normalize(base([line([0,0],[20,0]),arc]));
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.curved,true);
});
test('Un arco aperto senza continuità non produce un taglio',()=>{
 const arc={type:'ARC',layer:'CUT',center:{x:0,y:0,z:0},radius:10,startAngle:0,endAngle:Math.PI};
 assert.throws(()=>normalize(base([arc])),/aperti/);
});
test('Mostra statistiche delle entità anche quando non ci sono fori',()=>{
 const data=base([{type:'LINE',layer:'GLASS',startPoint:{x:0,y:0},endPoint:{x:1,y:0}},{type:'DIMENSION',layer:'QUOTES'}]);
 const result=normalize;
 const summary=cadModule.exports.summarize(data);
 assert.equal(summary.layers.GLASS.types.LINE,1);
 assert.equal(summary.layers.QUOTES.types.DIMENSION,1);
});

test('DXF convertito da LibreDWG: legge layer e LINE senza dipendere da convert(ptr)',()=>{
 const sample=['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
 '0','SECTION','2','ENTITIES',
 '0','LINE','8','GLASS_CUT','10','0','20','0','11','20','21','0',
 '0','LINE','8','GLASS_CUT','10','20','20','0','11','20','21','15',
 '0','LINE','8','GLASS_CUT','10','20','20','15','11','0','21','15',
 '0','LINE','8','GLASS_CUT','10','0','20','15','11','0','21','0',
 '0','TEXT','8','NOTES','1','QUOTA',
 '0','ENDSEC','0','EOF'].join('\n')+'\n';
 const db=cadModule.exports.parseConvertedDxf(sample);
 assert.equal(db.entities.length,5);
 assert.equal(db.header.insunits,4);
 assert.equal(cadModule.exports.summarize(db).layers.GLASS_CUT.types.LINE,4);
 const result=normalize(db,['GLASS_CUT']);
 assert.equal(result.cuts.cutouts.length,1);
 assert.equal(result.cuts.cutouts[0].length,4);
});
test('DXF convertito: traduce gli angoli ARC da gradi a radianti',()=>{
 const sample=['0','SECTION','2','ENTITIES','0','ARC','8','CUT','10','0','20','0','40','8','50','90','51','180','0','ENDSEC','0','EOF'].join('\n');
 const db=cadModule.exports.parseConvertedDxf(sample);
 assert.ok(Math.abs(db.entities[0].startAngle-Math.PI/2)<1e-8);
 assert.ok(Math.abs(db.entities[0].endAngle-Math.PI)<1e-8);
});
test('DXF convertito senza Model Space segnala assenza entità',()=>{
 const sample=['0','SECTION','2','HEADER','0','ENDSEC','0','SECTION','2','ENTITIES','0','ENDSEC','0','EOF'].join('\n');
 const db=cadModule.exports.parseConvertedDxf(sample);
 assert.equal(db.entities.length,0);
});

test('Da un layer misto individua solo profili chiusi candidati senza selezione automatica',()=>{
 const P=(x,y)=>({x,y,z:0});
 const lines=[[[0,0],[25,0]],[[25,0],[25,15]],[[25,15],[0,15]],[[0,15],[0,0]]].map(([a,b])=>({type:'LINE',layer:'0',startPoint:P(...a),endPoint:P(...b)}));
 const report=cadModule.exports.geometricCandidates(base([...lines,{type:'TEXT',layer:'0'}, {type:'SPLINE',layer:'0'}]));
 assert.equal(report.candidates.filter(c=>c.kind==='contorno').length,1);
 assert.equal(report.candidates[0].width,25);
 assert.equal(report.candidates[0].height,15);
 assert.throws(()=>cadModule.exports.cutsFromCandidates(report,[]),/Seleziona almeno/);
 const selected=cadModule.exports.cutsFromCandidates(report,[report.candidates[0].id]);
 assert.equal(selected.cuts.cutouts.length,1);
});
test('Non trasforma un contorno aperto in una lavorazione',()=>{
 const P=(x,y)=>({x,y,z:0});
 const open=[[[0,0],[25,0]],[[25,0],[25,15]]].map(([a,b])=>({type:'LINE',layer:'0',startPoint:P(...a),endPoint:P(...b)}));
 const report=cadModule.exports.geometricCandidates(base(open));
 assert.equal(report.candidates.length,0);
});

test('Riconosce AUTOMATICAMENTE tasca laterale con due Ø16 e interasse 59 mm, senza selezioni',()=>{
 const clipModule={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/vendor/polygon-clipping/polygon-clipping.umd.min.js'),'utf8'),{module:clipModule,exports:clipModule.exports});
 const P=(x,y)=>({x,y,z:0});
 const lines=[
  {type:'LINE',layer:'0',startPoint:P(0,0),endPoint:P(39,0)},
  {type:'LINE',layer:'0',startPoint:P(0,59),endPoint:P(39,59)}
 ];
 const arcs=[
  {type:'ARC',layer:'0',center:P(39,0),radius:8,startAngle:0,endAngle:Math.PI},
  {type:'ARC',layer:'0',center:P(39,59),radius:8,startAngle:Math.PI,endAngle:Math.PI*2}
 ];
 const garbage=[{type:'SPLINE',layer:'0'},{type:'DIMENSION',layer:'FORMAT'},{type:'CIRCLE',layer:'0',center:P(400,400),radius:3}];
 const r=cadModule.exports.autoHingeNotch(base([...lines,...arcs,...garbage]),clipModule.exports);
 assert.equal(r.status,'matched',r.reason);
 assert.equal(r.dimensions.diameter,16);
 assert.equal(r.dimensions.centerSpacing,59);
 assert.equal(r.dimensions.notchDepth,39);
 assert.equal(r.cuts.holes.length,0);
 assert.equal(r.cuts.cutouts.length,1);
 assert.ok(r.cuts.cutouts[0].length>12);
});
test('Non inventa la profondità dello scasso quando mancano i segmenti CAD',()=>{
 const clipModule={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/vendor/polygon-clipping/polygon-clipping.umd.min.js'),'utf8'),{module:clipModule,exports:clipModule.exports});
 const P=(x,y)=>({x,y,z:0});
 const arcs=[
  {type:'ARC',layer:'0',center:P(39,0),radius:8,startAngle:0,endAngle:Math.PI},
  {type:'ARC',layer:'0',center:P(39,59),radius:8,startAngle:Math.PI,endAngle:Math.PI*2}
 ];
 const r=cadModule.exports.autoHingeNotch(base(arcs),clipModule.exports);
 assert.equal(r.status,'not_found');
});

test('Riconosce la tasca anche se le due linee orizzontali sono segmenti di una POLYLINE',()=>{
 const clipModule={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/vendor/polygon-clipping/polygon-clipping.umd.min.js'),'utf8'),{module:clipModule,exports:clipModule.exports});
 const e=[
  {type:'LWPOLYLINE',layer:'0',flag:0,vertices:[{x:0,y:0},{x:39,y:0},{x:39,y:59},{x:0,y:59}]},
  {type:'ARC',layer:'0',center:{x:39,y:0},radius:8,startAngle:0,endAngle:Math.PI},
  {type:'ARC',layer:'0',center:{x:39,y:59},radius:8,startAngle:Math.PI,endAngle:Math.PI*2}
 ];
 const r=cadModule.exports.autoHingeNotch(base(e),clipModule.exports);
 assert.equal(r.status,'matched',r.reason);
 assert.equal(r.dimensions.notchDepth,39);
 assert.equal(r.cuts.cutouts.length,1);
});

test('Una cerniera riconosciuta e agganciata al bordo produce uno scasso, non due fori',()=>{
 const clipModule={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/vendor/polygon-clipping/polygon-clipping.umd.min.js'),'utf8'),{module:clipModule,exports:clipModule.exports});
 const P=(x,y)=>({x,y,z:0});
 const ents=[
  {type:'LINE',layer:'CUT',startPoint:P(0,0),endPoint:P(39,0)},
  {type:'LINE',layer:'CUT',startPoint:P(0,59),endPoint:P(39,59)},
  {type:'ARC',layer:'CUT',center:P(39,0),radius:8,startAngle:0,endAngle:Math.PI},
  {type:'ARC',layer:'CUT',center:P(39,59),radius:8,startAngle:Math.PI,endAngle:Math.PI*2}
 ];
 const result=cadModule.exports.autoHingeNotch(base(ents),clipModule.exports);
 assert.equal(result.status,'matched',result.reason);
 assert.equal(result.cuts.edgeNotch,true);
 const poly=result.cuts.cutouts[0],x=-Math.min(...poly.map(p=>p[0])),y=70;
 const translated=poly.map(p=>[p[0]+x,p[1]+y]);
 const shapeMod={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/technical-glass-boolean.js'),'utf8'),{module:shapeMod,globalThis:{}});
 const cut=shapeMod.exports.difference([[0,0],[400,0],[400,400],[0,400]],[translated],clipModule.exports);
 assert.equal(cut.edgeNotch,true);
 assert.equal(cut.voids.length,0);
 assert.ok(cut.removedArea>0);
});

test('GS-MS reale: profilo aperto LINE/ARC riconosciuto con dimensioni CAD misurate',()=>{
 const P=(x,y)=>({x,y,z:0});
 const line=(id,a,b)=>({type:'LINE',layer:'0',handle:id,startPoint:P(...a),endPoint:P(...b)});
 const arc=(id,cy,startDeg,endDeg)=>({type:'ARC',layer:'0',handle:id,
  center:P(239.7689538922483,cy),radius:4,
  startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180});
 const entities=[
  line('293',[221.7689538922483,82.16284927055415],[221.7689538922483,68.97662017058528]),
  line('294',[235.9692828538556,82.16284927055415],[221.7689538922483,82.16284927055415]),
  arc('295',83.41284927055415,198.21,67.9757),
  line('296',[241.2689538922483,109.2047500270063],[241.2689538922483,87.12094851410197]),
  arc('297',112.9128492705541,292.0243,161.79),
  line('298',[221.7689538922483,114.1628492705541],[235.9692828538556,114.1628492705541]),
  line('299',[221.7689538922483,127.349078370523],[221.7689538922483,114.1628492705541]),
  {type:'LINE',layer:'FORMAT',startPoint:P(0,0),endPoint:P(200,0)},
  {type:'CIRCLE',layer:'0',center:P(106,80),radius:2.5}
 ];
 const parsed=cadModule.exports.autoOpenEdgeNotch(base(entities));
 assert.equal(parsed.status,'matched',parsed.reason);
 assert.equal(parsed.dimensions.diameter,8);
 assert.equal(parsed.dimensions.centerSpacing,29.5);
 assert.equal(parsed.dimensions.notchDepth,19.5);
 assert.equal(parsed.dimensions.opening,32);
 assert.equal(parsed.cuts.holes.length,0);
 assert.equal(parsed.cuts.cutouts.length,1);
 assert.equal(parsed.cuts.edgeNotch,true);
 assert.equal(parsed.cuts.exactPaths?.[0]?.points?.length,6);
 assert.equal(parsed.cuts.exactPaths?.[0]?.bulges?.filter(b=>Math.abs(b)>0.1).length,2);
 const dxf=cadModule.exports.toDxf(parsed.cuts);
 assert.equal((dxf.match(/\n42\n/g)||[]).length,2);
 assert.ok(dxf.includes('100\nAcDbEntity\n8\nGLASS_CUT\n100\nAcDbPolyline\n'));
 assert.ok(dxf.includes('$INSUNITS\n70\n4\n'));
 const outline=parsed.cuts.cutouts[0];
 assert.ok(outline.length>30);
 const xs=outline.map(p=>p[0]),offset=-Math.min(...xs);
 const ring=outline.map(p=>[p[0]+offset,p[1]+140]);
 const clipModule={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/vendor/polygon-clipping/polygon-clipping.umd.min.js'),'utf8'),{module:clipModule,exports:clipModule.exports});
 const glassModule={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/technical-glass-boolean.js'),'utf8'),{module:glassModule,globalThis:{}});
 const shape=glassModule.exports.difference([[0,0],[500,0],[500,400],[0,400]],[ring],clipModule.exports);
 assert.equal(shape.edgeNotch,true);
 assert.equal(shape.voids.length,0);
});
