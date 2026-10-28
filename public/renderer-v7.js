/* VetroStudio 3D V7 — rendering tecnico/realistico, senza cambiamenti ad API e dati. */
'use strict';
const VS7={mode:'studio',quality:'high',textures:new Map(),added:false};
function vs7Tex(kind){
 if(VS7.textures.has(kind))return VS7.textures.get(kind);
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');let r=(n)=>Math.abs(Math.sin(n*92.317+kind.length*31.17)*100000)%1;
 const base={stone:'#9c9a95',marble:'#d5d2ca',wood:'#a77c55',tile:'#d7d4cd',concrete:'#adada8',brick:'#a38b7e',neutral:'#bcbab5'}[kind]||'#bcbab5';ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
 if(kind==='tile'){for(let x=0;x<=512;x+=128)for(let y=0;y<=512;y+=128){ctx.fillStyle=`rgba(255,255,255,${.04+r(x+y)*.07})`;ctx.fillRect(x+3,y+3,122,122);ctx.strokeStyle='#a7a7a4';ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,124,124)}}
 else if(kind==='brick'){ctx.strokeStyle='#6c5c54';ctx.lineWidth=3;for(let y=0;y<512;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();for(let x=(Math.floor(y/64)%2)*64;x<512;x+=128){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+64);ctx.stroke()}}}
 else if(kind==='wood'){for(let x=0;x<512;x+=64){ctx.strokeStyle='#775137';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke()}for(let i=0;i<120;i++){let x=r(i)*512,y=r(i+123)*512;ctx.strokeStyle=`rgba(70,39,22,${.04+r(i+33)*.18})`;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+5,y+30,x-4,y+60,x+5,y+110);ctx.stroke()}}
 else if(kind==='marble'){for(let i=0;i<38;i++){let x=r(i)*512,y=r(i+59)*512;ctx.strokeStyle=`rgba(100,105,102,${.035+r(i+4)*.12})`;ctx.lineWidth=.5+r(i)*2;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+70,y-30,x+110,y+50,x+200,y+5);ctx.stroke()}}
 else {for(let i=0;i<9000;i++){let x=r(i)*512,y=r(i+991)*512;ctx.fillStyle=r(i+70)>.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';ctx.fillRect(x,y,1+r(i+12)*4,1+r(i+13)*4)}}
 const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;texture.encoding=THREE.sRGBEncoding;VS7.textures.set(kind,texture);return texture;
}
function vs7Env(){if(!V?.renderer)return null;if(VS7.env)return VS7.env;try{
 const s=new THREE.Scene();s.background=new THREE.Color(0xb7c5c9);const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});const add=(x,y,z,w,h,rot=0)=>{let mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),white);mesh.position.set(x,y,z);mesh.rotation.y=rot;s.add(mesh)};
 add(-4,4,-2,3.4,5,.45);add(4,3,1,2,4,-.6);add(0,7,-4,8,2,0);add(1,2,5,2,3,Math.PI);
 let pmrem=new THREE.PMREMGenerator(V.renderer);const env=pmrem.fromScene(s,0.08);VS7.env=env.texture;VS7.envTarget=env;pmrem.dispose();s.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});return VS7.env;
 }catch(e){console.warn('Environment fallback',e);return null}}
