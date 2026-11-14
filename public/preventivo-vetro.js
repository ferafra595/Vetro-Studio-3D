'use strict';
// VetroStudio — preventivi e listino della singola vetreria (D1 tramite API tenant-scoped).
const qGLASS=[['float','Float / ricotto'],['temperato','Temperato'],['stratificato','Stratificato'],['stratificato-temperato','Stratificato temperato'],['vetrocamera','Vetrocamere / isolanti'],['specchio','Specchio'],['speciale','Speciale / decorativo']];
const qQUOTE_GLASS=[['temperato','10 mm — temperato'],['stratificato','5+5 mm — stratificato']];
const qGlassLabel=i=>i.glass==='stratificato'?'5+5 mm — stratificato':i.glass==='temperato'?'10 mm — temperato':(qGLASS.find(a=>a[0]===i.glass)?.[1]||i.glass)+' '+i.thickness+' mm';
const qFIN=[['trasparente','Trasparente'],['extrachiaro','Extrachiaro'],['satinato','Satinato / acidato'],['fume','Fumé'],['bronzo','Bronzo'],['decorato','Decorato']];
const qSYSTEMS=[['lastra','Lastra su misura'],['scorrevole','Vetrata panoramica scorrevole'],['impacchettabile','Vetrata panoramica impacchettabile'],['fisso','Vetrata fissa'],['battente','Vetrata a battente']];
const qDefaults=()=>({glass:Object.fromEntries(qGLASS.map(([k])=>[k,0])),systems:Object.fromEntries(qSYSTEMS.map(([k])=>[k,0])),finishes:Object.fromEntries(qFIN.map(([k])=>[k,0])),edge:0,hole:0,cut:0,hardware:0,labour:0,installation:0,transport:0,markup:0,discount:0,vat:22,minArea:0,energy:0});
const QP={id:null,data:qDefaults(),loaded:false};
const Q={id:null,client:'',clientMode:'archive',clientFree:'',title:'Nuovo preventivo vetro',reference:'',status:'bozza',items:[],labour:0,installation:0,transport:0,markup:0,discount:0,vat:22,energy:0,notes:'',current:0,edit:null};
const qN=x=>Math.max(0,Number(String(x??'').replace(',','.'))||0),qR=x=>Math.round((x+Number.EPSILON)*100)/100;
const qEuro=x=>qN(x).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const qE= x=>esc(String(x??''));
const qField=(label,id,value,step='any')=>`<label class="qfield"><span>${label}</span><input id="${id}" type="number" min="0" step="${step}" value="${Number(value)||0}"></label>`;
const qText=(label,id,value)=>`<label class="qfield"><span>${label}</span><input id="${id}" value="${qE(value)}"></label>`;
const qSel=(label,id,value,opts)=>`<label class="qfield"><span>${label}</span><select id="${id}">${opts.map(([k,n])=>`<option value="${qE(k)}" ${String(k)===String(value)?'selected':''}>${qE(n)}</option>`).join('')}</select></label>`;
function qNew(){return {id:crypto.randomUUID(),system:'lastra',description:'Vetro su misura',width:1000,height:2000,qty:1,panels:1,direction:'destra',glass:'temperato',thickness:10,finish:'trasparente',structure:'Nero opaco',seal:'Standard',handles:'Inox satinato',edge:0,holes:0,cut:0,hardware:0,extra:0,billable:0,manual:0,notes:''}}
function qReset(){Object.assign(Q,{id:null,client:'',clientMode:'archive',clientFree:'',title:'Nuovo preventivo vetro',reference:'',status:'bozza',items:[],labour:QP.data.labour,installation:QP.data.installation,transport:QP.data.transport,markup:0,discount:QP.data.discount,vat:QP.data.vat,energy:QP.data.energy,notes:'',current:0,edit:null})}
qReset();
function qInitial(){if(!Q.items.length)Q.edit=qNew()}
function qUnit(i){
 const area=qN(i.width)*qN(i.height)/1e6;
 const bill=qN(i.billable)>0?qN(i.billable):Math.max(area,qN(QP.data.minArea));
 const p=i.priceSnapshot||QP.data;
 const m2price=qN(p.glass?.[i.glass])+qN(p.systems?.[i.system])+qN(p.finishes?.[i.finish]);
 const material=qR(bill*m2price),works=qR(qN(i.edge)*qN(p.edge)+qN(i.holes)*qN(p.hole)+qN(i.cut)*qN(p.cut)+qN(i.hardware)*qN(p.hardware)+qN(i.extra));
 const manual=qN(i.manual)>0,unit=qR(manual?qN(i.manual):material+works);
 return {area,bill,unit,material,works,manual,m2price};
}

