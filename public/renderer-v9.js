/* VetroStudio 3D V9 — architectural finishes, non-destructive overlays on V8.
   Materiali procedurali senza dipendenze o immagini esterne; unità: millimetri.
   Nessuna API, tabella D1 o contratto di salvataggio modificato. */
'use strict';
const VS9={style:localStorage.getItem('vs9-style')||'modern',cache:new Map(),size:512};
const VS9styles={
 modern:{label:'Moderno · pietra e antracite',wall:'cemento',floor:'piastrelle',balcony:'pietra',stair:'legno',profile:'#252d31'},
 contemporary:{label:'Contemporaneo · rovere e cemento',wall:'pietra',floor:'cemento',balcony:'cemento',stair:'legno',profile:'#4a4c4c'},
 classic:{label:'Classico · marmo e pietra',wall:'pietra',floor:'marmo',balcony:'granito',stair:'marmo',profile:'#a4a5a0'}
};
const vs9OldRebuild=vs8Rebuild,vs9OldToolbar=vs8Toolbar;
function vs9Hash(x){let n=Math.sin(x*127.1+45.16)*43758.5453;return n-Math.floor(n)}
function vs9Texture(kind){const k=kind==='tile'?'piastrelle':kind==='stone'?'pietra':kind==='wood'?'legno':kind==='marble'?'marmo':kind==='concrete'?'cemento':kind==='brick'?'mattoni':kind;
 if(VS9.cache.has(k))return VS9.cache.get(k);const canvas=document.createElement('canvas');canvas.width=canvas.height=VS9.size;const c=canvas.getContext('2d'),s=VS9.size;
 const base={cemento:'#a5a39c',pietra:'#a79f91',piastrelle:'#c5c0b5',legno:'#b18a60',marmo:'#d8d3c9',granito:'#898d89',mattoni:'#b08271',ardesia:'#515c61',neutral:'#b2b0aa'}[k]||'#b2b0aa';c.fillStyle=base;c.fillRect(0,0,s,s);
 // Granulosità ripetibile, non casuale ad ogni fotogramma.
 for(let i=0;i<12500;i++){const x=vs9Hash(i+1)*s,y=vs9Hash(i+23901)*s,v=vs9Hash(i+501);c.fillStyle=v>.5?'rgba(255,255,255,.075)':'rgba(31,35,33,.06)';c.fillRect(x,y,1+vs9Hash(i+4)*3,1+vs9Hash(i+99)*3)}
 if(k==='piastrelle'||k==='pietra'||k==='mattoni'||k==='ardesia'){
  const tile=k==='piastrelle'?128:k==='pietra'?96:k==='mattoni'?64:136;
  for(let y=0;y<s;y+=tile){for(let x=0;x<s;x+=tile*(k==='mattoni'?2:1)){
   const off=(k==='mattoni'&&Math.floor(y/tile)%2)?tile:0;
   c.fillStyle=`rgba(255,255,255,${.02+vs9Hash(x+y+78)*.12})`;c.fillRect(x+off+4,y+4,tile*(k==='mattoni'?2:1)-8,tile-8);
   c.strokeStyle=k==='piastrelle'?'rgba(104,104,98,.48)':'rgba(53,57,56,.34)';c.lineWidth=k==='piastrelle'?4:3;c.strokeRect(x+off+2,y+2,tile*(k==='mattoni'?2:1)-4,tile-4);
  }}
 }else if(k==='legno'){
  for(let x=0;x<s;x+=128){c.strokeStyle='rgba(69,45,28,.34)';c.lineWidth=3;c.beginPath();c.moveTo(x,0);c.lineTo(x,s);c.stroke()}
  for(let i=0;i<240;i++){const x=vs9Hash(i+17)*s,y=vs9Hash(i+700)*s;c.beginPath();c.strokeStyle=`rgba(70,42,24,${.03+vs9Hash(i+12)*.20})`;c.lineWidth=.4+vs9Hash(i+2)*2;c.moveTo(x,y);c.bezierCurveTo(x+8,y+30,x-7,y+75,x+5,y+140);c.stroke()}
 }else if(k==='marmo'){
  for(let i=0;i<55;i++){const x=vs9Hash(i+42)*s,y=vs9Hash(i+600)*s;c.strokeStyle=`rgba(79,87,85,${.04+vs9Hash(i)*.18})`;c.lineWidth=.5+vs9Hash(i+5)*1.7;c.beginPath();c.moveTo(x,y-100);c.bezierCurveTo(x+120,y+20,x-30,y+85,x+200,y+240);c.stroke()}
 }else if(k==='cemento'){
  for(let i=0;i<160;i++){const x=vs9Hash(i+31)*s,y=vs9Hash(i+855)*s;c.fillStyle='rgba(75,84,84,.035)';c.beginPath();c.ellipse(x,y,3+vs9Hash(i+5)*36,1+vs9Hash(i+11)*12,vs9Hash(i+7),0,Math.PI*2);c.fill()}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.encoding=THREE.sRGBEncoding;texture.anisotropy=8;
 VS9.cache.set(k,texture);return texture;
}
function vs9FaceMaterial(kind,w,h){const t=vs9Texture(kind).clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;const unit=kind==='mattoni'?350:kind==='piastrelle'?800:kind==='legno'?1050:kind==='pietra'?950:kind==='marmo'?1400:kind==='ardesia'?900:1100;
 t.repeat.set(Math.max(.06,w/unit),Math.max(.06,h/unit));t.needsUpdate=true;
 const mat=new THREE.MeshStandardMaterial({color:'#ffffff',map:t,roughness:kind==='marmo'?.30:kind==='piastrelle'?.52:kind==='legno'?.66:.84,metalness:0,envMap:VS7.env||null,envMapIntensity:.28});
 mat.userData.vs9OwnTexture=t;return mat;
}
function vs9Apply(mesh,o,project){if(!['wall','floor','stair','balcony'].includes(o.kind)||VS7.mode==='technical')return;
 const defaults=VS9styles[VS9.style]||VS9styles.modern;
 const finish=(!o.finish||o.finish==='neutral')?defaults[o.kind]:o.finish;
 // BoxGeometry face order: X+- (depth,height), Y+- (width,depth), Z+- (width,height).
 const w=Math.max(1,o.w),h=Math.max(1,o.h),d=Math.max(1,o.d);
 const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 let mats=dims.map(([a,b])=>vs9FaceMaterial(finish,a,b));
 if(mesh.material){const old=Array.isArray(mesh.material)?mesh.material:[mesh.material];old.forEach(mat=>{if(mat && mat!==mats[0])mat.dispose()})}
 mesh.material=mats;mesh.receiveShadow=true;mesh.castShadow=o.kind!=='floor';
 // Fianco del gradino e dettaglio del bordo, coerenti con la finitura applicata.
 if(o.kind==='stair'){
  const trimColor=finish==='legno'?'#62482f':finish==='marmo'?'#aca69b':'#767b77';
  const edge=new THREE.Mesh(new THREE.BoxGeometry(w*.985,Math.min(5,h*.09),Math.max(4,d*.018)),new THREE.MeshStandardMaterial({color:trimColor,roughness:.47}));edge.position.set(0,h/2-3,d/2-2);edge.userData.v2Id=o.id;mesh.add(edge);
 }
}
function vs9Rebuild(){vs9OldRebuild();if(!V?.v2)return;const project=ensureV2();for(const o of project.objects){const m=E.objects.get(o.id);if(m)vs9Apply(m,o,project)}vs9Toolbar()}
function vs9SetStyle(style,applyToExisting){if(!VS9styles[style])return;VS9.style=style;localStorage.setItem('vs9-style',style);
 if(applyToExisting){const target=VS9styles[style];v3Action(()=>{let p=ensureV2();for(const o of p.objects){if(['wall','floor','stair','balcony'].includes(o.kind))o.finish=target[o.kind]}p.metal=target.profile;v2Refresh()})}else vs9Rebuild();vs9Toolbar()}
function vs9Toolbar(){vs9OldToolbar();const bar=document.getElementById('vs7bar');if(!bar)return;
 let block=document.getElementById('vs9finish');if(!block){block=document.createElement('div');block.id='vs9finish';block.style.cssText='display:flex;align-items:center;gap:5px;flex-wrap:wrap';bar.appendChild(block)}
 block.innerHTML=`<label for="vs9style" style="color:#fff;font-size:12px;font-weight:700">Ambiente</label><select id="vs9style" aria-label="Stile architettonico" style="border:1px solid #abbcc0;padding:8px;border-radius:8px;background:white;color:#19343c">${Object.entries(VS9styles).map(([k,v])=>`<option value="${k}" ${VS9.style===k?'selected':''}>${v.label}</option>`).join('')}</select><button type="button" id="vs9apply" title="Aggiorna i rivestimenti di muri, pavimenti, gradini e balconi: operazione annullabile">Applica ai materiali</button>`;
 block.querySelector('select').onchange=e=>vs9SetStyle(e.target.value,false);
 block.querySelector('button').onclick=()=>vs9SetStyle(block.querySelector('select').value,true);
}
// Aggancia V9 in coda a V8, senza cambiare stato progetto né gestione dati.
vs7Rebuild=vs9Rebuild;rebuild3d=vs9Rebuild;
const vs9OldInit=init3d;init3d=function(...args){const result=vs9OldInit(...args);if(V?.v2)vs9Rebuild();return result};
