'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const clipping=require('polygon-clipping');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const cadModule={exports:{}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../public/technical-glass-boolean.js'),'utf8'),{module:cadModule,globalThis:{}});
const {difference}=cadModule.exports;
const glass=[[0,0],[200,0],[200,100],[0,100]];
const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
test('Scasso sul bordo sinistro rimuove materiale senza foro fittizio',()=>{
 const r=difference(glass,[rect(-20,35,25,65)],clipping);
 assert.equal(r.voids.length,0);
 assert.equal(r.edgeNotch,true);
 assert.ok(Math.abs(r.removedArea-750)<1e-6);
 assert.ok(r.outline.length>4);
});
test('Scasso interno lascia un anello interno nella geometria',()=>{
 const r=difference(glass,[rect(20,35,45,65)],clipping);
 assert.equal(r.voids.length,1);
 assert.equal(r.edgeNotch,false);
 assert.ok(Math.abs(r.removedArea-750)<1e-6);
});
test('Taglio che divide il vetro in due parti viene bloccato',()=>{
 assert.throws(()=>difference(glass,[rect(80,-5,110,105)],clipping),/divide|elimina/);
});
test('Taglio esterno alla lastra non viene applicato',()=>{
 assert.throws(()=>difference(glass,[rect(250,10,280,50)],clipping),/non interseca/);
});
test('Una lastra senza tagli mantiene il contorno originale',()=>{
 const r=difference(glass,[],clipping);
 assert.equal(JSON.stringify(r.outline),JSON.stringify(glass));
 assert.equal(r.removedArea,0);
});
test('Due scassi su bordi opposti possono coesistere',()=>{
 const r=difference(glass,[rect(-5,20,15,40),rect(180,60,205,80)],clipping);
 assert.equal(r.voids.length,0);
 assert.ok(Math.abs(r.removedArea-700)<1e-6);
});