function qCosts(){
 const goods=qR(Q.items.reduce((s,i)=>s+qUnit(i).unit*Math.max(1,Math.floor(qN(i.qty))),0));
 const labour=qR(qN(Q.labour)),installation=qR(qN(Q.installation)),transport=qR(qN(Q.transport));
 const services=qR(labour+installation+transport),base=qR(goods+services);
 const markupPercent=qN(Q.markup),markup=qR(base*markupPercent/100);
 const beforeDiscount=qR(base+markup);
 const discountPercent=Math.min(100,qN(Q.discount)),discount=qR(beforeDiscount*discountPercent/100);
 const net=qR(beforeDiscount-discount),vatPercent=qN(Q.vat),vat=qR(net*vatPercent/100);
 return {goods,labour,installation,transport,services,base,markupPercent,markup,beforeDiscount,discountPercent,discount,net,vatPercent,vat,total:qR(net+vat)};
}

function qSelected(){return Q.edit||Q.items[Q.current]||qNew()}
async function qLoadPrices(){if(QP.loaded)return;let res=await api('/catalogue');let entry=res.items.find(x=>x.kind==='__vetrostudio_quote_prices'&&x.tenant_id);if(entry){QP.id=entry.id;let m=parsed(entry.metadata,{});QP.data={...qDefaults(),...m,glass:{...qDefaults().glass,...m.glass},systems:{...qDefaults().systems,...m.systems},finishes:{...qDefaults().finishes,...m.finishes}}}QP.loaded=true}
async function glassQuote(){await qLoadPrices();let c=await api('/clients');S.clients=c.items;qInitial();return `<div class="qscreen"><div class="qhead"><div><h2>Preventivo Vetro</h2><p class="muted">Configura le lavorazioni, visualizza prospetto e pianta e prepara il documento.</p></div><div class="actions"><button class="btn" onclick="qStartNew()">Nuovo</button><button class="btn" onclick="qOpenList()">Apri</button><button class="btn" onclick="navigate('quotePrices')">⚙ Listino prezzi</button><button class="btn primary" onclick="qSave()">Salva</button><button class="btn" onclick="qPrint()">Stampa / PDF</button></div></div><div id="qWorkspace"></div></div>`}
function qItemFields(i){return `<div class="qgrid2">${qSel('Modello sistema','qi_system',i.system,qSYSTEMS)}${qText('Descrizione','qi_description',i.description)}${qField('Larghezza (mm)','qi_width',i.width,1)}${qField('Altezza (mm)','qi_height',i.height,1)}${qField('Numero ante / moduli','qi_panels',i.panels,1)}${qSel('Direzione apertura / raccolta','qi_direction',i.direction,[['destra','Destra'],['sinistra','Sinistra']])}${qField('Quantità configurazioni','qi_qty',i.qty,1)}${qSel('Tipo vetro','qi_glass',i.glass,qQUOTE_GLASS)}<div class="qfield"><span>Composizione selezionata</span><div class="qglass-caption" id="qGlassInfo">${qE(qGlassLabel(i))}</div></div>${qSel('Finitura vetro','qi_finish',i.finish,qFIN)}${qText('Colore struttura','qi_structure',i.structure)}${qText('Guarnizioni','qi_seal',i.seal)}${qText('Colore maniglie','qi_handles',i.handles)}</div><details class="qdetails"><summary>Lavorazioni e prezzi particolari</summary><div class="qgrid2">${qField('Metri molatura','qi_edge',i.edge)}${qField('Numero fori','qi_holes',i.holes,1)}${qField('Tagli / sagomature (quantità)','qi_cut',i.cut,1)}${qField('Accessori (quantità)','qi_hardware',i.hardware,1)}${qField('Altre lavorazioni (€)','qi_extra',i.extra)}${qField('Superficie fatturabile manuale (m²)','qi_billable',i.billable)}${qField('Prezzo manuale per configurazione (€; 0 = listino)','qi_manual',i.manual)}</div>${qText('Note di lavorazione','qi_notes',i.notes)}</details>`}
function qClientFields(){
 const chosen=S.clients.find(c=>c.id===Q.client);
 const name=Q.clientFree||chosen?.name||'';
 return `<div class="qclientwrap"><label class="qfield"><span>Nome cliente / Ragione sociale</span><input id="q_clientFree" list="qClientMatches" placeholder="Cerca o scrivi un nuovo cliente" value="${qE(name)}" autocomplete="off"><datalist id="qClientMatches">${S.clients.map(c=>`<option value="${qE(c.name)}"></option>`).join('')}</datalist></label><p class="small">Se il cliente esiste verrà selezionato, altrimenti verrà creato automaticamente quando salvi il preventivo.</p></div>`;
}
function qEffectiveClient(){return Q.clientFree.trim()||(S.clients.find(c=>c.id===Q.client)?.name||'Non assegnato')}

