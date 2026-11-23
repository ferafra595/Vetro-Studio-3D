// Test della normalizzazione geometrica DWG senza richiedere la libreria WASM.
const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const cadModule={exports:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/dwg-browser-import.js'),'utf8'),{module:cadModule,globalThis:{},URL});
const {normalize}=cadModule.exports;
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
test('Blocca contorni curvi non riconosciuti',()=>{
 const p=poly();p.vertices[0].bulge=0.5;
 assert.throws(()=>normalize(base([p])),/LWPOLYLINE/);
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
