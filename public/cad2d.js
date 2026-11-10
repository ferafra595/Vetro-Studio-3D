/* VetroStudio CAD 2D — editor coordinato in millimetri, nessuna dipendenza aggiuntiva. */
(()=>{'use strict';
const $=id=>document.getElementById(id), G=()=>window.VSGeometry;
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const round=v=>Math.round(v*1000)/1000;
let s=null;
const ico={select:'↖',vertex:'⌁',poly:'⬡',hole:'◎',slot:'▭',pan:'✥',measure:'↔'};
const snapTypes=['vertex','edge'];
function snapshot(){return JSON.stringify({pts:s.pts,holes:s.holes,anchors:s.anchors,bulges:s.bulges,constraints:s.constraints})}
function record(){s.undo.push(snapshot());if(s.undo.length>100)s.undo.shift();s.redo.length=0}
function restore(v){const o=JSON.parse(v);s.pts=o.pts;s.holes=o.holes;s.anchors=o.anchors||{};s.bulges=o.bulges||[];s.constraints=o.constraints||{};s.selected=null;render()}
function undo(){if(s.undo.length){s.redo.push(snapshot());restore(s.undo.pop())}}
function redo(){if(s.redo.length){s.undo.push(snapshot());restore(s.redo.pop())}}
function bounds(){let outline=sampled();let x=outline.map(p=>p[0]),y=outline.map(p=>p[1]);return {minX:Math.min(...x),minY:Math.min(...y),maxX:Math.max(...x),maxY:Math.max(...y)}}
function sampled(){try{return G().tessellateProfile(s.pts,s.bulges,.35)}catch(e){return s.pts}}
function constrainMovedPoint(index){const n=s.pts.length;for(const [key,axis] of Object.entries(s.constraints||{})){
 const i=+key,j=(i+1)%n;if(i!==index&&j!==index)continue;
 const other=i===index?j:i;
 if(axis==='horizontal')s.pts[other][1]=s.pts[index][1];
 if(axis==='vertical')s.pts[other][0]=s.pts[index][0];
 }}
function clearArcs(){s.bulges=[];s.constraints={}}
function fit(){let b=bounds(),w=Math.max(100,b.maxX-b.minX),h=Math.max(100,b.maxY-b.minY);s.scale=Math.min(790/w,510/h);s.cx=(b.minX+b.maxX)/2;s.cy=(b.minY+b.maxY)/2;render()}
function xy(p){return [500+(p[0]-s.cx)*s.scale,320-(p[1]-s.cy)*s.scale]}
function reverse(x,y){return [round((x-500)/s.scale+s.cx),round((320-y)/s.scale+s.cy)]}
function pointer(e){const svg=$('cadCanvas'),r=svg.getBoundingClientRect();return [(e.clientX-r.left)*1000/r.width,(e.clientY-r.top)*640/r.height]}
function snap(p){
 if(!s.snap)return p;
 const tolerance=13/s.scale,choices=[];
 if(s.gridOn)choices.push({point:p.map(v=>Math.round(v/s.grid)*s.grid),type:'griglia',distance:Math.hypot(...p.map(v=>v-Math.round(v/s.grid)*s.grid))});
 if(s.snapObj){
  choices.push(...G().snapCandidates(p,s.pts,s.holes).filter(c=>!(s.drag?.type==='point'&&c.type==='vertice'&&c.distance<.001)));
  // Axis-alignment guides from other vertices (without forcing the orthogonal coordinate).
  for(const v of s.pts){choices.push({point:[v[0],p[1]],type:'allineamento X',distance:Math.abs(v[0]-p[0])},{point:[p[0],v[1]],type:'allineamento Y',distance:Math.abs(v[1]-p[1])})}
 }
 const priority={'vertice':0,'centro foro':0,'punto medio':1,'intersezione':1,'perpendicolare/bordo':2,'allineamento X':3,'allineamento Y':3,'griglia':4};
 choices.sort((a,b)=>(a.distance-b.distance)||((priority[a.type]||5)-(priority[b.type]||5)));
 const best=choices.find(c=>c.distance<=tolerance&&!(s.drag?.type==='point'&&Math.hypot(c.point[0]-s.pts[s.drag.index][0],c.point[1]-s.pts[s.drag.index][1])<.01));s.snapMessage=best?.type||'';
 return best?best.point.map(round):p;
}
function setTool(t){s.tool=t;s.pending=[];s.selected=null;render()}
function setStatus(msg,err=false){let el=$('cadStatus');if(el){el.textContent=msg;el.className=err?'cad-status bad':'cad-status'}}
function toolbar(){return `<button data-tool="select">↖ Seleziona</button><button data-tool="poly">⬡ Poligono</button><button data-tool="vertex">＋ Vertice</button><button data-tool="hole">◎ Foro</button><button data-tool="slot">▭ Asola</button><button data-tool="measure">↔ Quota</button><button data-tool="pan">✥ Vista</button>`}
function open(){const o=window.VSCADBridge?.selected();if(!o){if(window.VS?.tab)window.VS.tab('objects');alert('Seleziona una lastra o uno specchio nel 3D prima di aprire il CAD 2D.');return}
 s={id:o.id,name:o.name,pts:structuredClone(o.cadProfile?.points||o.shape||[[0,0],[o.w,0],[o.w,o.h],[0,o.h]]),bulges:structuredClone(o.cadProfile?.bulges||[]),constraints:structuredClone(o.cadProfile?.constraints||{}),holes:structuredClone(o.holes||[]),grid:10,gridOn:true,snap:true,snapObj:true,tool:'select',selected:null,pending:[],undo:[],redo:[],scale:1,cx:o.w/2,cy:o.h/2,snapMessage:'',drag:null,anchors:{},showDimensions:true,showHoles:true,showContour:true};
 const el=document.createElement('div');el.id='cadRoot';el.innerHTML=`<div class="cad-shell"><header class="cad-header"><div><strong>VetroStudio <span>CAD 2D</span></strong><small id="cadSubtitle"></small></div><nav><button id="cadUndo">↶ Annulla</button><button id="cadRedo">↷ Ripristina</button><button id="cadClose">Torna al 3D</button><button id="cadApply" class="cad-primary">✓ Applica al 3D</button></nav></header><div class="cad-tools" id="cadTools">${toolbar()}<span class="cad-separator"></span><label>Passo <select id="cadGrid"><option>1</option><option>5</option><option selected>10</option><option>25</option><option>50</option><option>100</option></select> mm</label><label><input type="checkbox" id="cadSnap" checked> Snap</label><label><input type="checkbox" id="cadGridOn" checked> Griglia</label><button id="cadFit">Adatta</button><button id="cadZoomPlus">＋</button><button id="cadZoomMinus">−</button></div><div class="cad-work"><main class="cad-board"><svg id="cadCanvas" viewBox="0 0 1000 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Disegno tecnico 2D"></svg><div class="cad-hint" id="cadHint"></div><div class="cad-status" id="cadStatus"></div></main><aside class="cad-side"><div class="cad-card"><h3>Elemento selezionato</h3><div id="cadProps"></div></div><div class="cad-card"><h3>Forme rapide</h3><div class="cad-presets"><button data-shape="rectangle">Rettangolo</button><button data-shape="triangle">Triangolo</button><button data-shape="trapezoid">Trapezio</button><button data-shape="parallelogram">Parallelogramma</button><button data-shape="arch">Arco superiore</button><button data-shape="round">Angoli arrotondati</button><button data-shape="circle">Cerchio</button></div></div><div class="cad-card"><h3>Trasforma sagoma</h3><div class="cad-presets"><button id="cadMirrorX">Specchia X</button><button id="cadMirrorY">Specchia Y</button><button id="cadRotate">Ruota 90°</button><button id="cadCenter">Centra</button></div><div class="cad-dims" id="cadDimensions"></div></div><div class="cad-card"><h3>Livelli e visibilità</h3><label class="cad-layer"><input type="checkbox" id="cadLayerContour" checked> Contorno lastra</label><label class="cad-layer"><input type="checkbox" id="cadLayerHoles" checked> Forature e asole</label><label class="cad-layer"><input type="checkbox" id="cadLayerDims" checked> Quote e riferimenti</label><p class="cad-note">Nascondere un livello non lo elimina dal progetto.</p></div><div class="cad-card"><h3>Dettagli tecnici</h3><div id="cadStats"></div><p class="cad-note">Quote in mm. Le verifiche geometriche non certificano la fattibilità della lavorazione o la sicurezza del vetro.</p></div></aside></div></div>`;
 document.body.appendChild(el);document.body.classList.add('cad-open');bind();fit()}
function close(){document.body.classList.remove('cad-open');$('cadRoot')?.remove();s=null}
function bind(){const root=$('cadRoot');root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));root.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>preset(b.dataset.shape));
 $('cadClose').onclick=close;$('cadApply').onclick=apply;$('cadUndo').onclick=undo;$('cadRedo').onclick=redo;
 ['Contour','Holes','Dims'].forEach((name)=>{const id='cadLayer'+name;$(id).onchange=e=>{if(name==='Contour')s.showContour=e.target.checked;if(name==='Holes')s.showHoles=e.target.checked;if(name==='Dims')s.showDimensions=e.target.checked;render()}});
 $('cadGrid').onchange=e=>{s.grid=num(e.target.value,10);render()};$('cadSnap').onchange=e=>{s.snap=e.target.checked};$('cadGridOn').onchange=e=>{s.gridOn=e.target.checked;render()};$('cadFit').onclick=fit;$('cadZoomPlus').onclick=()=>zoom(1.25);$('cadZoomMinus').onclick=()=>zoom(.8);
 $('cadMirrorX').onclick=()=>transform(([x,y])=>[-x,y],true);$('cadMirrorY').onclick=()=>transform(([x,y])=>[x,-y],true);$('cadRotate').onclick=()=>transform(([x,y])=>[-y,x]);$('cadCenter').onclick=()=>transform(([x,y])=>[x-s.cx,y-s.cy]);
 const svg=$('cadCanvas');svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
 svg.addEventListener('dblclick',e=>{if(s.tool==='poly'){finishPoly();return}const edge=e.target.closest('[data-edge]');if(edge){insertEdge(+edge.dataset.edge,snap(reverse(...pointer(e))))}});
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:.89)},{passive:false});
 document.addEventListener('keydown',keyHandler)}