function qRender(){
 const p=$('qWorkspace');if(!p)return;
 const i=qSelected(),priceMissing=!QP.id;
 p.innerHTML=`<div class="panel qtop"><div class="qgrid3">${qText('Titolo preventivo','q_title',Q.title)}${qClientFields()}${qText('Riferimento / Cantiere','q_reference',Q.reference)}</div></div>${priceMissing?'<div class="qnotice">Listino non ancora configurato: imposta i prezzi di vetro, sistema e lavorazioni in <b>Listino prezzi</b> prima di emettere il preventivo.</div>':''}
 <div class="qlayout"><div class="panel"><div class="qflex"><h3>2. Parametri prodotto</h3><span class="small">Configurazione ${Q.current+1}</span></div>${qItemFields(i)}<div class="qflex" style="margin-top:12px"><button class="btn primary" onclick="qCommit()">${Q.edit?'＋ Aggiungi al preventivo':'✓ Aggiorna configurazione'}</button><button class="btn" onclick="qNewDraft()">Nuova configurazione</button></div></div><div class="panel"><h3>3. Anteprima prospetto e pianta (2D)</h3><div id="qDrawing"></div><p class="small">Schema di configurazione, non elaborato esecutivo.</p><div class="qbrief" id="qLive"></div></div></div>
 <section class="panel" style="margin-top:16px"><div class="qflex"><h3>4. Elementi inclusi nel preventivo</h3><span class="small">${Q.items.length} configurazioni</span></div><div class="tablewrap"><table class="qtable"><thead><tr><th>Rif.</th><th>Sistema</th><th>Dimensioni</th><th>Ante e apertura</th><th>Superficie</th><th>Prezzo cad.</th><th>Totale</th><th>Azioni</th></tr></thead><tbody>${Q.items.map((x,j)=>{const v=qUnit(x);return `<tr><td><b>${j+1}</b></td><td>${qE(qSYSTEMS.find(s=>s[0]===x.system)?.[1]||x.system)}<div class="small">${qE(qGlassLabel(x))}</div></td><td>${x.width} × ${x.height} mm</td><td>${x.panels} moduli · ${qE(x.direction)}</td><td>${v.bill.toFixed(3)} m²</td><td>${qEuro(v.unit)}</td><td>${qEuro(v.unit*x.qty)}</td><td><button class="btn" onclick="qEdit(${j})">Modifica</button> <button class="btn danger" onclick="qDelete(${j})">×</button></td></tr>`}).join('')||'<tr><td colspan="8" class="small">Nessuna configurazione aggiunta.</td></tr>'}</tbody></table></div></section>
 <div class="qlayout" style="margin-top:16px"><div class="panel"><h3>Costi aggiuntivi e condizioni</h3><div class="qgrid3">${qField('Manodopera (€)','q_labour',Q.labour)}${qField('Posa (€)','q_installation',Q.installation)}${qField('Trasporto (€)','q_transport',Q.transport)}${qField('Ricarico sui costi (%)','q_markup',Q.markup)}${qField('Sconto sul prezzo (%)','q_discount',Q.discount)}${qField('IVA (%)','q_vat',Q.vat)}</div>${qText('Note commerciali','q_notes',Q.notes)}${qSel('Stato','q_status',Q.status,[['bozza','Bozza'],['preventivo','Preventivo'],['accettato','Accettato']])}</div><div class="panel"><h3>Riepilogo economico</h3><div id="qSummary"></div><div class="qflex"><button class="btn primary" onclick="qSave()">Salva preventivo</button><button class="btn" onclick="qPrint()">Genera documento PDF</button></div></div></div>`;
 qBind();qDraw();qSummary();
}

