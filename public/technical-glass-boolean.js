/* VetroStudio: 2D glass profile subtraction for edge notches and internal cutouts.
 * Uses polygon-clipping 0.15.7 (MIT) loaded from same origin before this file.
 * The output remains a preview until validated by the glass workshop.
 */
(function(root){
 'use strict';
 const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
 function ring(points){
  if(!Array.isArray(points)||points.length<3||points.length>1000||!points.every(finite))throw Error('Profilo non valido o troppo complesso');
  let ps=points.map(p=>[Number(p[0]),Number(p[1])]);
  if(Math.hypot(ps[0][0]-ps.at(-1)[0],ps[0][1]-ps.at(-1)[1])<1e-7)ps.pop();
  if(ps.length<3)throw Error('Profilo senza tre vertici distinti');
  return [...ps,ps[0]];
 }
 function signedArea(p){let area=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];area+=a[0]*b[1]-a[1]*b[0]}return area/2}
 function difference(outline,cutouts,clipper){
  if(!Array.isArray(cutouts)||!cutouts.length)return {outline:ring(outline).slice(0,-1),voids:[],removedArea:0,edgeNotch:false};
  const engine=clipper||root.polygonClipping;
  if(!engine||typeof engine.difference!=='function')throw Error('Motore geometrico per scassi laterali non disponibile');
  const base=ring(outline),clips=cutouts.map(poly=>[ring(poly)]),originalArea=Math.abs(signedArea(base));
  let result;
  try{result=engine.difference([base],...clips)}
  catch(err){throw Error('Impossibile sottrarre la lavorazione dal profilo: '+err.message)}
  if(!Array.isArray(result)||result.length!==1||!result[0].length)throw Error('La lavorazione divide o elimina la lastra: posizione non valida');
  const out=result[0].map(p=>ring(p).slice(0,-1));
  const areaAfter=Math.abs(signedArea(out[0]))-out.slice(1).reduce((n,h)=>n+Math.abs(signedArea(h)),0);
  if(!Number.isFinite(areaAfter)||originalArea-areaAfter<0.0001)throw Error('La lavorazione non interseca la lastra: sposta l’accessorio');
  if(areaAfter<=1||out[0].length>1000||out.some(p=>p.length>1000))throw Error('Profilo risultante troppo complesso o degenerato');
  // Difference may create new outer vertices for a notch or void rings for internal cuts.
  const edgeNotch=Math.abs(signedArea(out[0])-signedArea(base))>0.0001;
  return {outline:out[0],voids:out.slice(1),removedArea:originalArea-areaAfter,edgeNotch};
 }
 root.VSGlassCut={difference};
 if(typeof module!=='undefined'&&module.exports)module.exports={difference};
})(typeof window!=='undefined'?window:globalThis);
