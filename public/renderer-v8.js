/* VetroStudio V8 — dettagli geometrici non distruttivi, studio lighting e presentazione.
 * Nessuna modifica a API, database, dati progetto o geometrie CAD salvate. */
'use strict';
const VS8={presentation:false,details:true,ground:null};
const vs8OldSetup=vs7Setup,vs8OldRebuild=vs7Rebuild,vs8OldToolbar=vs7Toolbar;
const VS8metal=(color='#26343b',rough=.26)=>new THREE.MeshPhysicalMaterial({color,metalness:.83,roughness:rough,clearcoat:.42,clearcoatRoughness:.21,envMap:VS7.env||null,envMapIntensity:1.65});
const VS8rubber=()=>new THREE.MeshStandardMaterial({color:'#20282b',roughness:.78});
function vs8Box(parent,w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.8,w),Math.max(.8,h),Math.max(.8,d)),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function vs8Cylinder(parent,r,len,x,y,z,mat,axis='y',radial=18){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,Math.max(.8,len),radial),mat);mesh.position.set(x,y,z);if(axis==='z')mesh.rotation.x=Math.PI/2;if(axis==='x')mesh.rotation.z=Math.PI/2;mesh.castShadow=true;parent.add(mesh);return mesh}
function vs8Detail(mesh,o){
 if(VS7.mode==='technical'||!VS8.details)return;
 const name=(o.name||'').toLowerCase(),type=(o.accessoryType||'').toLowerCase();
 const graphite=VS8metal('#252f34'),chrome=VS8metal('#bfc8cc',.18),dark=VS8rubber();
 if(o.kind==='glass'){
  // Sottile linea d'interfaccia tra vetro e ferramenta, senza nascondere la trasparenza.
  const edgeMat=new THREE.MeshStandardMaterial({color:'#86bac4',metalness:.18,roughness:.12,transparent:true,opacity:.48});
  for(let x of [-o.w/2,o.w/2])vs8Box(mesh,Math.min(1.6,o.w*.003),o.h,Math.max(o.d,3),x,0,0,edgeMat);
  if(/anta|porta/.test(name)){
   const seal=new THREE.MeshStandardMaterial({color:'#556269',transparent:true,opacity:.52,roughness:.7});
   vs8Box(mesh,Math.min(4,o.w*.009),o.h*.97,Math.max(3,o.d+2),o.w/2,0,0,seal);
  }
 }
 if(o.kind==='accessory'){
  if(type==='maniglia'||/maniglia|pomolo/.test(name)){
   // Maniglia a ponte con due punti di fissaggio e impugnatura sporgente.
   const h=Math.max(75,Math.min(340,o.h||180)),z=(o.d||25)/2+15;
   vs8Cylinder(mesh,8,30,0,-h*.36,z,chrome,'z');vs8Cylinder(mesh,8,30,0,h*.36,z,chrome,'z');
   vs8Cylinder(mesh,9,h*.72,0,0,z+18,chrome);
   for(const y of [-h*.36,h*.36])vs8Cylinder(mesh,14,7,0,y,Math.max(2,(o.d||25)/2),graphite,'z');
  } else if(type==='borchia'||/borchia|fissaggio/.test(name)){
   vs8Cylinder(mesh,Math.max(15,Math.min(o.w*.45,35)),Math.max(8,o.d*.46),0,0,0,chrome,'z',32);
   vs8Cylinder(mesh,Math.max(9,o.w*.28),Math.max(5,o.d*.16),0,0,o.d*.31,graphite,'z',32);
   vs8Cylinder(mesh,4,4,0,0,o.d*.42,chrome,'z',12);
  } else if(type==='cerniera'||/cerniera/.test(name)){
   const W=Math.max(25,o.w||60),H=Math.max(35,o.h||75);
   vs8Box(mesh,W*.43,H*.82,Math.max(7,o.d*.6),-W*.28,0,0,chrome);
   vs8Box(mesh,W*.43,H*.82,Math.max(7,o.d*.6),W*.28,0,0,chrome);
   vs8Cylinder(mesh,7,H*.92,0,0,8,graphite);
   for(const y of [-H*.25,H*.25])for(const x of [-W*.28,W*.28])vs8Cylinder(mesh,2.8,2,x,y,Math.max(7,o.d*.36),dark,'z',12);
  } else if(type==='morsetto'||/morsetto/.test(name)){
   const W=Math.max(30,o.w),H=Math.max(30,o.h);
   for(const x of [-W*.28,W*.28])vs8Box(mesh,W*.38,H*.77,Math.max(6,o.d*.55),x,0,0,chrome);
   vs8Cylinder(mesh,4,4,0,0,o.d*.36,graphite,'z');
  }
 }
 if(o.kind==='profile'){
  // Bisello di luce lungo il profilo, percezione di profondità per telai e corrimano.
  const long=Math.max(o.w,o.h,o.d),neutral=VS8metal('#d0d7d9',.23);
  if(long===o.h&&o.h>300)vs8Box(mesh,Math.min(o.w*.12,4),o.h*.985,Math.min(o.d*.2,4),o.w*.30,0,o.d*.48,neutral);
  else if(long===o.w&&o.w>300)vs8Box(mesh,o.w*.985,Math.min(o.h*.12,4),Math.min(o.d*.2,4),0,o.h*.3,o.d*.48,neutral);
 }
 if(o.kind==='stair'){
  const trim=VS8metal('#6b7276',.42);vs8Box(mesh,o.w*.98,Math.min(5,o.h*.10),Math.min(7,o.d*.04),0,o.h/2-3,o.d/2-3,trim);
 }
 if(o.kind==='floor'||o.kind==='balcony'){
  if(o.h>25){const mat=new THREE.MeshStandardMaterial({color:'#d1c8ba',roughness:.78});vs8Box(mesh,o.w*.995,Math.min(6,o.h*.06),o.d*.995,0,o.h/2-3,0,mat)}
 }
}
function vs8Ground(){if(!V?.scene||VS8.ground)return;const geo=new THREE.PlaneGeometry(18000,18000),mat=new THREE.ShadowMaterial({color:0x1e2a2d,opacity:.20});let p=new THREE.Mesh(geo,mat);p.rotation.x=-Math.PI/2;p.position.y=-88;p.receiveShadow=true;p.name='VS8ContactFloor';V.scene.add(p);VS8.ground=p}
function vs8Setup(){vs8OldSetup();if(!V?.renderer)return;const {renderer,scene}=V;
 renderer.physicallyCorrectLights=true;renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=VS7.mode==='technical'?1.1:1.18;
 scene.background=new THREE.Color(VS7.mode==='technical'?'#e8edf0':'#b0b9ba');
 scene.fog=new THREE.Fog(scene.background,9000,20000);
 const key=scene.children.find(o=>o.isDirectionalLight);if(key){key.intensity=VS7.mode==='technical'?1.2:2.0;key.shadow.normalBias=.025;key.shadow.radius=4;key.shadow.mapSize.set(2048,2048)}
 if(!scene.getObjectByName('VS8Rim')){const rim=new THREE.DirectionalLight(0xf1f8ff,.95);rim.name='VS8Rim';rim.position.set(-3000,3400,2500);scene.add(rim)}
 vs8Ground();
}
function vs8Rebuild(){vs8OldRebuild();if(!V?.v2)return;const m=ensureV2();for(const o of m.objects){const mesh=E.objects.get(o.id);if(mesh)vs8Detail(mesh,o)}vs8Toolbar()}
function vs8Toolbar(){vs8OldToolbar();let bar=document.getElementById('vs7bar');if(!bar)return;
 if(!document.getElementById('vs8style')){const s=document.createElement('style');s.id='vs8style';s.textContent='#vs7bar{background:rgba(22,39,45,.58);padding:7px;border-radius:12px;backdrop-filter:blur(9px)}#vs7bar button{box-shadow:0 2px 8px #0002;border-color:#aabdc0}#vs7bar button.on{background:#154a53;border-color:#154a53}.v2viewer{background:#b0b9ba}';document.head.appendChild(s)}
 let btn=document.getElementById('vs8presentation');if(!btn){btn=document.createElement('button');btn.id='vs8presentation';bar.appendChild(btn)}btn.textContent=VS8.presentation?'Torna a progettare':'Presentazione';btn.onclick=()=>{VS8.presentation=!VS8.presentation;document.querySelectorAll('.v2viewer .viewbar,.v2viewer .viewhint').forEach(el=>el.style.display=VS8.presentation?'none':'');const grp=V?.group;grp?.children.forEach(x=>{if(x.isGridHelper)x.visible=!VS8.presentation});btn.textContent=VS8.presentation?'Torna a progettare':'Presentazione'};
}
vs7Setup=vs8Setup;vs7Rebuild=vs8Rebuild;vs7Toolbar=vs8Toolbar;
// Le funzioni chiamate dal resto del designer vengono aggiornate a questa nuova pipeline.
rebuild3d=vs8Rebuild;
const vs8OldInit=init3d;
init3d=function(...args){const r=vs8OldInit(...args);if(V?.v2){vs8Setup();vs8Rebuild()}return r};
