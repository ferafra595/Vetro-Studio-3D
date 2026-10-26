/* VetroStudio 3D V5 — modelli per categoria e varianti porte. Richiede V2, V3 e V4. */
'use strict';
const V5={category:'scale',catalog:[
 {id:'S01',cat:'scale',name:'Scala con borchie laterali',desc:'Gradini, vetri e fissaggi puntuali',engine:'v4'},
 {id:'S02',cat:'scale',name:'Scala con profilo continuo',desc:'Gradini e profilo portavetro',engine:'v4'},
 {id:'S03',cat:'scale',name:'Scala con montanti',desc:'Parapetto con montanti e corrimano',engine:'v4'},
 {id:'S04',cat:'scale',name:'Scala sospesa con vetro',desc:'Gradini a sbalzo e protezione laterale',engine:'v4'},
 {id:'P01',cat:'parapetti',name:'Borchie laterali',desc:'Lastre su bordo di soletta',engine:'v4'},
 {id:'P02',cat:'parapetti',name:'Profilo continuo',desc:'Lastre incassate in profilo',engine:'v4'},
 {id:'P03',cat:'parapetti',name:'Morsetti a pavimento',desc:'Lastre con supporti puntuali',engine:'v4'},
 {id:'P04',cat:'parapetti',name:'Montanti e ringhiera',desc:'Montanti, vetri e corrimano',engine:'v4'},
 {id:'D01',cat:'docce',name:'Walk-In fisso',desc:'Parete singola e barra stabilizzatrice'},
 {id:'D02',cat:'docce',name:'Nicchia scorrevole',desc:'Anta mobile, fisso e binari'},
 {id:'D03',cat:'docce',name:'Nicchia battente',desc:'Anta, cerniere e maniglia'},
 {id:'D04',cat:'docce',name:'Box doccia angolare',desc:'Laterale fisso e porta frontale'},
 {id:'R01',cat:'porte',name:'Battente singola',desc:'Anta unica con cerniere e maniglia'},
 {id:'R02',cat:'porte',name:'Battente doppia',desc:'Due ante apribili e ferramenta'},
 {id:'R03',cat:'porte',name:'Scorrevole esterna',desc:'Binario superiore e anta scorrevole'},
 {id:'R04',cat:'porte',name:'Scorrevole a due ante',desc:'Due ante su guida superiore'},
 {id:'R05',cat:'porte',name:'Porta a libro',desc:'Due pannelli pieghevoli e cerniere'},
 {id:'R06',cat:'porte',name:'Porta fissa',desc:'Pannello fisso senza apertura'},
 {id:'V01',cat:'vetrine',name:'Vetrina modulare fissa',desc:'Montanti e pannelli vetrati'},
 {id:'V02',cat:'vetrine',name:'Vetrina con porta centrale',desc:'Due moduli laterali e porta battente'},
 {id:'V03',cat:'vetrine',name:'Vetrina con doppia porta',desc:'Ingresso doppio e vetri laterali'},
 {id:'V04',cat:'vetrine',name:'Vetrina angolare',desc:'Due fronti vetrati ad angolo'},
 {id:'M01',cat:'specchi',name:'Specchio rettangolare',desc:'Specchio e parete di riferimento'},
 {id:'M02',cat:'specchi',name:'Specchio circolare',desc:'Sagoma rotonda reale'},
 {id:'M03',cat:'specchi',name:'Specchio ad arco',desc:'Parte superiore arrotondata'},
 {id:'M04',cat:'specchi',name:'Specchio sagomato',desc:'Poligono personalizzato modificabile'}
 ],names:{scale:'Scale',parapetti:'Parapetti e ringhiere',docce:'Box doccia',porte:'Porte in vetro',vetrine:'Vetrine commerciali',specchi:'Specchi'}};