function keyHandler(e){if(!$('cadRoot')){document.removeEventListener('keydown',keyHandler);return}if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(e.key==='Escape'){if(s.pending.length){s.pending=[];render()}else close()};if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()};if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo()};if(e.key==='Delete'&&s.selected)removeSelected();if(e.key==='Enter'&&s.tool==='poly')finishPoly()}
function zoom(f){s.scale=Math.max(.015,Math.min(12,s.scale*f));render()}
function preset(t){const b=bounds(),w=Math.max(100,b.maxX-b.minX),h=Math.max(100,b.maxY-b.minY),x=b.minX,y=b.minY;let p;
 if(t==='rectangle')p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 if(t==='triangle')p=[[x,y],[x+w,y],[x+w*.5,y+h]];
 if(t==='trapezoid')p=[[x,y],[x+w,y],[x+w*.78,y+h],[x+w*.18,y+h]];
 if(t==='parallelogram')p=[[x,y],[x+w*.8,y],[x+w,y+h],[x+w*.2,y+h]];
 if(t==='arch'){p=[[x,y],[x+w,y],[x+w,y+h*.75]];for(let i=1;i<=32;i++){let ang=Math.PI*i/32;p.push([x+w/2+w/2*Math.cos(ang),y+h*.75+h*.25*Math.sin(ang)])}p.push([x,y+h*.75])}
 if(t==='round'){const r=Math.min(w,h)*.12;p=[];for(const [cx,cy,start] of [[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]])for(let i=0;i<=8;i++){const a=(start+i*90/8)*Math.PI/180;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}}
 if(t==='circle')p=Array.from({length:96},(_,i)=>[x+w/2+w/2*Math.cos(2*Math.PI*i/96),y+h/2+h/2*Math.sin(2*Math.PI*i/96)]);
 if(!p)return;record();clearArcs();s.pts=p.map(v=>v.map(round));s.holes=[];s.selected=null;fit()}
