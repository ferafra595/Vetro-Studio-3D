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