function v5Esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function v5Gallery(cat){V5.category=cat||V5.category;let tabs=Object.entries(V5.names).map(([k,n])=>`<button class="btn ${k===V5.category?'primary':''}" onclick="v5Gallery('${k}')">${v5Esc(n)}</button>`).join('');let cards=V5.catalog.filter(x=>x.cat===V5.category).map((t,i)=>`<button class="v5model" onclick="v5Choose('${t.id}')"><div class="v5model-art">${t.cat==='scale'?'▰▱▰':t.cat==='parapetti'?'▥':t.cat==='porte'?'🚪':t.cat==='docce'?'◱':t.cat==='vetrine'?'▦':'◯'}<span>${t.id}</span></div><strong>${v5Esc(t.name)}</strong><small>${v5Esc(t.desc)}</small></button>`).join('');openModal(`<div class="v5gallery"><div class="flex"><div><h2>Scegli un modello · ${v5Esc(V5.names[V5.category])}</h2><p class="small">Ogni scelta genera una composizione 3D differente. Puoi poi selezionare e modificare ogni elemento.</p></div><button class="btn" onclick="closeModal()">Chiudi</button></div><div class="v5tabs">${tabs}</div><div class="v5models">${cards}</div></div>`)}
function v5Choose(code){const t=V5.catalog.find(t=>t.id===code);if(!t)return;closeModal();if(t.engine==='v4'){v4Create(code);return}const m=ensureV2(),before=typeof v3Snapshot==='function'?v3Snapshot():null;const objects=v5Make(t);m.objects=objects;m.type=({docce:'doccia',porte:'porta',vetrine:'vetrina',specchi:'specchio'})[t.cat];m.v4=null;m.v5={code,category:t.cat,name:t.name,version:1};E.selected=null;v2Refresh();if(before&&typeof v3Push==='function')v3Push(before);if(typeof toast==='function')toast(t.name+' creato: seleziona un oggetto per modificarlo.');}
function v5Make(t){const a=[];const m=ensureV2(),w=Math.max(700,Number(m.width)||1400),h=Math.max(1800,Number(m.height)||2200),d=Math.max(700,Number(m.depth)||900),th=Math.max(4,Number(m.thickness)||10);
 const put=(k,n,x,y,z,W,H,D,e={})=>a.push(obj(k,n,x,y,z,Math.max(1,W),Math.max(1,H),Math.max(1,D),{...e,v5Template:t.id}));
 const glass=(n,x,y,z,W,H,e={})=>put('glass',n,x,y,z,W,H,th,e);
 const handle=(n,x,y,z)=>put('accessory',n,x,y,z,30,230,35,{accessoryType:'maniglia'});
 const hinge=(n,x,y,z)=>put('accessory',n,x,y,z,76,94,48,{accessoryType:'cerniera'});
 const surround=(depth=0)=>{put('wall','Spalletta sinistra',-w/2-220,1200,depth,420,2400,120);put('wall','Spalletta destra',w/2+220,1200,depth,420,2400,120)};
 if(t.cat==='porte'){
   surround();put('floor','Pavimento',0,-40,0,w+900,70,1400,{finish:'piastrelle'});
   if(t.id==='R01'||t.id==='R06'){glass(t.id==='R06'?'Pannello fisso':'Anta battente',0,h/2,0,w,h);if(t.id==='R01'){handle('Maniglia',w/2-130,1000,th/2+34);hinge('Cerniera bassa',-w/2+20,320,0);hinge('Cerniera alta',-w/2+20,h-320,0)}}
   else if(t.id==='R02'){glass('Anta sinistra',-w/4,h/2,0,w/2-8,h);glass('Anta destra',w/4,h/2,0,w/2-8,h);handle('Maniglia sinistra',-45,1000,35);handle('Maniglia destra',45,1000,35);for(const sx of [-1,1])for(const yy of [320,h-320])hinge('Cerniera',sx*(w/2-20),yy,0)}
   else if(t.id==='R03'){glass('Anta scorrevole',0,h/2,90,w,h);put('profile','Binario superiore',0,h+45,90,w+500,44,50);put('profile','Guida inferiore',0,25,90,36,50,62);handle('Maniglione',w/2-150,1000,124)}
   else if(t.id==='R04'){glass('Anta scorrevole sinistra',-w/4,h/2,40,w/2+30,h);glass('Anta scorrevole destra',w/4,h/2,95,w/2+30,h);put('profile','Doppio binario',0,h+35,65,w+100,45,130);handle('Maniglia sinistra',-70,1000,76);handle('Maniglia destra',70,1000,130)}
   else {glass('Anta libro A',-w/4,h/2,0,w/2-8,h);glass('Anta libro B',w/4,h/2,0,w/2-8,h);hinge('Cerniera centrale bassa',0,350,0);hinge('Cerniera centrale alta',0,h-350,0);hinge('Cerniera laterale bassa',-w/2+20,350,0);hinge('Cerniera laterale alta',-w/2+20,h-350,0);handle('Maniglia',w/2-110,1000,36)}
 }else if(t.cat==='docce'){
   put('floor','Piatto doccia',0,-45,0,w+120,75,d+120,{finish:'piastrelle'});put('wall','Parete posteriore',0,1200,-d/2-70,w+240,2400,110,{finish:'piastrelle'});
   if(t.id==='D01'){glass('Parete Walk-In',-w/5,h/2,d/2,w*.65,h);put('profile','Barra stabilizzatrice',-w/5,h-60,0,30,30,d,{rx:90})}
   if(t.id==='D02'){glass('Fisso',w/4,h/2,d/2,w/2+10,h);glass('Scorrevole',-w/4,h/2,d/2+32,w/2+10,h);put('profile','Binario superiore',0,h+22,d/2,w+35,35,55);handle('Maniglia',-130,1050,d/2+68)}
   if(t.id==='D03'){glass('Anta battente',0,h/2,d/2,w*.85,h);hinge('Cerniera inferiore',-w*.425+20,360,d/2);hinge('Cerniera superiore',-w*.425+20,h-330,d/2);handle('Maniglia',w*.425-120,1030,d/2+30)}
   if(t.id==='D04'){glass('Laterale fisso',w/2,h/2,0,d,h,{ry:90});glass('Frontale fisso',-w/4,h/2,d/2,w/2,h);glass('Porta angolare',w/4,h/2,d/2,w/2,h);put('profile','Profilo angolare',w/2,h/2,d/2,35,h,35);handle('Maniglia',140,1030,d/2+35)}
 }else if(t.cat==='vetrine'){
   put('floor','Pavimento negozio',0,-45,0,w+850,85,1700,{finish:'piastrelle'});
   const fixed=(name,x,W,z=0)=>glass(name,x,h/2,z,W,h);
   if(t.id==='V01'){let pw=w/3;for(let i=0;i<3;i++)fixed('Modulo fisso '+(i+1),-w/2+pw*(i+.5),pw-14)}
   if(t.id==='V02'){let side=w*.27,center=w-2*side;fixed('Vetro sinistro',-w/2+side/2,side-12);fixed('Vetro destro',w/2-side/2,side-12);fixed('Porta centrale',0,center-18);handle('Maniglia ingresso',center/2-100,1020,34);hinge('Cerniera ingresso',-center/2+15,350,0)}
   if(t.id==='V03'){let side=w*.2,center=w-2*side;fixed('Vetro sinistro',-w/2+side/2,side-12);fixed('Vetro destro',w/2-side/2,side-12);fixed('Porta ingresso A',-center/4,center/2-12);fixed('Porta ingresso B',center/4,center/2-12);handle('Maniglia A',-50,1020,38);handle('Maniglia B',50,1020,38)}
   if(t.id==='V04'){fixed('Fronte principale',-w/4,w/2-12);glass('Fronte laterale',w/2,h/2,-d/4,d/2,h,{ry:90});fixed('Porta ingresso',w/4,w/2-18);handle('Maniglia ingresso',w/2-115,1020,35)}
   put('profile','Traverso superiore',0,h+12,0,w+35,28,45);for(let x of [-w/2,w/2])put('profile','Montante laterale',x,h/2,0,32,h,45)
 }else if(t.cat==='specchi'){
   let W=Math.min(w,1500),H=Math.min(h,1700),shape=null;if(t.id==='M02'){W=H=Math.min(W,H);shape=[];for(let i=0;i<64;i++){let ang=i*2*Math.PI/64;shape.push([W/2+W/2*Math.cos(ang),H/2+H/2*Math.sin(ang)])}}
   if(t.id==='M03'){shape=[[0,0],[W,0],[W,H*.66]];for(let i=0;i<=32;i++){let angle=i*Math.PI/32;shape.push([W/2+W/2*Math.cos(angle),H*.66+H*.34*Math.sin(angle)])}shape.push([0,H*.66])}
   if(t.id==='M04')shape=[[0,0],[W*.86,0],[W,H*.22],[W*.87,H],[W*.3,H],[0,H*.7]];
   put('wall','Parete di riferimento',0,H/2,-70,W+500,H+550,90,{finish:'neutral'});put('mirror','Specchio',0,H/2,0,W,H,6,{shape,shapePreset:shape?'free':'rect'})
 }return a;}