function vs7Material(o,m,env){const kind=o.kind;let finish=o.finish||(kind==='wall'?m.wallFinish:m.floorFinish)||'neutral';let common={envMap:env||null,envMapIntensity:.85};
 if(kind==='glass'){
  const frost=m.glass==='frost',smoke=m.glass==='smoke',bronze=m.glass==='bronze';let color=frost?'#d6e4e7':smoke?'#667781':bronze?'#9a8161':'#e0f6f8';
  if(VS7.mode==='technical')return new THREE.MeshPhysicalMaterial({color:'#74bfd0',transparent:true,opacity:.30,roughness:.2,metalness:0,depthWrite:false,side:THREE.DoubleSide});
  return new THREE.MeshPhysicalMaterial({color,metalness:0,roughness:frost?.68:.055,transmission:frost?.42:.93,thickness:Math.max(.005,o.d/1000),ior:1.5,transparent:true,opacity:frost?.82:smoke?.65:.94,clearcoat:.45,clearcoatRoughness:.08,depthWrite:false,side:THREE.DoubleSide,...common});
 }
 if(kind==='mirror')return new THREE.MeshPhysicalMaterial({color:'#edf5f8',metalness:1,roughness:.035,...common,envMapIntensity:1.5});
 if(kind==='profile'||kind==='accessory')return new THREE.MeshStandardMaterial({color:new THREE.Color(m.metal||'#313943'),metalness:.83,roughness:.2,...common,envMapIntensity:1.2});
 let material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:finish==='marble'?.28:.8,metalness:0,...common});if(VS7.mode!=='technical'&&finish!=='neutral'){material.map=vs7Tex(finish)}else{material.color.set(kind==='wall'?(m.wall||'#93918e'):(m.floor||'#b5aa9c'))}return material;
}
function vs7Geom(o){if(o.shape?.length>=3&&['glass','mirror'].includes(o.kind)){let s=new THREE.Shape(),p=o.shape;s.moveTo(p[0][0]-o.w/2,p[0][1]-o.h/2);p.slice(1).forEach(v=>s.lineTo(v[0]-o.w/2,v[1]-o.h/2));s.closePath();for(let hole of o.holes||[]){let h=new THREE.Path();h.absarc(hole.x-o.w/2,hole.y-o.h/2,hole.r,0,Math.PI*2,true);s.holes.push(h)}return new THREE.ExtrudeGeometry(s,{depth:Math.max(1,o.d),bevelEnabled:false,curveSegments:32})}return new THREE.BoxGeometry(Math.max(1,o.w),Math.max(1,o.h),Math.max(1,o.d))}
function vs7AddGlassEdges(mesh,o){const thickness=Math.max(1,o.d), geometry=mesh.geometry;let edges=new THREE.EdgesGeometry(geometry,18);const color=VS7.mode==='technical'?0x16819b:0x93c8c9;let lines=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color,transparent:true,opacity:VS7.mode==='technical'?.95:.55}));lines.userData.v2Id=o.id;mesh.add(lines);
 // Bordi leggermente riflettenti per distinguere lastre extrachiare da pareti e sfondo.
 if(VS7.mode==='studio'&&o.w>250&&o.h>250&&(!o.shape||o.shape.length===4)){let trim=new THREE.Mesh(new THREE.BoxGeometry(Math.max(1,Math.min(2.6,o.w*.0015)),Math.max(1,o.h-2),Math.max(2,thickness+.5)),new THREE.MeshStandardMaterial({color:'#8abfc3',metalness:.27,roughness:.17,transparent:true,opacity:.5}));trim.position.x=-o.w/2+1.3;trim.userData.v2Id=o.id;mesh.add(trim)}
}
function vs7Rebuild(){if(!V?.v2||!S.current)return;const group=V.group,m=ensureV2(),env=vs7Env();
 while(group.children.length){const mesh=group.children[0];group.remove(mesh);mesh.traverse(n=>{n.geometry?.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(mat=>mat?.dispose?.())}})}
 E.objects.clear();for(const o of m.objects){let geometry=vs7Geom(o),mesh=new THREE.Mesh(geometry,vs7Material(o,m,env));mesh.position.set(o.x,o.y,o.z);mesh.rotation.set(num(o.rx)*Math.PI/180,num(o.ry)*Math.PI/180,num(o.rz)*Math.PI/180);mesh.castShadow=o.kind!=='glass';mesh.receiveShadow=o.kind!=='glass';mesh.userData.v2Id=o.id;group.add(mesh);E.objects.set(o.id,mesh);if(o.kind==='glass')vs7AddGlassEdges(mesh,o)}
 if(VS7.mode==='technical'){let grid=new THREE.GridHelper(8000,80,0x7597a4,0xc7d2d7);grid.position.y=-50;group.add(grid)}
 v2Highlight();
}
function vs7Setup(){if(!V?.v2)return;let {scene,renderer}=V;scene.background=new THREE.Color(VS7.mode==='technical'?'#e5edf1':'#b7c0c2');renderer.shadowMap.enabled=VS7.quality==='high';renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=VS7.mode==='technical'?1.2:1.42;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,VS7.quality==='high'?2:1.2));
 scene.children.filter(x=>x.isLight).forEach(x=>scene.remove(x));scene.add(new THREE.HemisphereLight(0xffffff,0x77848b,VS7.mode==='technical'?1.45:1.05));let key=new THREE.DirectionalLight(0xfff5e6,VS7.mode==='technical'?1.15:1.85);key.position.set(1800,4200,2300);key.castShadow=VS7.quality==='high';key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-4500;key.shadow.camera.right=4500;key.shadow.camera.top=4500;key.shadow.camera.bottom=-4500;key.shadow.camera.near=100;key.shadow.camera.far=14000;key.shadow.bias=-.0002;key.shadow.radius=3;scene.add(key);let fill=new THREE.DirectionalLight(0xddeefa,.7);fill.position.set(-2500,2500,-800);scene.add(fill);
}
function vs7Mode(mode){VS7.mode=mode;vs7Setup();vs7Rebuild();vs7Toolbar();}
function vs7Quality(q){VS7.quality=q;vs7Setup();vs7Rebuild();vs7Toolbar()}
function vs7Toolbar(){const viewer=document.querySelector('.v2viewer');if(!viewer)return;let bar=document.getElementById('vs7bar');if(!bar){bar=document.createElement('div');bar.id='vs7bar';viewer.appendChild(bar)}bar.innerHTML=`<button type="button" class="${VS7.mode==='studio'?'on':''}" onclick="vs7Mode('studio')">✦ Realistico</button><button type="button" class="${VS7.mode==='technical'?'on':''}" onclick="vs7Mode('technical')">▦ Tecnico</button><button type="button" onclick="vs7Quality(VS7.quality==='high'?'standard':'high')">Qualità: ${VS7.quality==='high'?'Alta':'Standard'}</button>`;
 if(!document.getElementById('vs7css')){let st=document.createElement('style');st.id='vs7css';st.textContent=`#vs7bar{position:absolute;right:12px;bottom:13px;z-index:4;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}#vs7bar button{border:1px solid #b4cbd1;background:#fffdf7ee;color:#1e3f4b;padding:8px 11px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer}#vs7bar button.on{background:#176c73;color:white}.v2viewer{background:linear-gradient(135deg,#c8cfce,#9ca9aa)}@media(max-width:640px){#vs7bar{right:6px;bottom:49px}#vs7bar button{font-size:10px;padding:6px}}`;document.head.appendChild(st)}
}
const vs7PreviousInit=init3d;
init3d=function(...args){const result=vs7PreviousInit(...args);if(V?.v2){vs7Setup();vs7Rebuild();vs7Toolbar()}return result};
rebuild3d=vs7Rebuild;
// Non cambiamo schema dati, API, identificativi oggetto né formati di salvataggio.
