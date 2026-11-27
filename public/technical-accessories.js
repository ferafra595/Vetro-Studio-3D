/* VetroStudio - Libreria tecnica R8. STEP -> GLB; DWG -> DXF -> sagoma e forature (da verificare). */
(()=>{'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const $=id=>document.getElementById(id);
const number=x=>Number(x)||0;
const S={items:[],selected:null,cuts:{holes:[],cutouts:[],origin:[0,0]},lastImport:null,dwgAnalysis:null,selectedCandidates:new Set()};
const categories=[['cerniera','Cerniere'],['maniglia','Maniglie'],['borchia','Borchie'],['morsetto','Morsetti'],['profilo','Profili'],['altro','Altri accessori']];
const files=['dwg','step','dxf','glb'];
const request=async(url,method='GET',value)=>{const opts={method,credentials:'same-origin'};if(value!==undefined){opts.headers={'Content-Type':'application/json'};opts.body=JSON.stringify(value)}const r=await fetch('/api'+url,opts);const d=await r.json().catch(()=>({error:'Risposta server non valida'}));if(!r.ok)throw Error(d.error||'Errore server');return d};
function notify(message){if(typeof toast==='function')toast(message);else alert(message)}
const safeJson=x=>{try{return JSON.parse(x)}catch{return {holes:[],cutouts:[],origin:[0,0]}}};
function library(){return `<style>.techLayout{display:grid;grid-template-columns:minmax(200px,290px) minmax(0,1fr);gap:16px}.techLayout .panel{max-width:none}.techLayout #techDetail .grid2{gap:12px}@media(max-width:900px){.techLayout{grid-template-columns:1fr}}.techLayout input[type=file]{font-size:12px}</style><div class="panel"><div class="flex wrap"><div><h2>Libreria tecnica accessori <span class="tag" id="taVersion" style="font-size:11px">R13 · DWG reale e DXF corretto</span></h2><p class="muted">Archivia i file originali e importa un pacchetto di lavorazioni e modello 3D. Ogni importazione deve essere verificata e approvata prima dell’utilizzo.</p></div><button class="btn primary" onclick="VSTech.create()">+ Nuovo accessorio</button></div><p class="small">I file appartengono alla singola vetreria. Una lavorazione importata rimane <b>Da verificare</b> finché non viene approvata. L'approvazione non sostituisce i controlli di produzione.</p><div class="techLayout"><div id="techList"></div><div id="techDetail"><p class="muted">Seleziona un accessorio.</p></div></div></div>`}
async function refresh(){try{S.items=(await request('/technical-accessories')).items;render()}catch(e){const list=$('techList');if(list)list.textContent=e.message;notify(e.message)}}
function render(){const list=$('techList');if(!list)return;list.innerHTML=S.items.map(x=>`<button class="btn" style="width:100%;text-align:left;display:block;margin:7px 0;white-space:normal" onclick="VSTech.open('${x.id}')"><strong>${E(x.code)} — ${E(x.name)}</strong><span class="small" style="display:block">${E(x.category)} · ${x.status==='approved'?'Approvato':'Da verificare'}</span></button>`).join('')||'<p>Nessun accessorio ancora caricato.</p>'}
async function create(){const code=prompt('Codice articolo (es. GS-304)');if(code===null)return;const name=prompt('Nome accessorio');if(name===null)return;try{const r=await request('/technical-accessories','POST',{code,name,category:'cerniera'});await refresh();await open(r.id)}catch(e){notify(e.message)}}
async function open(id){try{const r=await request('/technical-accessories/'+id);S.selected=r.item;S.cuts=safeJson(r.item.cut_spec);detail()}catch(e){notify(e.message)}}
const fileBadge=(type,meta)=>meta?.[type]?`<span class="tag">${type.toUpperCase()} caricato (${Math.round(meta[type].size/1024)} KB)</span>`:`<span class="small">${type.toUpperCase()} non presente</span>`;
function detail(){let it=S.selected,el=$('techDetail');if(!el||!it)return;let meta=safeJson(it.model_meta),cuts=S.cuts;
 el.innerHTML=`<div class="panel" style="margin:0"><div class="flex"><h3>${E(it.name)}</h3><span class="tag ${it.status==='approved'?'':'warning'}">${it.status==='approved'?'Approvato':'Da verificare'}</span></div>
 <div class="grid2"><label class="qfield">Codice<input id="taCode" value="${E(it.code)}"></label><label class="qfield">Nome<input id="taName" value="${E(it.name)}"></label><label class="qfield">Categoria<select id="taCat">${categories.map(([v,t])=>`<option value="${v}" ${it.category===v?'selected':''}>${t}</option>`).join('')}</select></label><label class="qfield">Produttore<input id="taManufacturer" value="${E(it.manufacturer||'')}"></label><label class="qfield">Spessore min. mm<input id="taMin" type="number" step="0.1" value="${it.glass_min}"></label><label class="qfield">Spessore max. mm<input id="taMax" type="number" step="0.1" value="${it.glass_max}"></label><label class="qfield">Prezzo €<input id="taPrice" type="number" step="0.01" value="${it.price}"></label></div>
 <h4>Importa accessorio e tagli (STEP + DWG)</h4>
 <p class="small">STEP per visualizzare la cerniera in 3D, DWG per ricavare i tagli. Il DWG viene prima convertito internamente in DXF, poi vengono cercati i layer e riconosciuti fori, linee, archi e profili chiusi. Geometrie incompatibili vengono segnalate e non generano tagli. Verifica tutte le quote prima di approvare.</p>
 <div class="grid2"><label class="qfield">STEP · modello 3D<input id="taAutoSTEP" type="file" accept=".step,.stp"></label><label class="qfield">DWG · disegno dei tagli<input id="taAutoDWG" type="file" accept=".dwg"></label></div><div class="actions" style="margin:12px 0;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="taInspectButton" onclick="VSTech.inspectDwg()">Riconosci automaticamente la lavorazione DWG</button><button class="btn" id="taOriginalDXFButton" onclick="VSTech.downloadOriginalDxf()">Scarica DXF originale convertito</button></div>
 <p class="small">Il riconoscimento cerca la tasca rettangolare e i due raccordi circolari, ricavando quote e posizioni dal file. Non devi selezionare i cerchi o il contorno verde del vetro.</p>
 <div style="display:none"><input id="taAutoLayers" value=""></div>
 <p class="small" id="taDwgLayers" role="status"></p><div id="taDwgCandidates" style="margin:10px 0"></div><details style="margin:10px 0"><summary class="small" style="cursor:pointer">Hai già un DXF? Importazione alternativa</summary><label class="qfield">DXF · lavorazioni vetro<input id="taAutoDXF" type="file" accept=".dxf"></label></details>
 <label class="small" style="display:flex;align-items:center;gap:9px;margin:10px 0"><input type="checkbox" id="taDWGMM" style="width:16px;height:16px;flex:none;margin:0"> Confermo che il DWG è quotato in millimetri, se il file non riporta le unità</label><p class="small">Lettore gratuito LibreDWG, licenza GPL-3.0: verificare gli obblighi prima dell’uso commerciale.</p><div class="actions"><button class="btn primary" id="taAutoButton" onclick="VSTech.autoImport()">Analizza e salva in bozza</button></div>
 <p id="taAutoReport" class="small" role="status" aria-live="polite"></p>
 <div style="border:1px solid #d5e5e9;border-radius:10px;padding:12px;margin-top:12px"><strong>File già archiviati</strong><div class="flex wrap" style="margin-top:8px">${files.map(ext=>`<span style="display:inline-flex;align-items:center;gap:8px;margin-right:10px">${fileBadge(ext,meta)}${meta?.[ext]?`<button class="btn" onclick="VSTech.download('${ext}')">Apri</button>`:''}</span>`).join('')}</div><p class="small" style="margin:8px 0 0">Per aggiornare un singolo allegato senza importare lavorazioni: ${files.map(ext=>`<label style="display:inline-block;margin-right:8px"><span>${ext.toUpperCase()}</span><input id="taFile_${ext}" type="file" accept=".${ext}" style="max-width:145px"><button class="btn" onclick="VSTech.upload('${ext}')">Carica</button></label>`).join('')}</p></div>
 <hr><div class="flex"><h4>Lavorazioni 2D associate</h4><button class="btn" onclick="VSTech.exportDxf()">Esporta DXF delle lavorazioni</button></div>
 <p class="small">Il DWG produce, quando riconosciuto e confermato, un DXF tecnico in millimetri con i tagli estratti. Verifica sempre le quote del produttore: non è un programma CNC.</p>
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
  const script=document.createElement('script');script.src='/cad-browser-import.js?v=R5-local-20261123';script.async=true;
  script.onload=()=>window.VSCADBrowser?resolve(window.VSCADBrowser):reject(Error('Modulo CAD browser non caricato'));
  script.onerror=()=>reject(Error('Manca public/cad-browser-import.js nel deployment'));
  document.head.append(script);
 }).catch(e=>{browserEnginePromise=null;throw e});
 return browserEnginePromise;
}
async function loadDWGEngine(){
 if(window.VSDWGImport)return window.VSDWGImport;
 await new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='/dwg-browser-import.js?v=R13-dxf-arc-20261123';
  s.onload=()=>window.VSDWGImport?resolve():reject(Error('Modulo DWG caricato senza API'));
  s.onerror=()=>reject(Error('Modulo DWG non disponibile: verifica il deployment'));document.head.append(s);
 });
 return window.VSDWGImport;
}
function selectLayer(name){const el=$('taAutoLayers');if(el)el.value=name}
function candidateSvg(item){
 let pts=item.kind==='contorno'?item.points:null;
 if(!pts&&item.hole){const h=item.hole;pts=Array.from({length:49},(_,i)=>[h.x+h.r*Math.cos(i*Math.PI*2/48),h.y+h.r*Math.sin(i*Math.PI*2/48)])}
 if(!pts?.length)return '';
 const x=pts.map(p=>p[0]),y=pts.map(p=>p[1]),minX=Math.min(...x),maxX=Math.max(...x),minY=Math.min(...y),maxY=Math.max(...y);
 const w=Math.max(0.1,maxX-minX),h=Math.max(0.1,maxY-minY),scale=Math.min(110/w,58/h);
 const path=pts.map((p,i)=>(i?'L':'M')+' '+((p[0]-minX)*scale+5).toFixed(2)+' '+((maxY-p[1])*scale+5).toFixed(2)).join(' ')+' Z';
 return '<svg viewBox="0 0 '+(w*scale+10)+' '+(h*scale+10)+'" width="125" height="75" style="max-width:100%;border-radius:6px;background:#eef7f9"><path d="'+path+'" fill="rgba(35,137,151,.15)" stroke="#126778" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
}
function chooseCandidate(id,checked){
 if(checked)S.selectedCandidates.add(id);else S.selectedCandidates.delete(id);
 const count=$('taCandidateCount');if(count)count.textContent=S.selectedCandidates.size+' elementi selezionati · bozza da verificare';
}
function renderCandidates(){
 const el=$('taDwgCandidates'),report=S.dwgAnalysis;if(!el||!report)return;
 const notch=report.autoNotch;
 if(notch?.status==='matched'){
  const cut=notch.cuts.cutouts[0],preview=candidateSvg({kind:'contorno',points:cut});
  const dim=notch.dimensions;
  el.innerHTML='<div style="border:1px solid #c2dcdf;background:#f3faf9;border-radius:10px;padding:14px"><strong>Scasso riconosciuto automaticamente</strong><p class="small">Una tasca rettangolare con due raccordi circolari: è un unico taglio laterale, non tre fori separati. Il contorno del vetro non viene importato.</p><div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">'+preview+'<div><b>Ø '+dim.diameter+' mm</b><br>Interasse raccordi: '+dim.centerSpacing+' mm<br>Profondità fino al tratto interno: '+dim.notchDepth+' mm<br>Apertura: '+(dim.opening??'—')+' mm<br>Ingombro massimo: '+(dim.overallWidth??'—')+' × '+(dim.overallHeight??'—')+' mm<br>Layer: '+E(notch.layer)+'</div></div><p class="small">BOZZA: controlla sul disegno del produttore queste tre quote e l’orientamento prima di approvare. Le curve DXF sono approssimate per l’anteprima e non per la CNC.</p></div>';
 }else{
  el.innerHTML='<div style="border:1px solid #eed2be;background:#fffaf4;border-radius:10px;padding:13px"><strong>Taglio automatico non disponibile per questo disegno</strong><p class="small">'+E(notch?.reason||'Nessuna lavorazione univoca riconosciuta')+'</p><p class="small">Nessun taglio verrà generato o salvato. Il file può contenere archi non collegati, blocchi o rappresentazioni non eseguibili. Non scegliere manualmente linee o simboli che sembrano uguali al taglio.</p></div>';
 }
}
async function downloadOriginalDxf(){
 const file=$('taAutoDWG')?.files?.[0];if(!file)return notify('Seleziona prima il DWG del produttore');
 const button=$('taOriginalDXFButton');
 if(button){button.disabled=true;button.textContent='Conversione DWG in DXF…'}
 try{
  const reader=await loadDWGEngine();
  const dxf=await reader.convertOriginalDwgToDxf(file);
  const blob=new Blob([dxf],{type:'application/dxf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=file.name.replace(/\.dwg$/i,'')+'_ORIGINALE_CONVERTITO.dxf';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  notify('DXF originale del produttore convertito. Contiene quote, geometrie e riferimenti: non usarlo direttamente per CNC. Puoi condividerlo per analizzare il taglio esatto.');
 }catch(err){notify('Conversione DXF non disponibile: '+err.message)}
 finally{if(button){button.disabled=false;button.textContent='Scarica DXF originale convertito'}}
}
async function inspectDwg(){
 const f=$('taAutoDWG')?.files?.[0];if(!f)return notify('Seleziona prima il file DWG del produttore');
 const b=$('taInspectButton');if(b){b.disabled=true;b.textContent='Esame DWG in corso…'}
 S.dwgAnalysis=null;S.selectedCandidates=new Set();
 try{
  const engine=await loadDWGEngine(),report=await engine.inspectDwg(f);
  S.dwgAnalysis={...report,file:f};
  const rows=Object.entries(report.layers||{}).sort((a,b)=>b[1].total-a[1].total);
  const dest=$('taDwgLayers');
  if(dest)dest.textContent='Unità: '+(report.units===4?'mm':report.units===0||report.units==='unknown'?'non dichiarate':report.units)+' · Entità: '+report.entities+' · Layer: '+rows.map(([n,s])=>n+' ('+Object.entries(s.types).map(([t,q])=>t+' '+q).join(', ')+')').join(' | ');
  renderCandidates();
  notify(report.autoNotch?.status==='matched'?'Scasso laterale riconosciuto. Controlla le quote e salva in bozza.':'DWG letto, ma lo scasso non è stato riconosciuto con certezza. Nessun taglio verrà creato.');
 }catch(err){const dest=$('taDwgLayers');if(dest)dest.textContent=err.message;notify('Impossibile esaminare DWG: '+err.message)}
 finally{if(b){b.disabled=false;b.textContent='Esamina DWG e individua i layer'}}
}
async function autoImport(){
 const id=S.selected?.id;if(!id)return notify('Seleziona prima un accessorio');
 const dwg=$('taAutoDWG')?.files?.[0],step=$('taAutoSTEP')?.files?.[0],dxf=$('taAutoDXF')?.files?.[0];
 if(!dwg&&!step&&!dxf)return notify('Seleziona almeno un file STEP o DWG.');
 
 if([dwg,step,dxf].some(f=>f&&(!f.size||f.size>12*1024*1024)))return notify('Ogni file deve essere non vuoto e non superare 12 MB');
 const btn=$('taAutoButton'),rep=$('taAutoReport');
 if(btn){btn.disabled=true;btn.textContent='Analisi CAD nel browser…'}
 try{
  const engine=await loadBrowserEngine();
  let result=null,model=null;const warnings=[];
  const layers=($('taAutoLayers')?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(dwg&&dxf)throw Error('Seleziona DWG oppure DXF per i tagli, non entrambi.');
  if(dwg) {
   await loadDWGEngine();
   if(!S.dwgAnalysis||S.dwgAnalysis.file!==dwg)throw Error('Premi prima Riconosci automaticamente la lavorazione DWG.');
   if(S.dwgAnalysis.units!==4&&!$('taDWGMM')?.checked)throw Error('Conferma i millimetri sulla scheda tecnica del produttore.');
   if(S.dwgAnalysis.autoNotch?.status!=='matched')throw Error('Il DWG non contiene una lavorazione riconoscibile con sicurezza: '+(S.dwgAnalysis.autoNotch?.reason||'nessuna corrispondenza')+'. Non sono stati generati tagli.');
   result=S.dwgAnalysis.autoNotch;
   warnings.push(result.warning);
  }
  if(dxf){const text=await dxf.text();
   result=engine.parseDxf(text,layers);
   warnings.push(result.warning,...result.ignored.slice(0,8).map(x=>'Ignorato: '+x));
  }
  if(step){model=await engine.stepToGlb(step);warnings.push(model.warning)}

  const nh=result?.cuts.holes.length||0,np=result?.cuts.cutouts.length||0;
  const message='STEP: '+(model?model.components+' componenti 3D':'non caricato')+'; '+(dwg?'DWG':dxf?'DXF':'Tagli')+': '+nh+' fori, '+np+' contorni. '+warnings.join(' | ');
  if(rep)rep.textContent=message;
  if(!confirm(message+'\n\nConfermi il salvataggio in BOZZA? Devi controllare tutte le quote e approvare manualmente prima di usare le lavorazioni.'))return;
  const store=async(ext,bytes)=>{
   const r=await fetch('/api/technical-accessories/'+id+'/files/'+ext,{method:'PUT',body:bytes,credentials:'same-origin',headers:{'Content-Type':'application/octet-stream'}});
   if(!r.ok){const error=await r.json().catch(()=>({}));throw Error('File '+ext.toUpperCase()+' non salvato: '+(error.error||r.status))}
  };
  for(const [ext,file] of [['dwg',dwg],['step',step],['dxf',dxf]])if(file)await store(ext,file);
  if(model)await store('glb',model.bytes);
  if(dwg&&result) {
    const draftDxf=window.VSDWGImport.toDxf(result.cuts);
    await store('dxf',new Blob([draftDxf],{type:'application/dxf'}));
  }
  const cutSpec=result?.cuts||structuredClone(S.cuts||{holes:[],cutouts:[],origin:[0,0]});
  if(!result)warnings.push('Nessun disegno di taglio interpretato: le lavorazioni precedenti restano invariate.');
  await request('/technical-accessories/'+id,'PATCH',{status:'draft',cut_spec:cutSpec});
  await open(id);
  if($('taAutoReport'))$('taAutoReport').textContent=message+' · BOZZA DA VERIFICARE (quote e orientamento)' ;
  notify('Importazione salvata in bozza. Verifica geometrie, origine e compatibilità prima di approvare.');
 }catch(e){notify('Importazione nel browser non completata: '+e.message);if(rep)rep.textContent=e.message}
 finally{const b=$('taAutoButton');if(b){b.disabled=false;b.textContent='Analizza e salva in bozza'}}
}
async function exportDxf(){
 try{
  if(!window.VSDWGImport?.toDxf)await new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='/dwg-browser-import.js?v=R13-dxf-arc-20261123';
   s.onload=()=>window.VSDWGImport?resolve():reject(Error('Modulo DWG non disponibile'));
   s.onerror=()=>reject(Error('Modulo DWG non raggiungibile'));document.head.append(s);
  });
  const content=window.VSDWGImport.toDxf(S.cuts);
  const name=String(S.selected?.code||'accessorio').replace(/[^a-z0-9_-]+/gi,'_')+'_lavorazioni_BOZZA.dxf';
  const url=URL.createObjectURL(new Blob([content],{type:'application/dxf'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('DXF tecnico esportato. Controlla sempre le quote prima dell’uso.');
 }catch(e){notify('DXF non generato: '+e.message)}
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
let pickerItem=null;
function renderPicker(items){
 return `<div><h3>Posiziona accessorio</h3>
 <label class="label" for="pickTech">Accessorio approvato</label>
 <select class="field" id="pickTech" onchange="VSTech.updatePicker()">${items.map(t=>`<option value="${E(t.id)}">${E(t.code)} · ${E(t.name)}</option>`).join('')}</select>
 <div class="grid2"><label>X dal bordo sinistro (mm)<input class="field" type="number" step="any" id="pickX" oninput="VSTech.previewPlacement()"></label>
 <label>Y dal bordo inferiore (mm)<input class="field" type="number" step="any" id="pickY" oninput="VSTech.previewPlacement()"></label></div>
 <label class="small" id="pickSnapLabel" hidden><input id="pickSnap" type="checkbox" onchange="VSTech.previewPlacement()"> Aggancia lo scasso al bordo sinistro</label>
 <p class="small">Clicca sulla lastra per impostare la posizione oppure inserisci le quote.</p>
 <svg id="pickDrawing" width="100%" height="260" role="img" aria-label="Anteprima 2D della lastra e delle lavorazioni" onclick="VSTech.pickPoint(event)"></svg>
 <p id="pickNotchHint" class="small" role="status" aria-live="polite"></p>
 <div class="actions"><button id="pickApply" class="btn primary" disabled onclick="VSTech.place()">Applica e mostra in 3D</button></div></div>`;
}
async function picker(beforeOpen){
 const owner=window.VSTechBridge?.selected();
 if(!owner)return notify('Seleziona prima una lastra');
 try{
  const {items}=await request('/technical-accessories');
  if(window.VSTechBridge.selected()?.id!==owner.id)return;
  const compatible=items.filter(t=>t.status==='approved'&&owner.d>=Number(t.glass_min)&&owner.d<=Number(t.glass_max));
  if(!compatible.length)return notify('Nessun accessorio approvato compatibile con lo spessore della lastra');
  if(typeof beforeOpen==='function'&&beforeOpen()===false)return;
  pickerItem=null;
  openModal(renderPicker(compatible));
  $('pickX').value=Number((owner.w/2).toFixed(3));
  $('pickY').value=Number((owner.h/2).toFixed(3));
  await updatePicker();
 }catch(e){notify(e.message)}
}
async function updatePicker(){
 const select=$('pickTech');
 const id=select?.value;
 if(!id)return;
 pickerItem=null;
 previewPlacement();
 try{
  const {item}=await request('/technical-accessories/'+encodeURIComponent(id));
  if($('pickTech')!==select||select.value!==id)return;
  pickerItem={...item,cut_spec:safeJson(item.cut_spec)};
  $('pickSnap').checked=Boolean(pickerItem.cut_spec.edgeNotch&&pickerItem.cut_spec.cutouts?.[0]?.length);
  previewPlacement();
 }catch(e){if($('pickTech')===select&&select.value===id)$('pickNotchHint').textContent=e.message}
}
function previewPlacement(){
 const owner=window.VSCADBridge.selected(),spec=pickerItem?.cut_spec,svg=$('pickDrawing');
 if(!svg)return null;
 const status=$('pickNotchHint'),apply=$('pickApply');
 apply.disabled=true;
 if(!owner){status.textContent='Seleziona una lastra';return null}
 const snap=$('pickSnap'),inputX=$('pickX');
 $('pickSnapLabel').hidden=!(spec?.edgeNotch&&spec.cutouts?.[0]?.length);
 inputX.readOnly=!$('pickSnapLabel').hidden&&snap.checked;
 if(inputX.readOnly)inputX.value=-Math.min(...spec.cutouts[0].map(p=>Number(p[0])));
 const x=inputX.valueAsNumber,y=$('pickY').valueAsNumber;
 const positioned=Number.isFinite(x)&&Number.isFinite(y);
 const result=pickerItem&&positioned?window.VSTechBridge.validate(pickerItem,x,y):null;
 const margin=Math.max(owner.w,owner.h)*.08;
 svg.setAttribute('viewBox',[-margin,-owner.h-margin,owner.w+2*margin,owner.h+2*margin].join(' '));
 const polygon=(points,fill,stroke)=>`<polygon points="${points.map(([px,py])=>[Number(px),-Number(py)].join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" vector-effect="non-scaling-stroke"/>`;
 const circle=(cx,cy,r,fill)=>`<circle cx="${cx}" cy="${-cy}" r="${r}" fill="${fill}" stroke="#334155" vector-effect="non-scaling-stroke"/>`;
 let drawing=polygon(owner.shape,'#dff4fa','#256278');
 for(const poly of owner.cutouts) drawing+=polygon(poly,'#fff','#64748b');
 for(const hole of owner.holes){
  drawing+=hole.type==='slot' ? polygon(window.VSGeometry.slotOutline(hole),'#fff','#64748b') : circle(hole.x,hole.y,hole.r,'#fff');
 }
 if(spec&&positioned){
  const fill=result?.ok?'#6ee7b7':'#fca5a5';
  for(const poly of spec.cutouts||[])drawing+=polygon(poly.map(([px,py])=>[x+Number(px),y+Number(py)]),fill,'#334155');
  for(const hole of spec.holes||[])drawing+=circle(x+Number(hole.x),y+Number(hole.y),Number(hole.r),fill);
  drawing+=circle(x,y,margin/9,'#334155');
 }
 svg.innerHTML=drawing;
 apply.disabled=!result?.ok;
 status.textContent=result?.ok?'Posizione valida.':result?.error||(spec?'Inserisci entrambe le quote.':'Caricamento scheda…');
 return result?.ok?{x,y}:null;
}
function pickPoint(event){
 const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(event.currentTarget.getScreenCTM().inverse());
 const owner=window.VSTechBridge.selected();
 if(!owner||point.x<0||point.x>owner.w||-point.y<0||-point.y>owner.h)return;
 if(!$('pickX').readOnly)$('pickX').value=point.x.toFixed(3);
 $('pickY').value=(-point.y).toFixed(3);
 previewPlacement();
}
function place(){
 const position=previewPlacement();
 if(!position)return;
 const res=window.VSTechBridge.place(pickerItem,position.x,position.y);
 if(!res.ok)return notify(res.error);
 pickerItem=null;
 closeModal();
 notify('Accessorio inserito e lavorazioni applicate al vetro');
}
window.VSTech={version:'R13-dxf-arc-20261123',library,render:refresh,open,create,save,upload,download,deleteItem,addHole,dropHole,dropCutout,movePattern,extractDXF,importPackage,autoImport,inspectDwg,downloadOriginalDxf,chooseCandidate,selectLayer,exportDxf,picker,updatePicker,previewPlacement,pickPoint,place,parseDXF};
})();
