/* VetroStudio - libreria tecnica accessori per vetreria (D1 + R2).
   Formati CAD originali archiviati: DWG, STEP. Import geometrico attivo: DXF 2D e GLB 3D.
   Non interpreta direttamente DWG e STEP nel browser. */
(()=>{'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const $=id=>document.getElementById(id);
const number=x=>Number(x)||0;
const S={items:[],selected:null,cuts:{holes:[],cutouts:[],origin:[0,0]},lastImport:null};
const categories=[['cerniera','Cerniere'],['maniglia','Maniglie'],['borchia','Borchie'],['morsetto','Morsetti'],['profilo','Profili'],['altro','Altri accessori']];
const files=['dwg','step','dxf','glb'];
const request=async(url,method='GET',value)=>{const opts={method,credentials:'same-origin'};if(value!==undefined){opts.headers={'Content-Type':'application/json'};opts.body=JSON.stringify(value)}const r=await fetch('/api'+url,opts);const d=await r.json().catch(()=>({error:'Risposta server non valida'}));if(!r.ok)throw Error(d.error||'Errore server');return d};
function notify(message){if(typeof toast==='function')toast(message);else alert(message)}
const safeJson=x=>{try{return JSON.parse(x)}catch{return {holes:[],cutouts:[],origin:[0,0]}}};
function library(){return `<style>.techLayout{display:grid;grid-template-columns:minmax(200px,290px) minmax(0,1fr);gap:16px}.techLayout .panel{max-width:none}.techLayout #techDetail .grid2{gap:12px}@media(max-width:900px){.techLayout{grid-template-columns:1fr}}.techLayout input[type=file]{font-size:12px}</style><div class="panel"><div class="flex wrap"><div><h2>Libreria tecnica accessori</h2><p class="muted">Archivia i file originali e importa un pacchetto di lavorazioni e modello 3D. Ogni importazione deve essere verificata e approvata prima dell’utilizzo.</p></div><button class="btn primary" onclick="VSTech.create()">+ Nuovo accessorio</button></div><p class="small">I file appartengono alla singola vetreria. Una lavorazione importata rimane <b>Da verificare</b> finché non viene approvata. L'approvazione non sostituisce i controlli di produzione.</p><div class="techLayout"><div id="techList"></div><div id="techDetail"><p class="muted">Seleziona un accessorio.</p></div></div></div>`}
async function refresh(){try{S.items=(await request('/technical-accessories')).items;render()}catch(e){const list=$('techList');if(list)list.textContent=e.message;notify(e.message)}}
function render(){const list=$('techList');if(!list)return;list.innerHTML=S.items.map(x=>`<button class="btn" style="width:100%;text-align:left;display:block;margin:7px 0;white-space:normal" onclick="VSTech.open('${x.id}')"><strong>${E(x.code)} — ${E(x.name)}</strong><span class="small" style="display:block">${E(x.category)} · ${x.status==='approved'?'Approvato':'Da verificare'}</span></button>`).join('')||'<p>Nessun accessorio ancora caricato.</p>'}
async function create(){const code=prompt('Codice articolo (es. GS-304)');if(code===null)return;const name=prompt('Nome accessorio');if(name===null)return;try{const r=await request('/technical-accessories','POST',{code,name,category:'cerniera'});await refresh();await open(r.id)}catch(e){notify(e.message)}}
async function open(id){try{const r=await request('/technical-accessories/'+id);S.selected=r.item;S.cuts=safeJson(r.item.cut_spec);detail()}catch(e){notify(e.message)}}
const fileBadge=(type,meta)=>meta?.[type]?`<span class="tag">${type.toUpperCase()} caricato (${Math.round(meta[type].size/1024)} KB)</span>`:`<span class="small">${type.toUpperCase()} non presente</span>`;
function detail(){let it=S.selected,el=$('techDetail');if(!el||!it)return;let meta=safeJson(it.model_meta),cuts=S.cuts;
 el.innerHTML=`<div class="panel" style="margin:0"><div class="flex"><h3>${E(it.name)}</h3><span class="tag ${it.status==='approved'?'':'warning'}">${it.status==='approved'?'Approvato':'Da verificare'}</span></div>
 <div class="grid2"><label class="qfield">Codice<input id="taCode" value="${E(it.code)}"></label><label class="qfield">Nome<input id="taName" value="${E(it.name)}"></label><label class="qfield">Categoria<select id="taCat">${categories.map(([v,t])=>`<option value="${v}" ${it.category===v?'selected':''}>${t}</option>`).join('')}</select></label><label class="qfield">Produttore<input id="taManufacturer" value="${E(it.manufacturer||'')}"></label><label class="qfield">Spessore min. mm<input id="taMin" type="number" step="0.1" value="${it.glass_min}"></label><label class="qfield">Spessore max. mm<input id="taMax" type="number" step="0.1" value="${it.glass_max}"></label><label class="qfield">Prezzo €<input id="taPrice" type="number" step="0.01" value="${it.price}"></label></div>
 <h4>File tecnici privati</h4><p class="small">DWG/STEP vengono conservati come originali. DXF contiene il profilo di lavorazione; GLB è il modello renderizzabile in 3D.</p>
 ${files.map(ext=>`<div class="flex wrap" style="margin:10px 0"><label class="small"><b>${ext.toUpperCase()}</b> <input id="taFile_${ext}" type="file" accept=".${ext}" style="max-width:180px"></label><button class="btn" onclick="VSTech.upload('${ext}')">Carica</button><span>${fileBadge(ext,meta)}</span>${meta?.[ext]?`<button class="btn" onclick="VSTech.download('${ext}')">Apri</button>`:''}</div>`).join('')}
 <hr><h4>Importazione locale (senza server di conversione)</h4>
 <p class="small">Il browser converte <b>STEP → GLB</b> per il 3D e riconosce <b>DXF ASCII → fori/scassi</b> per il 2D. Il file <b>DWG</b> viene conservato, ma per applicare lavorazioni serve il relativo DXF: un DWG binario non è interpretato automaticamente. Nessuna quota viene inventata.</p>
 <div class="grid2"><label class="qfield">DWG originale (facoltativo)<input id="taAutoDWG" type="file" accept=".dwg"></label><label class="qfield">STEP accessorio<input id="taAutoSTEP" type="file" accept=".step,.stp"></label><label class="qfield">DXF lavorazione del vetro<input id="taAutoDXF" type="file" accept=".dxf"></label><label class="qfield">Layer di taglio (separati da virgola)<input id="taAutoLayers" placeholder="es. GLASS_CUT, HOLES"></label></div>
 <div class="actions"><button class="btn primary" id="taAutoButton" onclick="VSTech.autoImport()">Analizza e salva in bozza</button></div>
 <p id="taAutoReport" class="small" role="status" aria-live="polite"></p>
 <hr><h4>Importazione assistita STEP / DXF / DWG</h4>
 <p class="small">Il programma <code>prepara_accessorio.py</code> (nella ZIP) crea un pacchetto tecnico da STEP e DXF, oppure DWG con convertitore ODA installato. Il file importato resta una <b>bozza da verificare</b>.</p>
 <div class="flex wrap"><input id="taImportPkg" type="file" accept=".json,.vstimport.json,application/json" style="max-width:290px"><button class="btn" onclick="VSTech.importPackage()">Importa pacchetto tecnico</button></div>
 <p id="taImportReport" class="small" role="status"></p>
 <hr><div class="flex"><h4>Lavorazioni 2D associate</h4><button class="btn" onclick="VSTech.extractDXF()">Rileva da DXF</button></div>
 <p class="small">Il riconoscimento automatico comprende cerchi e polilinee chiuse nel DXF ASCII. Le sagome non identificate richiedono conferma manuale.</p>
 <p class="small">Fori: <b>${cuts.holes?.length||0}</b> · Contorni interni: <b>${cuts.cutouts?.length||0}</b></p>
 <div class="grid2"><label class="qfield">Foro: X relativo mm<input type="number" id="taHX" value="0" step="0.1"></label><label class="qfield">Y relativo mm<input type="number" id="taHY" value="0" step="0.1"></label><label class="qfield">Diametro mm<input type="number" id="taHD" value="14" step="0.1"></label><div class="actions" style="align-self:end"><button class="btn" onclick="VSTech.addHole()">+ Aggiungi foro</button></div></div>
 <div id="taCuts">${cuts.holes.map((h,i)=>`<div class="item">Foro ${i+1}: X ${number(h.x).toFixed(1)} · Y ${number(h.y).toFixed(1)} · Ø ${(h.r*2).toFixed(1)} mm <button class="btn" onclick="VSTech.dropHole(${i})">Rimuovi</button></div>`).join('')}</div><div id="taCutouts">${cuts.cutouts.map((poly,i)=>`<div class="item">Contorno ${i+1}: ${poly.length} vertici · possibile taglio interno <button class="btn" onclick="VSTech.dropCutout(${i})">Escludi</button></div>`).join('')}</div>
 <div class="grid2"><label class="qfield">Spostamento X dei tagli (mm)<input id="taMoveX" type="number" value="0" step="0.1"></label><label class="qfield">Spostamento Y dei tagli (mm)<input id="taMoveY" type="number" value="0" step="0.1"></label></div><button class="btn" onclick="VSTech.movePattern()">Applica spostamento relativo</button><div id="taDrawing" style="max-width:500px;margin-top:10px"></div>
 <label class="small" style="display:flex;align-items:flex-start;gap:8px;margin-top:14px"><input type="checkbox" id="taNoCut" style="width:auto;margin-top:3px">Confermo espressamente che questo accessorio <b>non richiede alcuna lavorazione sul vetro</b> (verificato sulla scheda produttore).</label>
 <label class="small" style="display:flex;align-items:flex-start;gap:8px;margin-top:8px"><input type="checkbox" id="taVerified" style="width:auto;margin-top:3px">Ho verificato con i documenti del produttore: origine, quote, orientamento, spessore, contorni e fori. Approvo per riutilizzo interno.</label>
 <div class="actions" style="margin-top:14px"><button class="btn" onclick="VSTech.save('draft')">Salva bozza</button><button class="btn primary" onclick="VSTech.save('approved')">Approva lavorazioni</button><button class="btn danger" onclick="VSTech.deleteItem()">Elimina accessorio</button></div><p class="small">Per l'approvazione verifica origine, orientamento, tagli e compatibilità con le specifiche del produttore.</p></div>`;
 draw();}
function draw(){const el=$('taDrawing');if(!el)return;const h=S.cuts.holes||[],poly=S.cuts.cutouts||[];let coords=[];for(const a of h){coords.push([a.x-a.r,a.y-a.r],[a.x+a.r,a.y+a.r])}for(const p of poly)coords.push(...p);const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);const lowX=Math.min(0,...xs)-30,highX=Math.max(100,...xs)+30,lowY=Math.min(0,...ys)-30,highY=Math.max(100,...ys)+30;const scale=Math.min(400/(highX-lowX),220/(highY-lowY));const pos=p=>[(p[0]-lowX)*scale+20,260-(p[1]-lowY)*scale-20];el.innerHTML=`<svg viewBox="0 0 460 280" style="background:#f0f5f7;width:100%;border:1px solid #dae4e6;border-radius:9px"><path d="M20 250H440 M20 250V12" stroke="#a2afb6" fill="none"/>${poly.map(points=>`<polygon points="${points.map(p=>pos(p).join(',')).join(' ')}" fill="#dfeafa" stroke="#176b7a" stroke-width="2"/>`).join('')}${h.map(a=>{const c=pos([a.x,a.y]);return `<circle cx="${c[0]}" cy="${c[1]}" r="${a.r*scale}" stroke="#c35e35" stroke-width="2" fill="#fff"/>`}).join('')}</svg><p class="small">Vista relativa al punto di fissaggio (0,0). Dimensioni in mm.</p>`}
function addHole(){const x=number($('taHX').value),y=number($('taHY').value),d=number($('taHD').value);if(d<=0||d>600)return notify('Diametro non valido');S.cuts.holes.push({x,y,r:d/2});detail()}
function dropHole(i){S.cuts.holes.splice(i,1);detail()}
function dropCutout(i){S.cuts.cutouts.splice(i,1);detail()}
function movePattern(){const dx=Number($('taMoveX').value),dy=Number($('taMoveY').value);if(!Number.isFinite(dx)||!Number.isFinite(dy))return notify('Coordinate non valide');for(const h of S.cuts.holes){h.x=+(h.x+dx).toFixed(2);h.y=+(h.y+dy).toFixed(2)}S.cuts.cutouts=S.cuts.cutouts.map(poly=>poly.map(q=>[+(q[0]+dx).toFixed(2),+(q[1]+dy).toFixed(2)]));detail()}
async function save(status){
 const t=S.selected;if(!t)return;
 const noCut=!S.cuts.holes.length&&!S.cuts.cutouts.length;
 if(status==='approved'){
  if(!$('taVerified')?.checked)return notify('Per approvare devi confermare la verifica con il disegno tecnico del produttore.');
  if(noCut&&!$('taNoCut')?.checked)return notify('Nessuna lavorazione: conferma esplicitamente che l’accessorio non richiede tagli.');
  if(!confirm('Confermi di aver verificato tutte le geometrie tecniche e di voler rendere la scheda riutilizzabile nei progetti?'))return;
 }
 try{await request('/technical-accessories/'+t.id,'PATCH',{
  code:$('taCode').value,name:$('taName').value,category:$('taCat').value,
  manufacturer:$('taManufacturer').value,glass_min:$('taMin').value,glass_max:$('taMax').value,
  price:$('taPrice').value,status,cut_spec:S.cuts,no_cutting:noCut&&status==='approved'&&$('taNoCut').checked});
  notify(status==='approved'?'Scheda approvata':'Bozza salvata');await refresh();await open(t.id)
 }catch(e){notify(e.message)}
}
function safePackage(d){
 if(!d||d.format!=='vetrostudio-technical-import'||d.version!==1||d.status!=='draft')throw Error('Pacchetto tecnico sconosciuto o versione non supportata');
 if(!d.cuts||!Array.isArray(d.cuts.holes)||!Array.isArray(d.cuts.cutouts)||d.cuts.holes.length>80||d.cuts.cutouts.length>40)throw Error('Lavorazioni del pacchetto non valide');
 for(const h of d.cuts.holes)if(![h.x,h.y,h.r].every(Number.isFinite)||h.r<=0||h.r>300)throw Error('Foratura non valida');
 for(const poly of d.cuts.cutouts)if(!Array.isArray(poly)||poly.length<3||poly.length>300||poly.some(v=>!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x))))throw Error('Contorno non valido');
 if(d.glb_base64&&(!/^[A-Za-z0-9+/=]+$/.test(d.glb_base64)||d.glb_base64.length>15e6))throw Error('Modello 3D non valido o troppo grande');
 return d;
}
async function importPackage(){
 const f=$('taImportPkg')?.files?.[0];if(!f)return notify('Seleziona il file .vstimport.json');
 if(f.size>16*1024*1024)return notify('Pacchetto troppo grande (max 16 MB)');
 const id=S.selected?.id;if(!id)return notify('Seleziona un accessorio');
 try{
  const d=safePackage(JSON.parse(await f.text()));
  const warnings=(d.warnings||[]).map(String).slice(0,20);
  const report=`${d.cuts.holes.length} fori, ${d.cuts.cutouts.length} contorni, modello STEP: ${d.glb_base64?'sì':'no'}.`;
  if(!confirm(`IMPORTAZIONE DA VERIFICARE\n${report}\n\n${warnings.join('\n')}\n\nImportare come BOZZA sovrascrivendo le lavorazioni precedenti?`))return;
  if(d.glb_base64){
   const bin=atob(d.glb_base64),bytes=new Uint8Array(bin.length);
   for(let k=0;k<bin.length;k++)bytes[k]=bin.charCodeAt(k);
   if(String.fromCharCode(...bytes.slice(0,4))!=='glTF')throw Error('Il modello non è un GLB valido');
   const r=await fetch('/api/technical-accessories/'+id+'/files/glb',{
    method:'PUT',body:bytes,credentials:'same-origin',headers:{'Content-Type':'application/octet-stream'}});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Caricamento GLB fallito');
  }
  await request('/technical-accessories/'+id,'PATCH',{
    code:d.code||S.selected.code,name:d.name||S.selected.name,category:S.selected.category,
    glass_min:S.selected.glass_min,glass_max:S.selected.glass_max,
    status:'draft',cut_spec:d.cuts});
  await open(id);
  const el=$('taImportReport');if(el)el.textContent=`Importazione in bozza: ${report} ${warnings.join(' | ')} Verifica manuale obbligatoria.`;
  notify('Importazione completata in BOZZA. Verifica le geometrie prima di approvare.');
 }catch(e){notify('Importazione non completata: '+e.message)}
}