function qCapture(){
 const i=qSelected();for(const k of Object.keys(i)){const e=$('qi_'+k);if(e)i[k]=e.type==='number'?qN(e.value):e.value}
 if(i.glass==='temperato'||i.glass==='stratificato')i.thickness=10;
 for(const k of ['title','client','clientFree','reference','labour','installation','transport','markup','discount','vat','notes','status']){const e=$('q_'+k);if(e)Q[k]=e.type==='number'?qN(e.value):e.value}
}
function qBind(){
 document.querySelectorAll('#qWorkspace input,#qWorkspace select').forEach(el=>{
  if(el.id==='q_clientFree'){el.addEventListener('input',()=>{Q.clientFree=el.value;Q.client='';});return;}
  const fn=()=>{qCapture();qDraw();qSummary();qUpdateGlassLabel()};
  el.addEventListener('input',fn);el.addEventListener('change',fn);
 });
}

function qUpdateGlassLabel(){let el=$('qGlassInfo');if(el)el.textContent=qGlassLabel(qSelected())}
function qDraw(){
  const host=$('qDrawing');if(!host)return;
  const a=qSelected(),w=Math.max(1,qN(a.width)),h=Math.max(1,qN(a.height));
  const n=Math.max(1,Math.min(20,Math.floor(qN(a.panels)||1)));
  const left=a.direction==='sinistra',dir=left?-1:1;
  const arrowAllowed=['scorrevole','impacchettabile','battente'].includes(a.system);
  const scale=Math.min(420/w,154/h),dw=w*scale,dh=h*scale,x=255-dw/2,y=45+(160-dh)/2;
  const stroke='#1e4755',glass='#c1e4eb',red='#df574d';
  const esc=qE;
  const verticals=Array.from({length:n-1},(_,j)=>`<line x1="${x+dw*(j+1)/n}" y1="${y}" x2="${x+dw*(j+1)/n}" y2="${y+dh}" stroke="#407f8b" stroke-width="1.25"/>`).join('');
  const arrowX1=left?x+dw-22:x+22,arrowX2=left?x+22:x+dw-22,ay=y+dh*.52;
  const frontArrow=arrowAllowed&&dw>64?`<line x1="${arrowX1}" y1="${ay}" x2="${arrowX2}" y2="${ay}" stroke="${red}" stroke-width="3" stroke-linecap="round" marker-end="url(#qs-arrow)"/>`:'';
  const frontLabel=arrowAllowed?`<text x="255" y="${Math.max(33,y-11)}" font-size="11" text-anchor="middle" fill="${red}" font-weight="700">APERTURA A ${left?'SINISTRA':'DESTRA'}</text>`:'';
  // Ante sovrapposte nella pianta: corsie parallele molto ravvicinate, non linee a zig-zag.
  // Ogni anta ha un tratto sovrapposto alla successiva e una quota verticale costante.
  const planY=288,step=dw/n;
  let tracks='';
  for(let j=0;j<n;j++){
    const idx=left?n-1-j:j;
    const overlap=Math.min(step*.24,16);
    const sx=Math.max(x,x+idx*step-(idx>0?overlap:0));
    const ex=Math.min(x+dw,x+(idx+1)*step+(idx<n-1?overlap:0));
    const yy=planY+7+j*3;
    tracks+=`<line x1="${sx}" y1="${yy}" x2="${ex}" y2="${yy}" stroke="${stroke}" stroke-width="2.8" stroke-linecap="round"/>`;
  }
  const planArrow=arrowAllowed?`<line x1="${left?x+dw-20:x+20}" y1="${planY-16}" x2="${left?x+20:x+dw-20}" y2="${planY-16}" stroke="${red}" stroke-width="3" marker-end="url(#qs-arrow)"/><text x="255" y="${planY+44}" text-anchor="middle" fill="${red}" font-size="10.5" font-weight="700">Apertura ${left?'a sinistra':'a destra'} · ${n} ${n===1?'anta':'ante'}</text>`:'';

  host.innerHTML=`<svg viewBox="0 0 510 345" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prospetto e pianta 2D: apertura ${left?'a sinistra':'a destra'}">
  <defs><marker id="qs-arrow" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="8" refY="5" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="${red}" stroke-width="1.8"/></marker></defs>
  <rect width="510" height="345" rx="12" fill="#f0f4f5"/>
  <text x="20" y="20" font-size="12" fill="#345968">PROSPETTO</text>
  <rect x="${x}" y="${y}" width="${dw}" height="${dh}" fill="${glass}" fill-opacity=".47" stroke="${stroke}" stroke-width="2.8"/>${verticals}${frontArrow}${frontLabel}
  <line x1="${x}" y1="${y+dh+8}" x2="${x}" y2="${y+dh+23}" stroke="#657b84"/><line x1="${x+dw}" y1="${y+dh+8}" x2="${x+dw}" y2="${y+dh+23}" stroke="#657b84"/>
  <path d="M${x} ${y+dh+17} H${x+dw}" stroke="#657b84" stroke-width="1"/><text x="255" y="${y+dh+33}" text-anchor="middle" fill="${stroke}" font-size="10.5">${w} mm</text>
  <text x="${Math.max(10,x-13)}" y="${y+dh/2}" font-size="10.5" text-anchor="middle" transform="rotate(-90 ${Math.max(10,x-13)} ${y+dh/2})" fill="${stroke}">${h} mm</text>
  <text x="20" y="256" font-size="12" fill="#345968">PIANTA — ${n} ${n===1?'anta':'ante'}</text>
  <line x1="${x}" y1="${planY}" x2="${x+dw}" y2="${planY}" stroke="#4d6570" stroke-width="3"/>${tracks}${planArrow}
  </svg>`;
  const info=$('qLive'),unit=qUnit(a);
  if(info)info.textContent=`Apertura ${left?'a sinistra':'a destra'} · ${n} ${n===1?'anta':'ante'} · ${esc(qGlassLabel(a))} · Superficie: ${unit.area.toFixed(3)} m² · Prezzo unitario: ${qEuro(unit.unit)}`;
}
function qSummary(){
 const x=$('qSummary');if(!x)return;const t=qCosts();
 const row=(name,value)=>`<div><span>${name}</span><b>${qEuro(value)}</b></div>`;
 x.innerHTML=`<div class="qtotals">${row('Prodotti',t.goods)}${t.labour?row('Manodopera',t.labour):''}${t.installation?row('Posa',t.installation):''}${t.transport?row('Trasporto',t.transport):''}${t.markupPercent?row('Ricarico ('+t.markupPercent+'%)',t.markup):''}${t.discountPercent?`<div class="qdiscount"><span>Sconto (${t.discountPercent}%)</span><b>− ${qEuro(t.discount)}</b></div>`:''}${row('Imponibile',t.net)}${row('IVA ('+t.vatPercent+'%)',t.vat)}<div class="qgrand"><span>Totale IVA inclusa</span><b>${qEuro(t.total)}</b></div></div><p class="small">Il ricarico si applica ai costi; lo sconto si applica successivamente al prezzo prima dell’IVA. Verifica il listino prima dell’invio.</p>`;
}

