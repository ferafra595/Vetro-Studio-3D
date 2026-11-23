/* Browser smoke test for the vendored DWG/STEP WebAssembly modules.
   Tests loading, not the precision of a customer's manufacturing geometry. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const publicRoot=path.resolve(__dirname,'../public');
const types={'.wasm':'application/wasm','.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8'};
const server=http.createServer((req,res)=>{
 if(req.url==='/__smoke'){res.setHeader('content-type','text/html');return res.end('<!doctype html><html><head><meta charset="utf-8"></head><body>CAD WASM Smoke</body></html>')}
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(publicRoot,'.'+pathname);
 if(!file.startsWith(publicRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end('Not found')}
 res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/__smoke');
  const dwg=await page.evaluate(async()=>{
    const mod=await import('/vendor/libredwg/dist/libredwg-web.js');
    if(typeof mod.LibreDwg?.create!=='function')throw Error('LibreDWG wrapper not exported');
    const db=await mod.LibreDwg.create(new URL('/vendor/libredwg/wasm',location.href).href);
    if(typeof db.dwg_read_data!=='function')throw Error('LibreDWG read API unavailable');
    return true;
  });
  assert.equal(dwg,true);
  await page.addScriptTag({url:'/vendor/occt/occt-import-js.js'});
  const step=await page.evaluate(async()=>{
    if(typeof window.occtimportjs!=='function')throw Error('OCCT factory missing');
    const kernel=await window.occtimportjs({locateFile:name=>'/vendor/occt/'+name});
    return typeof kernel.ReadStepFile==='function';
  });
  assert.equal(step,true);
  await page.addScriptTag({url:'/vendor/polygon-clipping/polygon-clipping.umd.min.js'});
  await page.addScriptTag({url:'/technical-glass-boolean.js'});
  const notch=await page.evaluate(()=>{
    const r=window.VSGlassCut.difference([[0,0],[100,0],[100,100],[0,100]],[[[-10,20],[20,20],[20,40],[-10,40]]]);
    return {area:r.removedArea,voids:r.voids.length,edge:r.edgeNotch};
  });
  assert.ok(Math.abs(notch.area-400)<1e-6);
  assert.equal(notch.voids,0);
  assert.equal(notch.edge,true);
  assert.deepEqual(errors,[]);
  console.log('PASS: browser loaded LibreDWG and OCCT WASM successfully on same origin');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