let browserEnginePromise;
function loadBrowserEngine(){
 if(window.VSCADBrowser)return Promise.resolve(window.VSCADBrowser);
 if(!browserEnginePromise)browserEnginePromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='/cad-browser-import.js';script.async=true;
  script.onload=()=>window.VSCADBrowser?resolve(window.VSCADBrowser):reject(Error('Modulo CAD browser non caricato'));
  script.onerror=()=>reject(Error('Manca public/cad-browser-import.js nel deployment'));
  document.head.append(script);
 }).catch(e=>{browserEnginePromise=null;throw e});
 return browserEnginePromise;
}
async function autoImport(){
 const id=S.selected?.id;if(!id)return notify('Seleziona prima un accessorio');
 const dwg=$('taAutoDWG')?.files?.[0],step=$('taAutoSTEP')?.files?.[0],dxf=$('taAutoDXF')?.files?.[0];
 if(!dwg&&!step&&!dxf)return notify('Seleziona STEP, DXF oppure DWG');
 if([dwg,step,dxf].some(f=>f&&(!f.size||f.size>12*1024*1024)))return notify('Ogni file deve essere non vuoto e non superare 12 MB');
 const btn=$('taAutoButton'),rep=$('taAutoReport');
 if(btn){btn.disabled=true;btn.textContent='Analisi CAD nel browser…'}
 try{
  const engine=await loadBrowserEngine();
  let result=null,model=null;const warnings=[];
  if(dxf){const text=await dxf.text();const layers=($('taAutoLayers')?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
   result=engine.parseDxf(text,layers);
   warnings.push(result.warning,...result.ignored.slice(0,8).map(x=>'Ignorato: '+x));
  }
  if(step){model=await engine.stepToGlb(step);warnings.push(model.warning)}
  if(dwg&&!dxf)warnings.push('DWG originale archiviabile ma NON letto: esporta il disegno tagli in DXF ASCII con unità millimetri. Nessun taglio è stato estratto dal DWG.');
  const nh=result?.cuts.holes.length||0,np=result?.cuts.cutouts.length||0;
  const message='STEP: '+(model?model.components+' componenti 3D':'non caricato')+'; DXF: '+nh+' fori, '+np+' contorni. '+warnings.join(' | ');
  if(rep)rep.textContent=message;
  if(!confirm(message+'\n\nConfermi il salvataggio in BOZZA? Devi controllare tutte le quote e approvare manualmente prima di usare le lavorazioni.'))return;
  const store=async(ext,bytes)=>{
   const r=await fetch('/api/technical-accessories/'+id+'/files/'+ext,{method:'PUT',body:bytes,credentials:'same-origin',headers:{'Content-Type':'application/octet-stream'}});
   if(!r.ok){const error=await r.json().catch(()=>({}));throw Error('File '+ext.toUpperCase()+' non salvato: '+(error.error||r.status))}
  };
  for(const [ext,file] of [['dwg',dwg],['step',step],['dxf',dxf]])if(file)await store(ext,file);
  if(model)await store('glb',model.bytes);
  const cutSpec=result?.cuts||S.cuts;
  await request('/technical-accessories/'+id,'PATCH',{status:'draft',cut_spec:cutSpec});
  await open(id);
  if($('taAutoReport'))$('taAutoReport').textContent=message+' · BOZZA DA VERIFICARE';
  notify('Importazione salvata in bozza. Verifica geometrie, origine e compatibilità prima di approvare.');
 }catch(e){notify('Importazione nel browser non completata: '+e.message);if(rep)rep.textContent=e.message}
 finally{const b=$('taAutoButton');if(b){b.disabled=false;b.textContent='Analizza e salva in bozza'}}
}
async function upload(ext){const f=$('taFile_'+ext)?.files?.[0];if(!f)return notify('Seleziona un file '+ext.toUpperCase());if(f.size>12*1024*1024)return notify('Dimensione massima: 12 MB');try{let r=await fetch('/api/technical-accessories/'+S.selected.id+'/files/'+ext,{method:'PUT',body:f,credentials:'same-origin',headers:{'Content-Type':'application/octet-stream'}});let d=await r.json();if(!r.ok)throw Error(d.error||'Upload non riuscito');notify('File '+ext.toUpperCase()+' conservato in R2');await open(S.selected.id)}catch(e){notify(e.message)}}
function download(ext){window.open('/api/technical-accessories/'+S.selected.id+'/files/'+ext,'_blank','noopener')}
async function deleteItem(){if(!confirm('Eliminare la scheda e i file allegati? Gli accessori già inseriti nei progetti restano archiviati nel progetto.'))return;try{await request('/technical-accessories/'+S.selected.id,'DELETE');S.selected=null;await refresh();$('techDetail').innerHTML='Scheda eliminata.'}catch(e){notify(e.message)}}
// Parser essenziale DXF ASCII: niente entità non supportate trasformate implicitamente in tagli.
function parseDXF(input){const raw=input.replace(/\r/g,'').split('\n'),pairs=[];for(let i=0;i+1<raw.length;i+=2)pairs.push([raw[i].trim(),raw[i+1].trim()]);let units=null,entities=[],section='',current=null;
 for(let i=0;i<pairs.length;i++){const [code,value]=pairs[i];if(code==='9'&&value==='$INSUNITS'&&pairs[i+1])units=Number(pairs[i+1][1]);if(code==='0'&&value==='SECTION')continue;if(code==='2'&&value==='ENTITIES'){section='entities';continue}if(code==='0'&&value==='ENDSEC'){if(current){entities.push(current);current=null}section='';continue}if(section!=='entities')continue;if(code==='0'){if(current)entities.push(current);current={type:value,data:[]}}else if(current)current.data.push([Number(code),value])}if(current&&section==='entities')entities.push(current);
 if(units!==4)throw Error('Unità DXF non confermate in millimetri ($INSUNITS=4). Converti o correggi il file prima di applicare i tagli.');
 const get=(d,k,defaultValue=0)=>{const t=d.find(([c])=>c===k);return t?Number(t[1]):defaultValue};const holes=[],cutouts=[],ignored=[];
 for(const en of entities){const d=en.data;if(en.type==='CIRCLE'){const r=get(d,40);if(r>0)holes.push({x:get(d,10),y:get(d,20),r})}
 else if(en.type==='LWPOLYLINE'){let xy=[],point=null;for(const [c,v] of d){if(c===10){if(point)xy.push(point);point=[Number(v),0]}if(c===20&&point)point[1]=Number(v)}if(point)xy.push(point);const flag=get(d,70);const bulged=d.some(([c,v])=>c===42&&Math.abs(Number(v))>1e-8);if(xy.length>=3&&(flag&1)&&!bulged)cutouts.push(xy);else ignored.push(en.type+' non chiusa o con archi')}
 else if(en.type!=='ENDSEC')ignored.push(en.type)}
 if(!holes.length&&!cutouts.length)throw Error('Nessuna geometria supportata nel DXF: il file potrebbe contenere archi, blocchi o layer speciali.');
 const coords=[...holes.map(h=>[h.x,h.y]),...cutouts.flat()],cx=(Math.min(...coords.map(q=>q[0]))+Math.max(...coords.map(q=>q[0])))/2,cy=(Math.min(...coords.map(q=>q[1]))+Math.max(...coords.map(q=>q[1])))/2;
 return {holes:holes.map(h=>({...h,x:Math.round((h.x-cx)*100)/100,y:Math.round((h.y-cy)*100)/100})),cutouts:cutouts.map(poly=>poly.map(p=>[+(p[0]-cx).toFixed(2),+(p[1]-cy).toFixed(2)])),origin:[cx,cy],ignored};}
async function extractDXF(){try{const r=await fetch('/api/technical-accessories/'+S.selected.id+'/files/dxf',{credentials:'same-origin'});if(!r.ok)throw Error('Carica prima un file DXF ASCII');const txt=await r.text();const result=parseDXF(txt);if(!confirm(`Riconosciuti ${result.holes.length} fori e ${result.cutouts.length} contorni chiusi. Entità ignorate: ${result.ignored.length}. Sostituire le lavorazioni attuali?`))return;S.cuts={holes:result.holes,cutouts:result.cutouts,origin:result.origin};detail();notify('Geometrie importate: verifica le quote e approva la scheda.')}catch(e){notify(e.message)}}
function renderPicker(){return `<div><h3>Inserisci accessorio tecnico</h3><p class="small">Seleziona una lastra, poi indica il punto di fissaggio misurato dal bordo sinistro e inferiore.</p><label class="label">Accessorio approvato</label><select class="field" id="pickTech">${S.items.filter(t=>t.status==='approved').map(t=>`<option value="${t.id}">${E(t.code)} · ${E(t.name)} (${t.glass_min}–${t.glass_max} mm)</option>`).join('')}</select><div class="grid2"><label>X sul vetro (mm)<input class="field" type="number" id="pickX" value="300"></label><label>Y sul vetro (mm)<input class="field" type="number" id="pickY" value="500"></label></div><div class="actions"><button class="btn primary" onclick="VSTech.place()">Applica lavorazioni e inserisci 3D</button></div></div>`}
async function picker(){if(!window.VSTechBridge?.selected())return notify('Seleziona prima una lastra nel configuratore 3D');try{S.items=(await request('/technical-accessories')).items;if(!S.items.some(t=>t.status==='approved'))return notify('Nessun accessorio approvato: aggiungine uno in Libreria tecnica');openModal(renderPicker());const o=window.VSTechBridge.selected();$('pickX').value=Math.round(o.w/2);$('pickY').value=Math.round(o.h/2)}catch(e){notify(e.message)}}
async function place(){try{const id=$('pickTech').value;const row=S.items.find(t=>t.id===id);const d=await request('/technical-accessories/'+id);const cuts=safeJson(d.item.cut_spec);const res=window.VSTechBridge.place({...row,cut_spec:cuts,model_meta:safeJson(d.item.model_meta)},Number($('pickX').value),Number($('pickY').value));if(!res.ok)throw Error(res.error);closeModal();notify('Accessorio inserito e lavorazioni applicate al vetro')}catch(e){notify(e.message)}}
window.VSTech={library,render:refresh,open,create,save,upload,download,deleteItem,addHole,dropHole,dropCutout,movePattern,extractDXF,importPackage,autoImport,picker,place,parseDXF};
})();