function qCommit(){qCapture();let a=qSelected();if(!a.width||!a.height||!a.qty||!a.panels)return toast('Misure, quantità e numero ante devono essere maggiori di zero');if(Q.edit){Q.items.push({...Q.edit,priceSnapshot:structuredClone(QP.data)});Q.current=Q.items.length-1;Q.edit=null}else Q.items[Q.current]={...a};qRender()}
function qNewDraft(){qCapture();Q.edit=qNew();qRender()}
function qEdit(j){qCapture();Q.edit=null;Q.current=j;qRender()}
function qDelete(j){qCapture();Q.items.splice(j,1);Q.current=Math.max(0,Math.min(Q.current,Q.items.length-1));Q.edit=Q.items.length?null:qNew();qRender()}
function qStartNew(){qReset();qInitial();qRender()}
function qPayload(){return {title:Q.title,client:Q.client,clientMode:Q.clientMode,clientFree:Q.clientFree,reference:Q.reference,status:Q.status,items:Q.items,labour:Q.labour,installation:Q.installation,transport:Q.transport,markup:Q.markup,discount:Q.discount,vat:Q.vat,energy:Q.energy,notes:Q.notes}}
async function qSave(){
 qCapture();if(!Q.items.length)return toast('Aggiungi almeno una configurazione');
 if(!Q.title.trim())return toast('Inserisci titolo preventivo');
 const name=qEffectiveClient().trim();if(!name||name==='Non assegnato')return toast('Inserisci il nome del cliente');
 try{
  // Resolve sul server: evita record anonimi e garantisce legame reale alla scheda cliente.
  const resolved=await api('/clients/resolve','POST',{name});Q.client=resolved.item.id;Q.clientFree=resolved.item.name;
  if(!S.clients.some(c=>c.id===resolved.item.id))S.clients.push(resolved.item);
  let body={title:Q.title,client_id:Q.client,status:Q.status,model:{type:'glass_quote',quoteData:qPayload()},quote:qCosts()};
  let r=await api('/projects'+(Q.id?'/'+Q.id:''),Q.id?'PATCH':'POST',body);Q.id=Q.id||r.id;
  toast('Preventivo salvato nella scheda di '+resolved.item.name);
 }catch(e){toast(e.message)}
}