function transform(fn,mirror=false){record();if(mirror)s.bulges=s.bulges.map(b=>-b);let b=bounds(),pivot=[(b.minX+b.maxX)/2,(b.minY+b.maxY)/2];s.pts=s.pts.map(p=>{let v=fn([p[0]-pivot[0],p[1]-pivot[1]]);return [round(v[0]+pivot[0]),round(v[1]+pivot[1])]});s.holes=s.holes.map(h=>{let v=fn([h.x-pivot[0],h.y-pivot[1]]);return {...h,x:round(v[0]+pivot[0]),y:round(v[1]+pivot[1]),angle:h.type==='slot'?(h.angle+90)%180:h.angle}});fit()}
function fillet(i,r){
 const n=s.pts.length;if(n<3||!(r>0))return setStatus('Raggio non valido',true);
 if(Math.abs(s.bulges[(i+n-1)%n]||0)>1e-8||Math.abs(s.bulges[i]||0)>1e-8)return setStatus('Raccordo non applicabile a due lati già curvi',true);
 const c=s.pts[i],prev=s.pts[(i-1+n)%n],next=s.pts[(i+1)%n];
 const u=[prev[0]-c[0],prev[1]-c[1]],v=[next[0]-c[0],next[1]-c[1]];
 const lu=Math.hypot(...u),lv=Math.hypot(...v);if(lu<.1||lv<.1)return setStatus('Lati troppo corti',true);
 const a=u.map(x=>x/lu),b=v.map(x=>x/lv);let theta=Math.acos(Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1])));
 if(theta<.01||Math.abs(Math.PI-theta)<.01)return setStatus('Angolo non raccordabile',true);
 const t=r/Math.tan(theta/2);if(t>=Math.min(lu,lv)*.98)return setStatus('Raggio eccessivo rispetto ai lati',true);
 const bis=[a[0]+b[0],a[1]+b[1]],bl=Math.hypot(...bis);
 const center=[c[0]+bis[0]/bl*r/Math.sin(theta/2),c[1]+bis[1]/bl*r/Math.sin(theta/2)];
 const begin=[round(c[0]+a[0]*t),round(c[1]+a[1]*t)],end=[round(c[0]+b[0]*t),round(c[1]+b[1]*t)];
 let start=Math.atan2(begin[1]-center[1],begin[0]-center[0]),finish=Math.atan2(end[1]-center[1],end[0]-center[0]),delta=finish-start;
 while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
 const arcBulge=Math.tan(delta/4),nextPts=[...s.pts.slice(0,i),begin,end,...s.pts.slice(i+1)];
 const nextBulges=Array.from({length:n+1},(_,j)=>j===i?arcBulge:(j===(i-1+n+1)%(n+1)||j===i+1)?0:(j<i?s.bulges[j]||0:s.bulges[j-1]||0));
 let result=G().validate(G().tessellateProfile(nextPts,nextBulges,.35),s.holes);
 if(!result.ok)return setStatus('Raccordo non valido: '+result.error,true);
 record();s.pts=nextPts;s.bulges=nextBulges;s.constraints={};s.selected=null;render();
}
function insertEdge(i,p){record();clearArcs();s.pts.splice(i+1,0,p);s.selected={type:'point',index:i+1};render()}
function finishPoly(){if(s.pending.length>=3){record();clearArcs();s.pts=s.pending.map(p=>p.map(round));s.holes=[];s.pending=[];s.tool='select';fit()}else setStatus('Servono almeno tre punti per chiudere una sagoma.',true)}
function removeSelected(){if(!s.selected)return;let {type,index}=s.selected;if(type==='point'){if(s.pts.length<=3){setStatus('Sono necessari almeno tre vertici',true);return}record();clearArcs();s.pts.splice(index,1)}else if(type==='hole'){record();s.holes.splice(index,1);s.anchors={}}s.selected=null;render()}
function down(e){if(e.button!==0&&e.button!==1)return;const node=e.target.closest('[data-point],[data-hole],[data-edge]'),p=snap(reverse(...pointer(e)));
 if(e.button===1||s.tool==='pan'){s.drag={type:'pan',start:pointer(e),cx:s.cx,cy:s.cy};e.preventDefault();return}
 if(s.tool==='poly'){s.pending.push(p);render();return}
 if(s.tool==='hole'){record();s.holes.push({x:p[0],y:p[1],r:12});s.selected={type:'hole',index:s.holes.length-1};s.tool='select';render();return}
 if(s.tool==='slot'){if(!s.pending.length){s.pending=[p];render();return}const a=s.pending[0],b=p;let dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)+24;if(length<=24){setStatus('Definisci due punti distinti per l’asola',true);return}record();s.holes.push({type:'slot',x:round((a[0]+b[0])/2),y:round((a[1]+b[1])/2),r:12,length:round(length),angle:round(Math.atan2(dy,dx)*180/Math.PI)});s.selected={type:'hole',index:s.holes.length-1};s.pending=[];s.tool='select';render();return}
 if(s.tool==='vertex'){const edge=node?.closest('[data-edge]');if(edge){insertEdge(+edge.dataset.edge,p)}else{let result=nearestEdge(p);insertEdge(result.index,p)}s.tool='select';return}
 if(s.tool==='measure'){let edge=node?.closest('[data-edge]');if(edge){s.selected={type:'edge',index:+edge.dataset.edge};render()}return}
 if(node?.hasAttribute('data-edge')){s.selected={type:'edge',index:+node.dataset.edge};render();return}
 if(node?.hasAttribute('data-point')){s.selected={type:'point',index:+node.dataset.point};record();s.drag={type:'point',index:s.selected.index};}
 else if(node?.hasAttribute('data-hole')){s.selected={type:'hole',index:+node.dataset.hole};record();s.drag={type:'hole',index:s.selected.index};}
 else if(e.target.closest('[data-fill]')){s.selected={type:'shape'};record();s.drag={type:'shape',p,pts:structuredClone(s.pts),holes:structuredClone(s.holes)}}else s.selected=null;
 render();$('cadCanvas').setPointerCapture(e.pointerId)}