function v5Mount(){const panel=document.querySelector('.v2layout > .v2panel:first-child');if(!panel)return;if(document.getElementById('v5categories'))return;
 const content=`<section id="v5categories"><h3>Modelli per categoria</h3><p class="small">Scegli una categoria e apri i suoi modelli tridimensionali.</p><div class="v5catgrid">${Object.entries(V5.names).map(([k,n])=>`<button class="btn" onclick="v5Gallery('${k}')">${v5Esc(n)}</button>`).join('')}</div><button class="btn" style="margin-top:8px;width:100%" onclick="v2Empty()">Progetto libero · spazio vuoto</button></section>`;
 panel.insertAdjacentHTML('afterbegin',content);
 const old=panel.querySelector('details:has(#v2tpl)');if(old)old.style.display='none';
 for(const b of panel.querySelectorAll('button'))if(b.textContent.includes('Galleria scale e parapetti'))b.style.display='none';
 if(!document.getElementById('v5style')){let style=document.createElement('style');style.id='v5style';style.textContent=`.v5catgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v5catgrid button{text-align:left;padding:9px;font-size:12px}.v5tabs{display:flex;gap:6px;flex-wrap:wrap;margin:16px 0}.v5tabs .btn{font-size:12px;padding:9px}.v5models{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v5model{display:grid;gap:8px;text-align:left;border:1px solid #d7e4e7;border-radius:12px;background:white;padding:12px;color:#193844}.v5model:hover{border-color:#197e7b;background:#f0f9f7}.v5model small{color:#78919b}.v5model-art{height:82px;background:linear-gradient(135deg,#dceff0,#b9d8d8);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:42px;color:#347a83;position:relative}.v5model-art span{font:700 12px system-ui;position:absolute;top:7px;left:9px;background:#fff;padding:4px 7px;border-radius:4px}@media(max-width:600px){.v5models{grid-template-columns:1fr}}.modal>div:has(.v5gallery){width:min(900px,100%)}`;document.head.appendChild(style)} }
// Alcuni template possono essere aperti dal pannello V4; il menu V5 resta sempre visibile.
const v5OldMount=v4Mount;v4Mount=function(...args){const result=v5OldMount(...args);v5Mount();return result};
const v5OldRefresh=v2Refresh;v2Refresh=function(...args){const result=v5OldRefresh(...args);v5Mount();return result};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v5Mount);else v5Mount();