async function qOpenList(){try{let r=await api('/projects'),entries=r.items.filter(p=>parsed(p.model,{}).type==='glass_quote');openModal(`<h3>Apri preventivo vetro</h3>${entries.map(p=>`<div class="item"><span>${qE(p.title)}</span><button class="btn" onclick="qLoad('${p.id}')">Apri</button></div>`).join('')||'Nessun preventivo salvato.'}`)}catch(e){toast(e.message)}}
async function qLoad(id){try{let r=await api('/projects/'+id),m=parsed(r.item.model,{});if(m.type!=='glass_quote')throw Error('Documento non compatibile');qReset();Object.assign(Q,m.quoteData||{});Q.items=Array.isArray(Q.items)?Q.items:[];Q.items=Q.items.map(i=>({...qNew(),...i,system:i.system||'lastra',panels:i.panels||1,billable:i.billable??i.billableSqm??0,manual:i.manual||0,edge:i.edge??i.edgeMeters??0,cut:i.cut??(i.cutting?1:0),priceSnapshot:i.priceSnapshot||QP.data}));Q.client=r.item.client_id||Q.client||'';if(!Q.clientFree&&Q.client)Q.clientFree=S.clients.find(c=>c.id===Q.client)?.name||'';Q.id=id;Q.current=0;Q.edit=Q.items.length?null:qNew();closeModal();navigate('glassQuote')}catch(e){toast(e.message)}}
async function quotePrices(){await qLoadPrices();return `<div class="qscreen"><div class="qhead"><div><h2>Listino Preventivo Vetro</h2><p class="muted">Prezzi riservati alla tua vetreria, salvati su Cloudflare D1.</p></div><div class="actions"><button class="btn" onclick="navigate('glassQuote')">← Preventivo</button><button class="btn primary" onclick="qSavePrices()">Salva prezzi</button></div></div><div id="qPriceWorkspace"></div></div>`}
function qPriceRender(){let p=$('qPriceWorkspace');if(!p)return;let d=QP.data;p.innerHTML=`<div class="qpricegrid"><section class="panel"><h3>Prezzo vetro al m²</h3><p class="small">Imposta il costo di riferimento per ogni famiglia di vetro.</p><div class="qgrid2">${qQUOTE_GLASS.map(([k,n])=>qField(n+' (€/m²)','qp_glass_'+k,d.glass[k])).join('')}</div></section><section class="panel"><h3>Sistemi e lavorazioni</h3><p class="small">Supplemento al m² per il sistema scelto; non sostituisce il costo del vetro.</p><div class="qgrid2">${qSYSTEMS.map(([k,n])=>qField(n+' (€/m²)','qp_system_'+k,d.systems[k])).join('')}${qField('Molatura (€/metro)','qp_edge',d.edge)}${qField('Foro (€/pz)','qp_hole',d.hole)}${qField('Taglio/sagomatura (€/pz)','qp_cut',d.cut)}${qField('Accessorio standard (€/pz)','qp_hardware',d.hardware)}</div></section><section class="panel"><h3>Finiture e superfici</h3><div class="qgrid2">${qFIN.map(([k,n])=>qField(n+' (+ €/m²)','qp_finish_'+k,d.finishes[k])).join('')}${qField('Superficie minima fatturabile (m²)','qp_minArea',d.minArea)}</div></section><section class="panel"><h3>Regole commerciali predefinite</h3><div class="qgrid2">${[['labour','Manodopera €'],['installation','Posa €'],['transport','Trasporto €'],['markup','Ricarico %'],['discount','Sconto %'],['vat','IVA %']].map(([k,n])=>qField(n,'qp_'+k,d[k])).join('')}</div><div class="qnotice">Nessun prezzo fittizio è stato caricato. Inserisci i tuoi valori e salva: saranno usati per i nuovi preventivi della tua vetreria.</div></section></div>`}
function qPriceCapture(){let d=QP.data;for(let [k] of qGLASS)d.glass[k]=qN($('qp_glass_'+k)?.value);for(let [k] of qSYSTEMS)d.systems[k]=qN($('qp_system_'+k)?.value);for(let [k] of qFIN)d.finishes[k]=qN($('qp_finish_'+k)?.value);for(let k of ['edge','hole','cut','hardware','minArea','labour','installation','transport','markup','discount','vat','energy'])d[k]=qN($('qp_'+k)?.value)}
async function qSavePrices(){qPriceCapture();let body={kind:'__vetrostudio_quote_prices',name:'Configurazione prezzi Preventivo Vetro',unit:'config',cost:0,price:0,metadata:QP.data};try{let r=await api('/catalogue'+(QP.id?'/'+QP.id:''),QP.id?'PATCH':'POST',body);QP.id=QP.id||r.id;toast('Listino salvato nel D1 della vetreria')}catch(e){toast('Impossibile salvare: '+e.message)}}
function qPrint(){
 qCapture();if(!Q.items.length)return toast('Aggiungi almeno una configurazione');
 const t=qCosts(),rows=Q.items.map((a,j)=>{let u=qUnit(a);return `<tr><td>${j+1}</td><td>${qE(qSYSTEMS.find(s=>s[0]===a.system)?.[1]||a.system)}<small>${qE(a.description)} · ${qE(qGlassLabel(a))} · ${qE(a.finish)}</small></td><td>${a.width} × ${a.height} mm</td><td>${a.panels} / ${qE(a.direction)}</td><td>${u.bill.toFixed(3)} m²</td><td>${a.qty}</td><td>${qEuro(u.unit*a.qty)}</td></tr>`}).join('');
 const entries=[['Prodotti',t.goods],['Manodopera',t.labour],['Posa',t.installation],['Trasporto',t.transport],['Ricarico ('+t.markupPercent+'%)',t.markup],['Sconto ('+t.discountPercent+'%)',-t.discount],['Imponibile',t.net],['IVA ('+t.vatPercent+'%)',t.vat]];
 const summary=entries.filter(([name,amount])=>amount!==0||name==='Prodotti'||name==='Imponibile'||name.startsWith('IVA')).map(([name,amount])=>`<div><span>${qE(name)}</span><b>${amount<0?'− '+qEuro(-amount):qEuro(amount)}</b></div>`).join('');
 const co=S.preferences||{},businessName=co.name||S.me.tenantName||'Vetreria';const businessAddress=[co.address,co.zip,co.city,co.province].filter(Boolean).join(', ');const businessLines=[businessAddress,co.vat?'P.IVA '+co.vat:'',co.phone,co.email,co.website,co.pec?'PEC: '+co.pec:''].filter(Boolean).map(x=>qE(x)).join(' · ');const logo=co.logo?`<img src="${co.logo}" style="max-width:140px;max-height:70px;object-fit:contain" alt="Logo">`:'';
 const doc=`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${qE(Q.title)}</title><style>body{font:13px Arial,sans-serif;color:#173443;margin:38px}header{display:flex;justify-content:space-between;border-bottom:3px solid #14747b;padding-bottom:16px}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:25px}td,th{padding:10px;border-bottom:1px solid #dbe5e8;text-align:left;vertical-align:top}th{background:#eaf3f3}small{display:block;color:#607987;margin-top:4px}.tot{margin:26px 0 0 auto;max-width:390px}.tot div{display:flex;justify-content:space-between;padding:9px;gap:20px}.grand{font-size:20px;background:#164f5c;color:#fff}button{padding:10px 18px;background:#14747b;color:#fff;border:0}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Stampa / Salva PDF</button><header><div>${logo}<h1>${qE(businessName)}</h1><small>${businessLines}</small></div><div><b>PREVENTIVO</b><div>${new Date().toLocaleDateString('it-IT')}</div></div></header><h2>${qE(Q.title)}</h2><p>Cliente: ${qE(qEffectiveClient())}<br>Riferimento: ${qE(Q.reference)}<br>Stato: ${qE(Q.status)}</p><table><thead><tr><th>Rif.</th><th>Sistema / materiale</th><th>Dimensioni</th><th>Ante / apertura</th><th>Superficie</th><th>Quantità</th><th>Totale</th></tr></thead><tbody>${rows}</tbody></table><div class="tot">${summary}<div class="grand"><b>TOTALE IVA INCLUSA</b><b>${qEuro(t.total)}</b></div></div><p>${qE(Q.notes)}</p><small>Documento commerciale indicativo. Verificare misure e condizioni prima della conferma.</small></body></html>`;
 const win=window.open('','_blank');if(!win)return toast('Consenti popup per stampare');win.document.write(doc);win.document.close();
}
