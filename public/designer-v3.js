/* VetroStudio 3D — Estensione geometrie, snap, materiali e cronologia.
   Caricare DOPO designer-v2.js; nessuna modifica al backend. */
'use strict';
const V3={undo:[],redo:[],muted:false,snap:true,snapTolerance:65,dragStart:null,maxHistory:60};
function v3Snapshot(){return JSON.stringify({objects:ensureV2().objects,type:ensureV2().type,selected:E.selected,wall:ensureV2().wall,floor:ensureV2().floor})}
function v3Push(before){if(V3.muted)return;let now=v3Snapshot();if(before===now)return;V3.undo.push(before);if(V3.undo.length>V3.maxHistory)V3.undo.shift();V3.redo=[];v3Buttons()}
function v3Action(action){let before=v3Snapshot();V3.muted=true;try{return action()}finally{V3.muted=false;v3Push(before)}}
function v3Restore(snapshot){const state=JSON.parse(snapshot),m=ensureV2();m.objects=state.objects;m.type=state.type;m.wall=state.wall;m.floor=state.floor;E.selected=state.selected;v2Refresh();v3Buttons()}
function v3Undo(){if(!V3.undo.length)return;const prev=V3.undo.pop();V3.redo.push(v3Snapshot());v3Restore(prev)}
function v3Redo(){if(!V3.redo.length)return;const next=V3.redo.pop();V3.undo.push(v3Snapshot());v3Restore(next)}
function v3Buttons(){let b=document.getElementById('v3undo'),r=document.getElementById('v3redo');if(b)b.disabled=!V3.undo.length;if(r)r.disabled=!V3.redo.length}
// Conserva i metodi v2 e li arricchisce senza toccare login, clienti, prezzi e API.
const v3Base={designer,makeTemplate,v2Add,v2Change,v2Delete,v2Duplicate,v2AddAccessory,v2Empty,v2ShapeApply,v2Refresh,rebuild3d,init3d,v2RenderProps,v2ShapeOpen,v2Model};
function v3MaterialOptions(){return [['neutral','Intonaco / neutro'],['pietra','Pietra naturale'],['marmo','Marmo'],['cemento','Cemento'],['piastrelle','Piastrelle'],['legno','Legno'],['granito','Granito'],['mattoni','Mattoni'],['ardesia','Ardesia']]}
function v3GeometryPresets(){return [['rect','Rettangolo'],['square','Quadrato'],['wide','Rettangolo orizzontale'],['tall','Rettangolo verticale'],['trapezoid','Trapezio'],['slant','Lato diagonale'],['triangle','Triangolo'],['pentagon','Pentagono'],['hexagon','Esagono'],['diamond','Rombo'],['cutcorner','Angolo smussato'],['rounded','Angoli arrotondati'],['arch','Arco superiore'],['free','Sagoma personalizzata']]}
function v3ApplyShapePreset(type){let o=ensureV2().objects.find(x=>x.id===E.selected);if(!o||!['glass','mirror'].includes(o.kind))return;v3Action(()=>{let w=o.w,h=o.h,sh;switch(type){
case 'square':o.h=o.w;h=o.h;break;
case 'wide':o.h=Math.max(200,Math.round(w*.55));h=o.h;break;
case 'tall':o.w=Math.max(200,Math.round(h*.45));w=o.w;break;
case 'trapezoid':sh=[[w*.14,0],[w*.86,0],[w,h],[0,h]];break;
case 'slant':sh=[[0,0],[w,0],[w*.78,h],[0,h]];break;
case 'triangle':sh=[[0,0],[w,0],[w*.5,h]];break;
case 'pentagon':sh=[[0,0],[w,0],[w,h*.7],[w*.55,h],[0,h*.7]];break;
case 'hexagon':sh=[[w*.2,0],[w*.8,0],[w,h*.5],[w*.8,h],[w*.2,h],[0,h*.5]];break;
case 'diamond':sh=[[w*.5,0],[w,h*.5],[w*.5,h],[0,h*.5]];break;
case 'cutcorner':sh=[[0,0],[w,0],[w,h*.75],[w*.75,h],[0,h]];break;
case 'rounded':{sh=[];let r=Math.min(w,h)*.13;for(let [cx,cy,start] of [[w-r,r,270],[w-r,h-r,0],[r,h-r,90],[r,r,180]])for(let i=0;i<=7;i++){let a=(start+i*90/7)*Math.PI/180;sh.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}break}
case 'arch':{sh=[[0,0],[w,0],[w,h*.74]];for(let i=0;i<=24;i++){let a=i*Math.PI/24;sh.push([w/2+w/2*Math.cos(a),h*.74+h*.26*Math.sin(a)])}sh.push([0,h*.74]);break}
case 'rect':default:sh=null;break}
o.shape=sh||null;o.holes=[];o.shapePreset=type;v2Refresh()})}
function v3AddRail(){v3Action(()=>{let m=ensureV2(),sel=m.objects.find(o=>o.id===E.selected),w=sel?.w||2600,h=1050,z=(sel?.z||0)+((sel?.d||0)/2)+55,y=(sel?.kind==='stair'?sel.y+sel.h/2:0);let start=sel?.x||0;let base=sel?.kind==='stair'?y:y;let angle=sel?.kind==='stair'?sel.rz||0:0;for(let i=0;i<3;i++){let x=start-w/2+w*i/2;m.objects.push(obj('profile','Montante ringhiera '+(i+1),x,base+h/2,z,36,h,36,{finish:'metal'}))}m.objects.push(obj('profile','Corrimano ringhiera',start,base+h,z,w+60,38,45,{rz:angle,finish:'metal'}));E.selected=m.objects.at(-1).id;v2Refresh()})}
function v3Staircase(style='glass-side'){v3Action(()=>{let m=ensureV2(),n=9,tread=290,rise=178,stairW=1000,whole=n*tread,top=n*rise,side=stairW/2+35,arr=[];
const add=(kind,name,x,y,z,w,h,d,more={})=>arr.push(obj(kind,name,x,y,z,w,h,d,more));
for(let i=0;i<n;i++){
const x=-whole/2+(i+.5)*tread,level=(i+1)*rise;
add('stair',`Gradino ${i+1}`,x,level-25,0,tread-9,50,stairW,{finish:'pietra'});
if(style==='solid-stair')add('wall',`Alzata ${i+1}`,x,level/2-25,0,tread-9,Math.max(50,level-50),stairW,{finish:'cemento'});
}
add('floor','Pianerottolo superiore',whole/2+250,top-65,0,500,130,stairW+150,{finish:'pietra'});
const slope=rise/tread,panels=style==='floating'?4:3,per=whole/panels;
for(let j=0;j<panels;j++){
let x0=-whole/2+j*per,x1=x0+per,low=rise+j*per*slope,high=rise+(j+1)*per*slope;
let w=per-14,gh=1100,shape=[[0,0],[w,high-low],[w,high-low+gh],[0,gh]];
add('glass',`Vetro scala ${j+1}`,(x0+x1)/2,low+(gh+high-low)/2+12,side,w,gh+high-low,12,{shape,finish:'clear',panelSlope:slope});
}
if(style==='posts'||style==='floating'){for(let i=0;i<=n;i+=2){let x=-whole/2+i*tread,base=i*rise;add('profile',`Montante ${i}`,x,base+520,side+35,38,1040,38)}}
if(style==='posts'||style==='floating'){
let len=Math.sqrt(whole*whole+top*top),rot=Math.atan2(top,whole)*180/Math.PI;
add('profile','Corrimano inclinato',0,top/2+rise+1080,side+35,len+100,45,38,{rz:rot,finish:'metal'});
}
if(style==='borchie')for(let j=0;j<panels;j++){let x=-whole/2+(j+.5)*per,base=rise+(j+.5)*per*slope;for(let k of [-1,1])add('accessory','Borchia di fissaggio',x+k*per*.28,base+190,side+20,48,48,55,{accessoryType:'borchia'})}
m.objects=arr;m.type='scala';E.selected=null;v2Refresh();v3AutoCamera()})}
function v3AutoCamera(){if(!V?.v2)return;V.dist=5900;V.az=.65;V.el=.22;V.position()}
function v3SnapAxis(candidate,half,size,other,otherHalf,tol){let choices=[other-otherHalf-half,other+otherHalf+half,other-otherHalf+half,other+otherHalf-half,other];let best=candidate,bestD=tol+1;for(let v of choices){let d=Math.abs(v-candidate);if(d<bestD){bestD=d;best=v}}return bestD<=tol?best:candidate}
function v3SnapObject(o){if(!V3.snap)return;let tol=V3.snapTolerance;for(let b of ensureV2().objects){if(b.id===o.id||b.kind==='accessory'||o.kind==='accessory')continue;let overlapY=Math.abs(o.y-b.y)<(o.h+b.h)/2+tol,overlapZ=Math.abs(o.z-b.z)<(o.d+b.d)/2+tol,overlapX=Math.abs(o.x-b.x)<(o.w+b.w)/2+tol;if(overlapY&&overlapZ)o.x=v3SnapAxis(o.x,o.w/2,o.w,b.x,b.w/2,tol);if(overlapX&&overlapZ)o.y=v3SnapAxis(o.y,o.h/2,o.h,b.y,b.h/2,tol);if(overlapX&&overlapY)o.z=v3SnapAxis(o.z,o.d/2,o.d,b.z,b.d/2,tol)} }
function v3AlignSelected(angle){let o=ensureV2().objects.find(x=>x.id===E.selected);if(!o)return;v3Action(()=>{o.ry=angle;v3SnapObject(o);v2Refresh()})}
function v3SnapNow(){let o=ensureV2().objects.find(x=>x.id===E.selected);if(!o)return;v3Action(()=>{v3SnapObject(o);v2Refresh()})}
function v3SnapAngle(angle){return Math.abs(angle/90-Math.round(angle/90))<.085?Math.round(angle/90)*90:angle}
function v3SetFinish(kind,value){let o=ensureV2().objects.find(x=>x.id===E.selected);if(o)v3Action(()=>{o.finish=value;v2Refresh()});else{let m=ensureV2();v3Action(()=>{m[kind==='wall'?'wallFinish':'floorFinish']=value;v2Refresh()})}}
// Bind UI and wrap existing features
function v3Mount(){let container=document.querySelector('.v2layout');if(!container||document.getElementById('v3toolbar'))return;let host=document.createElement('div');host.id='v3toolbar';host.className='v3toolbar';host.innerHTML=`<button class="btn" id="v3undo" onclick="v3Undo()" title="Annulla (Ctrl+Z)">↶ Annulla</button><button class="btn" id="v3redo" onclick="v3Redo()" title="Ripristina (Ctrl+Y)">↷ Ripristina</button><label class="v3switch"><input type="checkbox" checked onchange="V3.snap=this.checked"> 🧲 Aggancio magnetico</label><label class="v3switch">Tolleranza <input style="width:65px" type="number" min="1" max="500" value="65" onchange="V3.snapTolerance=Math.max(1,Number(this.value)||65)"> mm</label><button class="btn" onclick="v3SnapNow()">Allinea ai bordi</button><button class="btn" onclick="v3AlignSelected(90)">Angolo 90°</button><button class="btn" onclick="v3AlignSelected(45)">Angolo 45°</button><span class="small">Seleziona e trascina verso i bordi per agganciare</span>`;container.before(host);document.getElementById('v3components')?.remove();

let css=document.createElement('style');css.textContent=`.v3toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:9px 0;background:#fff;padding:9px 12px;border:1px solid #e1e8ea;border-radius:10px}.v3switch{display:flex;gap:7px;align-items:center;font-size:12px}.v3toolbar button:disabled{opacity:.4;cursor:not-allowed}.v3shapes{display:grid;grid-template-columns:1fr 1fr;gap:6px}.v3finish{display:flex;align-items:center;gap:8px;margin-top:12px}`;document.head.append(css);v3Buttons()}
const v3DesignerBase=designer;
designer=function(){return v3DesignerBase()};
const v3RefreshBase=v2Refresh;
v2Refresh=function(...args){let result=v3RefreshBase(...args);v3Mount();return result};
const v3PropertiesBase=v2RenderProps;
v2RenderProps=function(){v3PropertiesBase();let el=document.getElementById('v2props');if(!el)return;let o=ensureV2().objects.find(x=>x.id===E.selected);if(!o)return;
if(['glass','mirror'].includes(o.kind))el.insertAdjacentHTML('beforeend',`<hr><b>Forma geometrica</b><select class="field" onchange="v3ApplyShapePreset(this.value)">${v3GeometryPresets().map(([v,l])=>`<option value="${v}" ${o.shapePreset===v?'selected':''}>${l}</option>`).join('')}</select><button class="btn" style="margin-top:7px" onclick="v2ShapeOpen('${o.id}')">Disegno libero con quote e fori</button>`);
if(['wall','floor','stair','balcony'].includes(o.kind))el.insertAdjacentHTML('beforeend',`<div class="v3finish"><b>Rivestimento</b><select class="field" onchange="v3SetFinish('${o.kind}',this.value)">${v3MaterialOptions().map(([v,l])=>`<option value="${v}" ${o.finish===v?'selected':''}>${l}</option>`).join('')}</select></div>`)
};
// Storico modifiche sul modello. Evitare il doppio salvataggio nelle operazioni annidate.
// Richiamare la funzione locale (funzioni top-level classiche) tramite assegnazione esplicita.
const v3OldAdd=v2Add;v2Add=(...a)=>v3Action(()=>v3OldAdd(...a));
const v3OldDelete=v2Delete;v2Delete=(...a)=>v3Action(()=>v3OldDelete(...a));
const v3OldDup=v2Duplicate;v2Duplicate=(...a)=>v3Action(()=>v3OldDup(...a));
const v3OldAcc=v2AddAccessory;v2AddAccessory=(...a)=>v3Action(()=>v3OldAcc(...a));
const v3OldEmpty=v2Empty;v2Empty=(...a)=>v3Action(()=>v3OldEmpty(...a));
const v3OldChange=v2Change;v2Change=(...a)=>v3Action(()=>v3OldChange(...a));
const v3OldApply=v2ShapeApply;v2ShapeApply=(...a)=>v3Action(()=>v3OldApply(...a));
const v3OldModel=v2Model;v2Model=(...a)=>v3Action(()=>v3OldModel(...a));
const v3OldShape=v2ShapeOpen;
v2ShapeOpen=function(...a){const result=v3OldShape(...a);let modal=document.getElementById('modal');if(modal&&!modal.querySelector('#v3geom')){let el=document.createElement('div');el.id='v3geom';el.className='v3shapeextra';el.innerHTML=`<b>Imposta geometria rapida</b><select id="v3presetInEditor" class="field">${v3GeometryPresets().map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><button class="btn" onclick="v3ShapePresetInside()">Applica forma ai vertici</button><p class="small">Per ottenere precisione, inserisci X e Y di ciascun punto nei campi numerici.</p>`;modal.querySelector('.v2shapeTools')?.before(el)}return result};
function v3ShapePresetInside(){let t=document.getElementById('v3presetInEditor')?.value,o=ensureV2().objects.find(x=>x.id===E.shapeId);if(!o)return;let w=o.w,h=o.h;switch(t){case 'triangle':E.polygon=[[0,0],[w,0],[w/2,h]];break;case 'trapezoid':E.polygon=[[w*.12,0],[w*.88,0],[w,h],[0,h]];break;case 'slant':E.polygon=[[0,0],[w,0],[w*.8,h],[0,h]];break;case 'cutcorner':E.polygon=[[0,0],[w,0],[w,h*.8],[w*.8,h],[0,h]];break;default:E.polygon=[[0,0],[w,0],[w,h],[0,h]];}v2DrawShape()}
// Snap nello spazio corrente durante il trascinamento e commit nella cronologia al rilascio.
const v3OldInit=init3d;
init3d=function(){v3OldInit();v3Mount();const canvas=document.getElementById('canvas3d');if(!canvas||canvas.dataset.v3Events)return;canvas.dataset.v3Events='1';canvas.addEventListener('pointerdown',()=>{V3.dragStart=v3Snapshot()},true);canvas.addEventListener('pointermove',()=>{if(!E.drag?.id||E.drag.orbit||!E.drag.moved)return;let o=ensureV2().objects.find(x=>x.id===E.drag.id);if(o&&V3.snap){v3SnapObject(o);rebuild3d()}});canvas.addEventListener('pointerup',()=>{if(V3.dragStart){let old=V3.dragStart;V3.dragStart=null;v3Push(old)}},false)};
// Aggiunge materiali procedurali ai soli elementi architettonici; texture create in memoria, nessun servizio esterno.
function v3Texture(finish){if(!finish||finish==='neutral')return null;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');const bg={pietra:'#97978a',marmo:'#d6d3cd',cemento:'#b8bdba',piastrelle:'#d5d7d2',legno:'#927154',granito:'#86898a',mattoni:'#b57660',ardesia:'#585f63'}[finish]||'#bbbbbb';c.fillStyle=bg;c.fillRect(0,0,256,256);let random=()=>Math.random();
if(finish==='piastrelle'||finish==='mattoni'||finish==='pietra'){let s=finish==='piastrelle'?64:finish==='mattoni'?44:55;c.strokeStyle=finish==='piastrelle'?'#eef0ed':'#484d49';c.lineWidth=finish==='piastrelle'?3:2;for(let y=0;y<256;y+=s)for(let x=0;x<256;x+=s*(finish==='mattoni'?2:1)){let off=finish==='mattoni'&&(Math.floor(y/s)%2)?s:0;c.fillStyle=finish==='pietra'?`rgba(230,224,210,${.06+random()*.25})`:'rgba(255,255,255,.035)';c.fillRect(x+off+3,y+3,s-6,s-6);c.strokeRect(x+off,y,s*(finish==='mattoni'?2:1),s)}}
else if(finish==='legno'){for(let j=0;j<55;j++){let x=random()*256;c.strokeStyle=`rgba(40,24,14,${random()*.16})`;c.beginPath();c.moveTo(x,0);c.lineTo(x+random()*15,256);c.stroke()}}
else if(finish==='marmo'){for(let j=0;j<13;j++){c.strokeStyle=`rgba(110,110,110,${.08+random()*.2})`;c.lineWidth=1+random()*2;c.beginPath();let x=random()*256;c.moveTo(x,-20);c.bezierCurveTo(x-50,90,x+30,160,x+random()*90,290);c.stroke()}}
else{for(let j=0;j<1400;j++){c.fillStyle=`rgba(255,255,255,${random()*.16})`;c.fillRect(random()*256,random()*256,random()*3+1,random()*3+1)}}
let texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);return texture}
const v3OldRebuild=rebuild3d;
rebuild3d=function(){v3OldRebuild();if(!V?.v2)return;for(let o of ensureV2().objects){if(!['wall','floor','stair','balcony'].includes(o.kind))continue;let mesh=E.objects.get(o.id);if(!mesh)continue;let finish=o.finish||(o.kind==='wall'?ensureV2().wallFinish:ensureV2().floorFinish)||'neutral';if(finish!=='neutral'){let map=v3Texture(finish);mesh.material.map=map;mesh.material.color.set('#ffffff');mesh.material.needsUpdate=true}}};
document.addEventListener('keydown',e=>{let tag=document.activeElement?.tagName?.toLowerCase();if(['input','textarea','select'].includes(tag)||document.activeElement?.isContentEditable)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?v3Redo():v3Undo()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();v3Redo()} });