function move(e){if(!s.drag)return;const drag=s.drag,p=snap(reverse(...pointer(e)));if(drag.type==='pan'){const [x,y]=pointer(e);s.cx=drag.cx-(x-drag.start[0])/s.scale;s.cy=drag.cy+(y-drag.start[1])/s.scale}
 if(drag.type==='point'){s.pts[drag.index]=p;constrainMovedPoint(drag.index)}
 if(drag.type==='hole'){s.holes[drag.index].x=p[0];s.holes[drag.index].y=p[1]}
 if(drag.type==='shape'){let dx=p[0]-drag.p[0],dy=p[1]-drag.p[1];s.pts=drag.pts.map(v=>[round(v[0]+dx),round(v[1]+dy)]);s.holes=drag.holes.map(h=>({...h,x:round(h.x+dx),y:round(h.y+dy)}))}
 draw();}
function up(){if(!s.drag)return;s.drag=null;render()}
function nearestEdge(p){let best={index:0,distance:Infinity};for(let i=0;i<s.pts.length;i++){let a=s.pts[i],b=s.pts[(i+1)%s.pts.length],d=G().distanceToSegment(p,a,b);if(d<best.distance)best={index:i,distance:d}}return best}
function apply(){let r=G().validate(sampled(),s.holes);if(!r.ok){setStatus('Impossibile applicare: '+r.error,true);return}let applied=window.VSCADBridge.commit(sampled(),s.holes,{points:s.pts,bulges:s.bulges,constraints:s.constraints});if(applied.ok)close();else setStatus(applied.error||'Errore di applicazione',true)}
function mutate(fn){record();fn();requestAnimationFrame(()=>{if(s&&$('cadRoot'))render()})}
function editPoint(i,j,v){let value=Number(v);if(!Number.isFinite(value))return;mutate(()=>{s.pts[i][j]=round(value);constrainMovedPoint(i)})}
function editHole(i,k,v){let value=Number(v);if(!Number.isFinite(value))return;mutate(()=>{s.holes[i][k==='diameter'?'r':k]=round(k==='diameter'?value/2:value);if(k==='x'||k==='y')delete s.anchors[i]})}
function setHoleAnchor(i,edge){const b=bounds(),h=s.holes[i];mutate(()=>{if(edge==='none')delete s.anchors[i];else s.anchors[i]={edge,offset:round(edge==='left'?h.x-b.minX:edge==='right'?b.maxX-h.x:edge==='bottom'?h.y-b.minY:b.maxY-h.y)}})}
function resize(axis,v){
 const val=num(v),b=bounds(),old=axis==='x'?b.maxX-b.minX:b.maxY-b.minY;
 if(val<=0||old<=0){setStatus('Inserisci una dimensione positiva',true);return}
 const idx=axis==='x'?0:1,min=axis==='x'?b.minX:b.minY,factor=val/old;
 mutate(()=>{
  s.pts=s.pts.map(p=>p.map((c,j)=>j===idx?round(min+(c-min)*factor):c));
  s.holes=s.holes.map((h,i)=>{
   const an=s.anchors[i];let newH={...h,[axis]:round(min+(h[axis]-min)*factor)};
   if(an&&((axis==='x'&&['left','right'].includes(an.edge))||(axis==='y'&&['top','bottom'].includes(an.edge)))){
    newH[axis]=round((an.edge==='left'||an.edge==='bottom')?min+an.offset:min+val-an.offset);
   }
   return newH;
  });
 });
}
function dimensions(){const b=bounds();return {w:b.maxX-b.minX,h:b.maxY-b.minY}}
function props(){const el=$('cadProps'),d=s.selected;if(!el)return;
 if(!d){el.innerHTML='<p class="cad-muted">Seleziona un vertice, un lato, un foro o un’asola. Puoi trascinare gli elementi direttamente nel disegno.</p>';return}
 if(d.type==='point'){const p=s.pts[d.index];el.innerHTML=`<b>Vertice P${d.index+1}</b><div class="cad-two"><label>X (mm)<input id="cadX" type="number" step="0.001" value="${p[0]}"></label><label>Y (mm)<input id="cadY" type="number" step="0.001" value="${p[1]}"></label></div><label>Raggio raccordo (mm)<input id="cadFillet" type="number" min="0.1" step="0.1" placeholder="Es. 20"></label><button id="cadApplyFillet">Raccordo parametrico</button><label>Smusso (mm)<input id="cadChamfer" type="number" min="0.1" step="0.1" placeholder="Es. 15"></label><button id="cadApplyChamfer">Smussa angolo</button><button id="cadDelete" class="cad-danger">Elimina vertice</button>`;$('cadX').onchange=e=>editPoint(d.index,0,e.target.value);$('cadY').onchange=e=>editPoint(d.index,1,e.target.value);$('cadDelete').onclick=removeSelected;$('cadApplyFillet').onclick=()=>fillet(d.index,num($('cadFillet').value));$('cadApplyChamfer').onclick=()=>{const cut=num($('cadChamfer').value);try{const newPts=G().chamfer(s.pts,d.index,cut);mutate(()=>{s.pts=newPts;s.selected=null})}catch(err){setStatus(err.message,true)}};return}
 if(d.type==='edge'){let a=s.pts[d.index],b=s.pts[(d.index+1)%s.pts.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);el.innerHTML=`<b>Lato ${d.index+1}</b><p>Lunghezza: ${length.toFixed(2)} mm</p><label>Lunghezza desiderata (mm)<input type="number" id="cadEdgeLength" step="0.001" value="${length.toFixed(3)}"></label><div class="cad-presets"><button id="cadHorizontal">Orizzontale</button><button id="cadVertical">Verticale</button></div><button id="cadAddMid">Inserisci vertice centrale</button><hr><strong>Arco circolare parametrico</strong><label>Raggio (mm)<input type="number" id="cadArcRadius" min="0.01" step="0.1" value="${s.bulges[d.index]?round(G().arcGeometry(a,b,s.bulges[d.index]).radius):round(length)}"></label><label>Direzione<select id="cadArcSide"><option value="1">Sinistra del lato</option><option value="-1">Destra del lato</option></select></label><div class="cad-presets"><button id="cadApplyArc">Crea / modifica arco</button><button id="cadClearArc">Rendi rettilineo</button></div><label>Vincolo lato<select id="cadEdgeConstraint"><option value="none">Nessuno</option><option value="horizontal">Orizzontale</option><option value="vertical">Verticale</option></select></label>`;$('cadEdgeLength').onchange=e=>{let v=num(e.target.value);if(v<=0)return;mutate(()=>{let dx=b[0]-a[0],dy=b[1]-a[1];s.pts[(d.index+1)%s.pts.length]=[round(a[0]+dx*v/length),round(a[1]+dy*v/length)]})};$('cadArcSide').value=s.bulges[d.index]<0?'-1':'1';$('cadEdgeConstraint').value=s.constraints[d.index]||'none';
 $('cadApplyArc').onclick=()=>{try{const radius=Number($('cadArcRadius').value),side=Number($('cadArcSide').value);const bulge=G().bulgeFromRadius(s.pts[d.index],s.pts[(d.index+1)%s.pts.length],radius,side);mutate(()=>{s.bulges[d.index]=bulge})}catch(err){setStatus(err.message,true)}};
 $('cadClearArc').onclick=()=>mutate(()=>{s.bulges[d.index]=0});
 $('cadEdgeConstraint').onchange=e=>{const v=e.target.value;mutate(()=>{if(v==='none')delete s.constraints[d.index];else{s.constraints[d.index]=v;s.pts=G().alignEdge(s.pts,d.index,v);s.bulges[d.index]=0}})};
 $('cadAddMid').onclick=()=>insertEdge(d.index,[(a[0]+b[0])/2,(a[1]+b[1])/2]);['Horizontal','Vertical'].forEach(t=>{$('cad'+t).onclick=()=>{const pts=G().alignEdge(s.pts,d.index,t.toLowerCase());mutate(()=>{s.pts=pts;s.constraints[d.index]=t.toLowerCase();s.bulges[d.index]=0})}});return}
 if(d.type==='hole'){let h=s.holes[d.index];el.innerHTML=`<b>${h.type==='slot'?'Asola':'Foro'} ${d.index+1}</b><div class="cad-two"><label>X (mm)<input type="number" data-h="x" value="${h.x}"></label><label>Y (mm)<input type="number" data-h="y" value="${h.y}"></label><label>Diametro (mm)<input type="number" min="0.1" data-h="diameter" value="${round(h.r*2)}"></label>${h.type==='slot'?`<label>Lunghezza totale (mm)<input type="number" min="0.1" data-h="length" value="${h.length}"></label><label>Angolo (°)<input type="number" data-h="angle" value="${h.angle||0}"></label>`:''}</div><div id="cadAnchorControls"></div><button class="cad-danger" id="cadDelete">Elimina</button>`;el.querySelectorAll('[data-h]').forEach(input=>input.onchange=e=>editHole(d.index,e.target.dataset.h,e.target.value));$('cadDelete').onclick=removeSelected;const div=$('cadAnchorControls');div.innerHTML='<label>Distanza mantenuta da bordo<select id="cadAnchorSelect"><option value="none">Libero</option><option value="left">Sinistro</option><option value="right">Destro</option><option value="bottom">Inferiore</option><option value="top">Superiore</option></select></label>';const sel=$('cadAnchorSelect');sel.value=s.anchors[d.index]?.edge||'none';sel.onchange=e=>setHoleAnchor(d.index,e.target.value);return}
 el.innerHTML='<b>Sagoma</b><p>Trascina per spostare l’intera sagoma, oppure seleziona un vertice per una modifica precisa.</p>'}
