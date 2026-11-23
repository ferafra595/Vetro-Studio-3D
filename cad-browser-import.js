/* VetroStudio - CAD nel browser; nessun servizio remoto di conversione.
 * STEP: occt-import-js WebAssembly (risorsa statica open source); DXF: entità ASCII supportate.
 * Mai interpretare il solido STEP come sagoma di taglio sul vetro.
 */
(function (root) {
  'use strict';
  const CDN = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/';
  let kernelPromise;
  function finiteArray(v) { return Array.isArray(v) && v.every(Number.isFinite); }
  function flattenTri(v) {
    if (!Array.isArray(v)) throw Error('Geometria mesh non valida');
    const flat = Array.isArray(v[0]) ? v.flat() : v;
    if (!finiteArray(flat)) throw Error('Coordinate mesh non valide');
    return flat;
  }
  function pad4(n) { return (n + 3) & ~3; }
  function blobGlb(meshes) {
    const views=[], accessors=[], materials=[], gltfMeshes=[], nodes=[], chunks=[];
    let cursor=0;
    function accessor(array, componentType, type, target, min, max) {
      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      const start=cursor;
      chunks.push({start,bytes}); cursor+=pad4(bytes.length);
      const view=views.push({buffer:0,byteOffset:start,byteLength:bytes.length,target})-1;
      const a={bufferView:view,componentType,count:array.length/(type==='VEC3'?3:1),type};
      if(min)a.min=min;if(max)a.max=max;
      return accessors.push(a)-1;
    }
    for (const item of meshes) {
      const p=flattenTri(item.attributes?.position?.array||[]);
      const ids=flattenTri(item.index?.array||[]);
      if(!p.length||p.length%3||!ids.length||ids.length%3) continue;
      const vc=p.length/3;
      if(vc>1000000||ids.length>3000000)throw Error('Modello STEP troppo complesso per il browser');
      if(ids.some(i=>!Number.isInteger(i)||i<0||i>=vc))throw Error('Indici STEP non validi');
      const positions=new Float32Array(p), indices=new Uint32Array(ids);
      const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<p.length;i++) {const axis=i%3;mins[axis]=Math.min(mins[axis],p[i]);maxs[axis]=Math.max(maxs[axis],p[i]);}
      const attributes={POSITION:accessor(positions,5126,'VEC3',34962,mins,maxs)};
      const nn=item.attributes?.normal?.array;
      if(nn){const n=flattenTri(nn);if(n.length===p.length)attributes.NORMAL=accessor(new Float32Array(n),5126,'VEC3',34962);}
      const ind=accessor(indices,5125,'SCALAR',34963);
      const col=Array.isArray(item.color)&&item.color.length>=3?item.color.slice(0,3):[0.65,0.67,0.7];
      const mat=materials.push({pbrMetallicRoughness:{baseColorFactor:[...col.map(v=>Math.min(1,Math.max(0,v))),1],metallicFactor:0.6,roughnessFactor:0.36},doubleSided:true})-1;
      const m=gltfMeshes.push({name:String(item.name||'Componente'),primitives:[{attributes,indices:ind,mode:4,material:mat}]})-1;
      nodes.push({name:String(item.name||'Componente'),mesh:m});
    }
    if(!nodes.length)throw Error('STEP senza solidi triangolabili');
    const bin=new Uint8Array(cursor);
    for(const ch of chunks)bin.set(ch.bytes,ch.start);
    const json={asset:{version:'2.0',generator:'VetroStudio browser STEP importer'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes:gltfMeshes,accessors,bufferViews:views,buffers:[{byteLength:bin.length}],materials};
    const encoded=new TextEncoder().encode(JSON.stringify(json));
    const jsonLength=pad4(encoded.length), total=12+8+jsonLength+8+bin.length;
    const out=new ArrayBuffer(total), dv=new DataView(out), bytes=new Uint8Array(out);let off=0;
    dv.setUint32(off,0x46546c67,true);off+=4;dv.setUint32(off,2,true);off+=4;dv.setUint32(off,total,true);off+=4;
    dv.setUint32(off,jsonLength,true);off+=4;dv.setUint32(off,0x4e4f534a,true);off+=4;
    bytes.fill(32,off,off+jsonLength);bytes.set(encoded,off);off+=jsonLength;
    dv.setUint32(off,bin.length,true);off+=4;dv.setUint32(off,0x004e4942,true);off+=4;bytes.set(bin,off);
    return {bytes,components:nodes.length};
  }
  function loadOCCT() {
    if(kernelPromise)return kernelPromise;
    kernelPromise=new Promise((resolve,reject)=>{
      if(typeof root.occtimportjs==='function')return root.occtimportjs({locateFile:name=>CDN+name}).then(resolve,reject);
      const s=document.createElement('script');s.src=CDN+'occt-import-js.js';s.async=true;
      s.onload=()=>{if(typeof root.occtimportjs!=='function')return reject(Error('Motore STEP non disponibile'));root.occtimportjs({locateFile:name=>CDN+name}).then(resolve,reject)};
      s.onerror=()=>reject(Error('Impossibile scaricare il motore gratuito STEP. Verifica rete o blocchi CDN.'));
      document.head.append(s);
    }).catch(e=>{kernelPromise=null;throw e});
    return kernelPromise;
  }
  async function stepToGlb(file) {
    if(!/\.(step|stp)$/i.test(file.name))throw Error('Il file selezionato non è STEP');
    if(file.size>12*1024*1024)throw Error('STEP maggiore di 12 MB');
    const raw=new Uint8Array(await file.arrayBuffer()),header=new TextDecoder().decode(raw.slice(0,300));
    if(!header.includes('ISO-10303-21'))throw Error('Firma STEP non valida');
    const kernel=await loadOCCT(),res=kernel.ReadStepFile(raw,{linearUnit:'millimeter'});
    if(!res?.success||!Array.isArray(res.meshes))throw Error('STEP non leggibile dal motore CAD');
    const glb=blobGlb(res.meshes);
    return {bytes:glb.bytes,components:glb.components,warning:'Confronta scala, orientamento e punti di aggancio con il produttore.'};
  }
  function parseDxf(text, requestedLayers=[]) {
    if(/AutoCAD Binary DXF/i.test(text.slice(0,32)))throw Error('DXF binario non supportato; esporta DXF ASCII');
    const lines=text.replace(/\r/g,'').split('\n');const pairs=[];
    for(let i=0;i+1<lines.length;i+=2)pairs.push([lines[i].trim(),lines[i+1].trim()]);
    let section='',units=null,current=null,entities=[];
    for(let i=0;i<pairs.length;i++){
      const [key,val]=pairs[i];
      if(key==='9'&&val==='$INSUNITS'&&pairs[i+1])units=Number(pairs[i+1][1]);
      if(key==='0'&&val==='SECTION'&&pairs[i+1]?.[0]==='2'){section=pairs[i+1][1];i++;continue;}
      if(key==='0'&&val==='ENDSEC'){if(current){entities.push(current);current=null}section='';continue;}
      if(section!=='ENTITIES')continue;
      if(key==='0'){if(current)entities.push(current);current={type:val,data:[]};}
      else if(current)current.data.push([Number(key),val]);
    }
    if(current)entities.push(current);
    if(units!==4)throw Error('Unità DXF non certificate in mm: serve $INSUNITS = 4');
    const selected=new Set(requestedLayers.map(x=>String(x).trim().toUpperCase()).filter(Boolean));
    const allLayers=[...new Set(entities.map(e=>e.data.find(d=>d[0]===8)?.[1]||'0'))];
    if(!selected.size&&allLayers.length>1)throw Error('Il DXF contiene più layer ('+allLayers.slice(0,15).join(', ')+'). Indica i layer di taglio prima di estrarre le lavorazioni.');
    for(const requested of selected)if(!allLayers.some(layer=>layer.toUpperCase()===requested))throw Error('Layer non trovato nel DXF: '+requested);
    const holes=[],cutouts=[],ignored=[];let seen=0;
    const get=(e,key,def=0)=>{const v=e.data.find(x=>x[0]===key);return v?Number(v[1]):def};
    for(const e of entities){
      const layer=e.data.find(d=>d[0]===8)?.[1]||'0';
      if(selected.size&&!selected.has(layer.toUpperCase()))continue;
      if(e.type==='CIRCLE'){
        const x=get(e,10),y=get(e,20),r=get(e,40),z=get(e,30),normalZ=get(e,230,1);
        if(![x,y,r,z,normalZ].every(Number.isFinite)||r<=0||Math.abs(z)>1e-6||Math.abs(normalZ-1)>1e-6){ignored.push('Cerchio con quote/piano non supportati su '+layer);continue;}
        holes.push({x,y,r});seen++;
      }else if(e.type==='LWPOLYLINE'){
        const flag=get(e,70),z=get(e,38),v=[];let at=null,bulge=false;
        for(const [k,val] of e.data){if(k===10){if(at)v.push(at);at=[Number(val),0];}if(k===20&&at)at[1]=Number(val);if(k===42&&Math.abs(Number(val))>1e-9)bulge=true;}
        if(at)v.push(at);
        if(v.length>1&&Math.hypot(v[0][0]-v.at(-1)[0],v[0][1]-v.at(-1)[1])<1e-8)v.pop();
        if((flag&1)&&v.length>=3&&!bulge&&Math.abs(z)<1e-6&&v.every(finiteArray)){cutouts.push(v);seen++;}
        else ignored.push('Polilinea aperta/curva/non planare su '+layer);
      }else ignored.push(e.type+' su '+layer);
    }
    if(!seen)throw Error('Nessun foro o contorno riconosciuto. Seleziona i layer di taglio o verifica il DXF.');
    if(holes.length>80||cutouts.length>40)throw Error('Troppi tagli: verifica layer/elementi del DXF');
    const coords=[...holes.flatMap(h=>[[h.x-h.r,h.y-h.r],[h.x+h.r,h.y+h.r]]),...cutouts.flat()];
    const minx=Math.min(...coords.map(p=>p[0])),maxx=Math.max(...coords.map(p=>p[0]));
    const miny=Math.min(...coords.map(p=>p[1])),maxy=Math.max(...coords.map(p=>p[1]));
    const cx=(minx+maxx)/2,cy=(miny+maxy)/2;
    const fixed=n=>Math.round(n*10000)/10000;
    return {cuts:{holes:holes.map(h=>({...h,x:fixed(h.x-cx),y:fixed(h.y-cy)})),cutouts:cutouts.map(p=>p.map(q=>[fixed(q[0]-cx),fixed(q[1]-cy)])),origin:[cx,cy]},layers:allLayers,ignored,warning:'L’origine del pattern viene centrata automaticamente: verificare il riferimento di fissaggio e tutte le quote.'};
  }
  root.VSCADBrowser={stepToGlb,parseDxf,blobGlb};
  if(typeof module!=='undefined'&&module.exports)module.exports={parseDxf,blobGlb};
})(typeof window!=='undefined'?window:globalThis);
