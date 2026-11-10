/* VetroStudio Geometry Core — millimetres, dependency-free, usable in Node and browser.
   Geometry checks are drafting checks, NOT structural/manufacturing certification. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.VSGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-7;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const signedArea=points=>points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2;
function onSegment(p,a,b){return Math.abs(cross(a,b,p))<EPS&&p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS}
function segmentsIntersect(a,b,c,d){
 const x1=cross(a,b,c),x2=cross(a,b,d),x3=cross(c,d,a),x4=cross(c,d,b);
 if(((x1>EPS&&x2< -EPS)||(x1< -EPS&&x2>EPS))&&((x3>EPS&&x4< -EPS)||(x3< -EPS&&x4>EPS)))return true;
 return onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
}
function pointInside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
 const a=poly[i],b=poly[j];if(onSegment(p,a,b))return true;
 if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))hit=!hit;
}return hit}
function distanceToSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;if(l2<EPS)return dist(p,a);const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2));return dist(p,[a[0]+t*dx,a[1]+t*dy])}
function slotOutline(h,segments=32){
 const r=h.r,L=h.length,a=(h.angle||0)*Math.PI/180,sep=Math.max(0,L-2*r),ux=Math.cos(a),uy=Math.sin(a);
 const c1=[h.x-ux*sep/2,h.y-uy*sep/2],c2=[h.x+ux*sep/2,h.y+uy*sep/2],out=[];
 for(let i=0;i<=segments/2;i++){const t=a-Math.PI/2+Math.PI*i/(segments/2);out.push([c2[0]+r*Math.cos(t),c2[1]+r*Math.sin(t)])}
 for(let i=0;i<=segments/2;i++){const t=a+Math.PI/2+Math.PI*i/(segments/2);out.push([c1[0]+r*Math.cos(t),c1[1]+r*Math.sin(t)])}
 return out;
}
function validate(points,holes=[]){
 if(!Array.isArray(points)||points.length<3)return {ok:false,error:'La sagoma richiede almeno tre vertici'};
 if(points.length>300)return {ok:false,error:'La sagoma supera il limite di 300 vertici'};
 if(points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!finite(v))))return {ok:false,error:'Coordinate non numeriche o non valide'};
 const n=points.length;
 for(let i=0;i<n;i++)if(dist(points[i],points[(i+1)%n])<.1)return {ok:false,error:`Lato ${i+1} troppo corto o vertici duplicati`};
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   if(j===i+1||(i===0&&j===n-1))continue;
   if(segmentsIntersect(points[i],points[(i+1)%n],points[j],points[(j+1)%n]))return {ok:false,error:`Contorno auto-intersecante tra lati ${i+1} e ${j+1}`};
 }
 const area=Math.abs(signedArea(points));if(area<1)return {ok:false,error:'Area della sagoma insufficiente'};
 const safeHoles=[],shapes=[];
 for(let i=0;i<holes.length;i++){
  const h=holes[i],p=[h.x,h.y],r=h.r;
  if(!finite(h.x)||!finite(h.y)||!finite(r)||r<=0)return {ok:false,error:`Foro ${i+1}: coordinate o raggio non validi`};
  if(h.type==='slot'&&(!finite(h.length)||h.length<=2*r||!finite(h.angle||0)))return {ok:false,error:`Asola ${i+1}: lunghezza insufficiente`};
  const outline=h.type==='slot'?slotOutline(h):Array.from({length:48},(_,j)=>[h.x+r*Math.cos(2*Math.PI*j/48),h.y+r*Math.sin(2*Math.PI*j/48)]);
  for(const q of outline){if(!pointInside(q,points))return {ok:false,error:`Foro/asola ${i+1} esterno alla lastra`};for(let k=0;k<n;k++)if(distanceToSegment(q,points[k],points[(k+1)%n])<.01)return {ok:false,error:`Foro/asola ${i+1} tocca il bordo`}}
  for(const previous of shapes){if(outline.some(q=>pointInside(q,previous))||previous.some(q=>pointInside(q,outline)))return {ok:false,error:`Fori/asole ${i+1}: sovrapposizione`};
   for(let a=0;a<outline.length;a++)for(let b=0;b<previous.length;b++)if(segmentsIntersect(outline[a],outline[(a+1)%outline.length],previous[b],previous[(b+1)%previous.length]))return {ok:false,error:`Fori/asole ${i+1}: intersezione`};}
  safeHoles.push(h);shapes.push(outline);
 }
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return {ok:true,areaMm2:area-holes.reduce((a,h)=>a+Math.PI*h.r*h.r+(h.type==='slot'?2*h.r*(h.length-2*h.r):0),0),outlineMm2:area,bounds:{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY},winding:signedArea(points)>0?'ccw':'cw'};
}
function normalize(points,holes=[]){const v=validate(points,holes);if(!v.ok)return v;const {minX,minY,width,height}=v.bounds;
 return {...v,points:points.map(p=>[+(p[0]-minX).toFixed(3),+(p[1]-minY).toFixed(3)]),holes:holes.map(h=>({...h,x:+(h.x-minX).toFixed(3),y:+(h.y-minY).toFixed(3)})),width,height};
}
// Pure 2D snap candidates: vertices, midpoints and orthogonal axis alignments.
function snapPoint(point,otherPolygons,tolerance=12){let best={point:[...point],type:null,distance:Infinity};const tryIt=(q,type)=>{const d=dist(point,q);if(d<=tolerance&&d<best.distance)best={point:[...q],type,distance:d}};
 for(const polygon of otherPolygons){for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length];tryIt(a,'vertice');tryIt([(a[0]+b[0])/2,(a[1]+b[1])/2],'punto medio');
  const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy;
  if(len2>EPS){const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/len2));tryIt([a[0]+t*dx,a[1]+t*dy],'bordo')}
 }}return best;
}
return Object.freeze({signedArea,segmentsIntersect,pointInside,distanceToSegment,validate,normalize,snapPoint,slotOutline});
});