function draw(){if(!s)return;const svg=$('cadCanvas'),el=$('cadStats'),d=dimensions(),outline=sampled(),validation=G().validate(outline,s.holes),p=s.pts.map(xy),str=outline.map(xy).map(q=>q.join(',')).join(' ');let svgText=`<defs><pattern id="cadGridPattern" width="${Math.max(1,s.grid*s.scale)}" height="${Math.max(1,s.grid*s.scale)}" patternUnits="userSpaceOnUse"><path d="M ${s.grid*s.scale} 0 L 0 0 0 ${s.grid*s.scale}" fill="none" stroke="#c5d5de" stroke-width=".65"/></pattern></defs><rect width="1000" height="640" fill="#f2f6f8"/>`;
 if(s.gridOn&&s.grid*s.scale>=5)svgText+=`<rect x="0" y="0" width="1000" height="640" fill="url(#cadGridPattern)"/>`;
 svgText+=`<line x1="0" y1="${xy([0,0])[1]}" x2="1000" y2="${xy([0,0])[1]}" stroke="#b0bec7"/><line x1="${xy([0,0])[0]}" y1="0" x2="${xy([0,0])[0]}" y2="640" stroke="#b0bec7"/>`;
 svgText+=`<polygon points="${str}" fill="${validation.ok?'#6dbdce3d':'#f4aaaa60'}" stroke="${validation.ok?'#167c98':'#c94a45'}" stroke-width="2.5" data-fill="1"/>`;
 for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length],len=Math.hypot(s.pts[i][0]-s.pts[(i+1)%p.length][0],s.pts[i][1]-s.pts[(i+1)%p.length][1]);svgText+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="transparent" stroke-width="16" data-edge="${i}"/>${s.showDimensions?`<text x="${(a[0]+b[0])/2+6}" y="${(a[1]+b[1])/2-8}" class="cad-dim cad-clickquote" data-edge="${i}">${s.bulges[i]?('R '+round(G().arcGeometry(s.pts[i],s.pts[(i+1)%p.length],s.bulges[i]).radius)+' mm'):(round(len)+' mm')}</text>`:''}`}
 for(let i=0;i<s.holes.length;i++){if(!s.showHoles)break;let h=s.holes[i],q=xy([h.x,h.y]),selected=s.selected?.type==='hole'&&s.selected.index===i;let outline=h.type==='slot'?G().slotOutline(h).map(xy):Array.from({length:48},(_,j)=>xy([h.x+h.r*Math.cos(j*Math.PI*2/48),h.y+h.r*Math.sin(j*Math.PI*2/48)]));svgText+=`<polygon points="${outline.map(q=>q.join(',')).join(' ')}" fill="#f2f6f8" stroke="${selected?'#ef7d33':'#d07a3e'}" stroke-width="2" data-hole="${i}"/><circle cx="${q[0]}" cy="${q[1]}" r="6" fill="#d07a3e" data-hole="${i}"/><text class="cad-dim" x="${q[0]+10}" y="${q[1]-10}" pointer-events="none">${h.type==='slot'?'Asola '+h.length+' × ': 'Ø'}${round(h.r*2)}</text>`}
 for(let i=0;i<p.length;i++){let q=p[i],selected=s.selected?.type==='point'&&s.selected.index===i;svgText+=`<circle data-point="${i}" cx="${q[0]}" cy="${q[1]}" r="${selected?8:6}" fill="${selected?'#16a58f':'white'}" stroke="#0d718c" stroke-width="2"/><text x="${q[0]+10}" y="${q[1]-10}" class="cad-dim" pointer-events="none">P${i+1}</text>`}
 if(s.pending.length){let pp=s.pending.map(xy);svgText+=`<polyline points="${pp.map(q=>q.join(',')).join(' ')}" stroke="#e59a3a" stroke-width="2" stroke-dasharray="6 4" fill="none"/>`;for(const q of pp)svgText+=`<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#e59a3a"/>`}
 if(!s.showContour)svgText=svgText.replace(/fill="#[a-fA-F0-9]+" stroke="([^"]+)" stroke-width="2.5" data-fill="1"/,'fill="none" stroke="$1" stroke-width="2.5" data-fill="1"');svg.innerHTML=svgText;let ok=validation.ok;setStatus(ok?`Geometria valida · Area netta ${(validation.areaMm2/1e6).toFixed(4)} m² · ${d.w.toFixed(1)} × ${d.h.toFixed(1)} mm`:`Geometria da correggere: ${validation.error}`,!ok);if(el)el.innerHTML=`<div class="cad-data"><span>Vertici</span><b>${s.pts.length}</b><span>Fori / asole</span><b>${s.holes.length}</b><span>Area netta</span><b>${ok?(validation.areaMm2/1e6).toFixed(4)+' m²':'—'}</b></div>`;
 $('cadSubtitle').textContent=s.name+' · Unità mm';$('cadHint').textContent=(s.snapMessage?'Snap: '+s.snapMessage+' · ':'')+({select:'Trascina vertici, fori o la sagoma. Doppio clic su un lato per aggiungere un vertice.',poly:'Clicca i vertici in sequenza. Premi Invio o fai doppio clic per chiudere.',vertex:'Clicca un lato per inserirvi un vertice.',hole:'Clicca nel disegno per posizionare un foro Ø24 mm, modificabile a destra.',slot:'Clicca il primo e il secondo punto dell’asse dell’asola.',measure:'Clicca un lato per modificarne la lunghezza.',pan:'Trascina per spostare la vista.'})[s.tool];
 $('cadTools').querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===s.tool));$('cadUndo').disabled=!s.undo.length;$('cadRedo').disabled=!s.redo.length;$('cadApply').disabled=!ok;
 $('cadDimensions').innerHTML=`<div class="cad-two"><label>Larghezza (mm)<input id="cadWidth" type="number" min="1" step="0.001" value="${round(d.w)}"></label><label>Altezza (mm)<input id="cadHeight" type="number" min="1" step="0.001" value="${round(d.h)}"></label></div>`;
 $('cadWidth').onchange=e=>resize('x',e.target.value);$('cadHeight').onchange=e=>resize('y',e.target.value);
}
function render(){draw();props()}
window.VSCAD2D={open,close};
const style=document.createElement('style');style.textContent=`
body.cad-open{overflow:hidden}.cad-shell{height:100%;display:flex;flex-direction:column;background:#f1f5f7;color:#173440;font:14px system-ui,Arial,sans-serif}.cad-shell *{box-sizing:border-box}#cadRoot{position:fixed;inset:0;z-index:99999}.cad-header{min-height:66px;padding:12px 23px;display:flex;justify-content:space-between;align-items:center;gap:14px;background:#fff;border-bottom:1px solid #dce6ea}.cad-header strong{font-size:20px}.cad-header strong span{color:#098c80}.cad-header small{display:block;font-size:12px;color:#7e909a;margin-top:3px}.cad-header nav,.cad-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cad-shell button{background:#fff;color:#203e49;border:1px solid #cedce2;padding:10px 13px;border-radius:8px;cursor:pointer;font-weight:650}.cad-shell button:hover{background:#eaf7f4}.cad-shell button.active,.cad-shell button.cad-primary{background:#116c72;color:white;border-color:#116c72}.cad-shell button:disabled{opacity:.35;cursor:not-allowed}.cad-tools{background:white;padding:9px 15px;border-bottom:1px solid #e0e8ed;gap:7px;flex-wrap:nowrap;overflow-x:auto;min-height:64px}.cad-tools>*{flex-shrink:0}.cad-tools label{font-size:12px;white-space:nowrap;color:#546b74}.cad-tools select{padding:7px;border:1px solid #ccdbe1;border-radius:6px}.cad-tools input{accent-color:#12877f}.cad-separator{border-left:1px solid #e0e7eb;height:28px;margin:0 6px}.cad-work{display:flex;flex:1;min-height:0;gap:0}.cad-board{position:relative;flex:1;min-width:0;overflow:hidden;padding:14px 16px 58px}.cad-board svg{height:100%;width:100%;touch-action:none;background:#f2f6f8;border:1px solid #d6e3e8;border-radius:12px;cursor:crosshair}.cad-dim{font-size:12px;fill:#3e6172;font-weight:600}.cad-clickquote{cursor:pointer;pointer-events:auto;text-decoration:underline}.cad-clickquote:hover{fill:#078e92}.cad-layer{display:flex!important;align-items:center;gap:8px;font-size:12px!important}.cad-layer input{width:auto!important;margin:0!important}.cad-hint{position:absolute;bottom:61px;left:28px;background:#1c424be6;color:white;padding:9px 13px;border-radius:7px;font-size:12px;max-width:86%}.cad-status{position:absolute;bottom:17px;left:16px;right:16px;padding:10px 14px;background:#e0f3ec;color:#1b6f57;border-radius:7px;font-size:12px}.cad-status.bad{background:#ffebe8;color:#a2352b}.cad-side{width:320px;min-width:275px;background:#fff;overflow:auto;border-left:1px solid #dce6eb;padding:15px;display:flex;flex-direction:column;gap:12px}.cad-card{border:1px solid #dde8ec;border-radius:10px;padding:13px}.cad-card h3{font-size:14px;margin:0 0 12px}.cad-card label{display:block;color:#596e7a;font-size:11px;margin:5px 0}.cad-card input{display:block;width:100%;min-width:0;padding:8px;margin-top:5px;border:1px solid #cddde2;border-radius:6px;color:#173b4a;font-size:13px}.cad-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cad-presets{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cad-presets button{font-size:12px;padding:9px 4px}.cad-note,.cad-muted{font-size:12px;color:#79909b;line-height:1.5}.cad-danger{color:#a52e25!important}.cad-data{display:grid;grid-template-columns:1fr auto;gap:9px;font-size:12px}.cad-data span{color:#607a85}@media(max-width:900px){.cad-side{width:270px;min-width:240px}.cad-tools{gap:4px}.cad-shell button{padding:8px}}@media(max-width:650px){.cad-work{flex-direction:column}.cad-board{min-height:42vh}.cad-side{width:auto;min-width:0;max-height:35vh}.cad-header{padding:8px}.cad-header strong{font-size:15px}.cad-tools{overflow-x:auto;max-height:none}}
`;document.head.appendChild(style);
})();
