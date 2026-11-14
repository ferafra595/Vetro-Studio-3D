'use strict';
// VetroStudio — preventivi e listino della singola vetreria (D1 tramite API tenant-scoped).
const qGLASS=[['float','Float / ricotto'],['temperato','Temperato'],['stratificato','Stratificato'],['stratificato-temperato','Stratificato temperato'],['vetrocamera','Vetrocamere / isolanti'],['specchio','Specchio'],['speciale','Speciale / decorativo']];
const qQUOTE_GLASS=[['temperato','10 mm — temperato'],['stratificato','5+5 mm — stratificato']];
const qGlassLabel=i=>i.glass==='stratificato'?'5+5 mm — stratificato':i.glass==='temperato'?'10 mm — temperato':(qGLASS.find(a=>a[0]===i.glass)?.[1]||i.glass)+' '+i.thickness+' mm';
const qFIN=[['trasparente','Trasparente'],['extrachiaro','Extrachiaro'],['satinato','Satinato / acidato'],['fume','Fumé'],['bronzo','Bronzo'],['decorato','Decorato']];
const qSTRUCTURES=[['Nero opaco','Nero opaco'],['Bianco opaco RAL 9010','Bianco opaco · RAL 9010'],['Grigio antracite RAL 7016','Grigio antracite · RAL 7016'],['Grigio lucido','Grigio lucido'],['Alluminio naturale','Alluminio naturale'],['Inox satinato','Inox satinato'],['Bronzo satinato','Bronzo satinato'],['Altro / su richiesta','Altro / su richiesta']];
const qSEALS=[['Standard','Standard'],['Con pinna','Con pinna'],['Magnetica','Magnetica'],['Trasparente','Trasparente'],['Nera','Nera'],['Per scorrevole','Per scorrevole'],['Per battente','Per battente'],['Altro / su richiesta','Altro / su richiesta']];
const qHANDLES=[['Inox satinato','Inox satinato'],['Nero opaco','Nero opaco'],['Cromo lucido','Cromo lucido'],['Bianco opaco','Bianco opaco'],['Grigio antracite','Grigio antracite'],['Bronzo satinato','Bronzo satinato'],['Alluminio naturale','Alluminio naturale'],['Altro / su richiesta','Altro / su richiesta']];
const qSYSTEMS=[['lastra','Lastra su misura'],['scorrevole','Vetrata panoramica scorrevole'],['impacchettabile','Vetrata panoramica impacchettabile'],['fisso','Vetrata fissa'],['battente','Vetrata a battente'],['pieghevole','Vetrata pieghevole / a libro'],['angolare','Vetrata panoramica ad angolo']];
const qDefaults=()=>({glass:Object.fromEntries(qGLASS.map(([k])=>[k,0])),systems:Object.fromEntries(qSYSTEMS.map(([k])=>[k,0])),finishes:Object.fromEntries(qFIN.map(([k])=>[k,0])),edge:0,hole:0,cut:0,hardware:0,labour:0,installation:0,transport:0,markup:0,discount:0,vat:22,minArea:0,energy:0});
const QP={id:null,data:qDefaults(),loaded:false};
const Q={id:null,client:'',clientMode:'archive',clientFree:'',clientPhone:'',clientEmail:'',title:'Nuovo preventivo vetro',reference:'',status:'bozza',items:[],labour:0,installation:0,transport:0,markup:0,discount:0,vat:22,energy:0,notes:'',current:0,edit:null};
const qN=x=>Math.max(0,Number(String(x??'').replace(',','.'))||0),qR=x=>Math.round((x+Number.EPSILON)*100)/100;
const qEuro=x=>qN(x).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const qE= x=>esc(String(x??''));
const qField=(label,id,value,step='any')=>`<label class="qfield"><span>${label}</span><input id="${id}" type="number" min="0" step="${step}" value="${Number(value)||0}"></label>`;
const qText=(label,id,value)=>`<label class="qfield"><span>${label}</span><input id="${id}" value="${qE(value)}"></label>`;
const qSel=(label,id,value,opts)=>`<label class="qfield"><span>${label}</span><select id="${id}">${(opts.some(([k])=>String(k)===String(value))?opts:[...opts,[value,String(value)]]).map(([k,n])=>`<option value="${qE(k)}" ${String(k)===String(value)?'selected':''}>${qE(n)}</option>`).join('')}</select></label>`;
function qNew(){return {id:crypto.randomUUID(),system:'lastra',description:'Vetro su misura',width:1000,height:2000,qty:1,panels:1,direction:'destra',doorEnabled:'auto',doorSide:'auto',opening:'esterno',layout:'lineare',cornerSplit:2,cornerWidthB:1500,cornerModeA:'scorrevole',cornerModeB:'fisso',cornerDirectionA:'destra',cornerDirectionB:'destra',cornerDoor:'nessuna',glass:'temperato',thickness:10,finish:'trasparente',structure:'Nero opaco',seal:'Standard',handles:'Inox satinato',edge:0,holes:0,cut:0,hardware:0,extra:0,billable:0,manual:0,notes:''}}
function qReset(){Object.assign(Q,{id:null,client:'',clientMode:'archive',clientFree:'',clientPhone:'',clientEmail:'',title:'Nuovo preventivo vetro',reference:'',status:'bozza',items:[],labour:QP.data.labour,installation:QP.data.installation,transport:QP.data.transport,markup:0,discount:QP.data.discount,vat:QP.data.vat,energy:QP.data.energy,notes:'',current:0,edit:null})}
qReset();
function qInitial(){if(!Q.items.length)Q.edit=qNew()}
function qUnit(i){
 const area=(qN(i.width)+(i.system==='angolare'?qN(i.cornerWidthB):0))*qN(i.height)/1e6;
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
function qItemFields(i){
 const isCorner=i.system==='angolare';
 const options=[['fisso','Solo fisso'],['scorrevole','Scorrevole'],['battente','Porta battente'],['fisso_battente','Fisso + porta battente'],['fisso_scorrevole','Fisso + porta scorrevole'],['impacchettabile','Impacchettabile']];
 const cornerFields=isCorner?`<div class="qfull" style="grid-column:1/-1;padding:12px;background:#eef6f7;border:1px solid #d6e5e9;border-radius:10px"><b>Configurazione dei due lati</b><p class="small">Larghezza principale = lato A. Imposta il lato B e scegli il movimento di ciascun lato. Lo schema 2D e la superficie seguono questi valori.</p><div class="qgrid2">${qField('Larghezza lato B (mm)','qi_cornerWidthB',i.cornerWidthB||1500,1)}${qField('Moduli sul lato A','qi_cornerSplit',i.cornerSplit||2,1)}${qSel('Lato A · Sistema','qi_cornerModeA',i.cornerModeA||'scorrevole',options)}${qSel('Lato B · Sistema','qi_cornerModeB',i.cornerModeB||'fisso',options)}${qSel('Lato A · Verso','qi_cornerDirectionA',i.cornerDirectionA||'destra',[['destra','Verso destra'],['sinistra','Verso sinistra']])}${qSel('Lato B · Verso','qi_cornerDirectionB',i.cornerDirectionB||'destra',[['destra','Verso angolo / destra'],['sinistra','Verso estremità / sinistra']])}${qSel('Porta contrassegnata P','qi_cornerDoor',i.cornerDoor||'nessuna',[['nessuna','Nessuna'],['a','Sul lato A'],['b','Sul lato B']])}</div></div>`:'';
 const openingFields=(i.system==='battente'||i.system==='angolare')?qSel('Apertura porta battente','qi_opening',i.opening||'esterno',[['esterno','Verso esterno'],['interno','Verso interno']]):'';
 const doorFields=isCorner?'':`${qSel('Porta / anta principale','qi_doorEnabled',i.doorEnabled||'auto',[['auto','Automatico per modello'],['si','Presente (P)'],['no','Assente']])}${qSel('Posizione porta P','qi_doorSide',i.doorSide||'auto',[['auto','Automatica'],['sinistra','A sinistra'],['destra','A destra']])}`;
 return `<div class="qgrid2">${qSel('Modello sistema','qi_system',i.system,qSYSTEMS)}${qText('Descrizione','qi_description',i.description)}${qField(isCorner?'Larghezza lato A (mm)':'Larghezza (mm)','qi_width',i.width,1)}${qField('Altezza (mm)','qi_height',i.height,1)}${qField('Numero ante / moduli totale','qi_panels',i.panels,1)}${qSel('Direzione apertura / raccolta','qi_direction',i.direction,[['destra','Destra'],['sinistra','Sinistra']])}${doorFields}${openingFields}${cornerFields}${qField('Quantità configurazioni','qi_qty',i.qty,1)}${qSel('Tipo vetro','qi_glass',i.glass,qQUOTE_GLASS)}<div class="qfield"><span>Composizione selezionata</span><div class="qglass-caption" id="qGlassInfo">${qE(qGlassLabel(i))}</div></div>${qSel('Finitura vetro','qi_finish',i.finish,qFIN)}${qSel('Colore struttura','qi_structure',i.structure,qSTRUCTURES)}${qSel('Guarnizioni','qi_seal',i.seal,qSEALS)}${qSel('Colore maniglie','qi_handles',i.handles,qHANDLES)}</div><details class="qdetails"><summary>Lavorazioni e prezzi particolari</summary><div class="qgrid2">${qField('Metri molatura','qi_edge',i.edge)}${qField('Numero fori','qi_holes',i.holes,1)}${qField('Tagli / sagomature (quantità)','qi_cut',i.cut,1)}${qField('Accessori (quantità)','qi_hardware',i.hardware,1)}${qField('Altre lavorazioni (€)','qi_extra',i.extra)}${qField('Superficie fatturabile manuale (m²)','qi_billable',i.billable)}${qField('Prezzo manuale per configurazione (€; 0 = listino)','qi_manual',i.manual)}</div>${qText('Note di lavorazione','qi_notes',i.notes)}</details>`;
}
function qClientOption(c){const text=[c.name,c.phone?.trim()?`Tel. ${c.phone.trim()}`:'',c.email?.trim()?c.email.trim():''].filter(Boolean).join(' — ');return S.clients.filter(x=>x.id!==c.id&&x.name===c.name&&String(x.phone||'')===String(c.phone||'')&&String(x.email||'')===String(c.email||'')).length?`${text} — ID ${String(c.id).slice(0,8)}`:text}
function qClientFields(){
 const chosen=S.clients.find(c=>c.id===Q.client);
 const name=chosen?qClientOption(chosen):(Q.clientFree||'');
 return `<div class="qclientwrap"><label class="qfield"><span>Cliente / Ragione sociale</span><input id="q_clientFree" list="qClientMatches" placeholder="Cerca per nome, telefono o email" value="${qE(name)}" autocomplete="off"><datalist id="qClientMatches">${S.clients.map(c=>`<option value="${qE(qClientOption(c))}"></option>`).join('')}</datalist></label><div class="qclient-contact"><label class="qfield"><span>Telefono cliente</span><input id="q_clientPhone" type="tel" placeholder="Per distinguere clienti omonimi" value="${qE(Q.clientPhone||chosen?.phone||'')}" ${chosen?'readonly title="Modifica i dati nella scheda cliente"':''}></label><label class="qfield"><span>Email cliente</span><input id="q_clientEmail" type="email" placeholder="Facoltativa se è presente il telefono" value="${qE(Q.clientEmail||chosen?.email||'')}" ${chosen?'readonly title="Modifica i dati nella scheda cliente"':''}></label></div><p class="small">Seleziona il cliente riconoscendolo dai contatti. Se è nuovo, inserisci il nome e almeno un recapito per distinguerlo dagli omonimi.</p></div>`;
}
function qEffectiveClient(){return S.clients.find(c=>c.id===Q.client)?.name||Q.clientFree.trim()||'Non assegnato'}

function qRender(){
 const p=$('qWorkspace');if(!p)return;
 const i=qSelected(),priceMissing=!QP.id;
 p.innerHTML=`<div class="panel qtop"><div class="qgrid3">${qText('Titolo preventivo','q_title',Q.title)}${qClientFields()}${qText('Riferimento / Cantiere','q_reference',Q.reference)}</div></div>${priceMissing?'<div class="qnotice">Listino non ancora configurato: imposta i prezzi di vetro, sistema e lavorazioni in <b>Listino prezzi</b> prima di emettere il preventivo.</div>':''}
 <div class="qlayout"><div class="panel"><div class="qflex"><h3>2. Parametri prodotto</h3><span class="small">Configurazione ${Q.current+1}</span></div>${qItemFields(i)}<div class="qflex" style="margin-top:12px"><button class="btn primary" onclick="qCommit()">${Q.edit?'＋ Aggiungi al preventivo':'✓ Aggiorna configurazione'}</button><button class="btn" onclick="qNewDraft()">Nuova configurazione</button></div></div><div class="panel"><h3>3. Anteprima prospetto e pianta (2D)</h3><div id="qDrawing"></div><p class="small">Schema di configurazione, non elaborato esecutivo.</p><div class="qbrief" id="qLive"></div></div></div>
 <section class="panel" style="margin-top:16px"><div class="qflex"><h3>4. Elementi inclusi nel preventivo</h3><span class="small">${Q.items.length} configurazioni</span></div><div class="tablewrap"><table class="qtable"><thead><tr><th>Rif.</th><th>Sistema</th><th>Dimensioni</th><th>Ante e apertura</th><th>Superficie</th><th>Prezzo cad.</th><th>Totale</th><th>Azioni</th></tr></thead><tbody>${Q.items.map((x,j)=>{const v=qUnit(x);return `<tr><td><b>${j+1}</b></td><td>${qE(qSYSTEMS.find(s=>s[0]===x.system)?.[1]||x.system)}<div class="small">${qE(qGlassLabel(x))}</div></td><td>${x.system==='angolare'?`A ${x.width} / B ${x.cornerWidthB||1500}`:x.width} × ${x.height} mm</td><td>${x.panels} moduli · ${qE(x.direction)}</td><td>${v.bill.toFixed(3)} m²</td><td>${qEuro(v.unit)}</td><td>${qEuro(v.unit*x.qty)}</td><td><button class="btn" onclick="qEdit(${j})">Modifica</button> <button class="btn danger" onclick="qDelete(${j})">×</button></td></tr>`}).join('')||'<tr><td colspan="8" class="small">Nessuna configurazione aggiunta.</td></tr>'}</tbody></table></div></section>
 <div class="qlayout" style="margin-top:16px"><div class="panel"><h3>Costi aggiuntivi e condizioni</h3><div class="qgrid3">${qField('Manodopera (€)','q_labour',Q.labour)}${qField('Posa (€)','q_installation',Q.installation)}${qField('Trasporto (€)','q_transport',Q.transport)}${qField('Ricarico sui costi (%)','q_markup',Q.markup)}${qField('Sconto sul prezzo (%)','q_discount',Q.discount)}${qField('IVA (%)','q_vat',Q.vat)}</div>${qText('Note commerciali','q_notes',Q.notes)}${qSel('Stato','q_status',Q.status,[['bozza','Bozza'],['preventivo','Preventivo'],['accettato','Accettato']])}</div><div class="panel"><h3>Riepilogo economico</h3><div id="qSummary"></div><div class="qflex"><button class="btn primary" onclick="qSave()">Salva preventivo</button><button class="btn" onclick="qPrint()">Genera documento PDF</button></div></div></div>`;
 qBind();qDraw();qSummary();
}

function qCapture(){
 const i=qSelected();for(const k of Object.keys(i)){const e=$('qi_'+k);if(e)i[k]=e.type==='number'?qN(e.value):e.value}
 if(i.glass==='temperato'||i.glass==='stratificato')i.thickness=10;
 for(const k of ['title','client','clientFree','clientPhone','clientEmail','reference','labour','installation','transport','markup','discount','vat','notes','status']){const e=$('q_'+k);if(e)Q[k]=e.type==='number'?qN(e.value):(k==='clientFree'&&Q.client?(S.clients.find(c=>c.id===Q.client)?.name||e.value):e.value)}
}
function qBind(){
 document.querySelectorAll('#qWorkspace input,#qWorkspace select').forEach(el=>{
  if(el.id==='q_clientFree'){
   el.addEventListener('input',()=>{
    const selected=S.clients.find(c=>qClientOption(c)===el.value);
    if(selected){Q.client=selected.id;Q.clientFree=selected.name;Q.clientPhone=selected.phone||'';Q.clientEmail=selected.email||'';
      const tel=$('q_clientPhone'),mail=$('q_clientEmail');if(tel){tel.value=Q.clientPhone;tel.readOnly=true}if(mail){mail.value=Q.clientEmail;mail.readOnly=true}
    }else{const wasSelected=!!Q.client;Q.client='';Q.clientFree=el.value;const tel=$('q_clientPhone'),mail=$('q_clientEmail');if(wasSelected){Q.clientPhone='';Q.clientEmail='';if(tel)tel.value='';if(mail)mail.value=''}if(tel)tel.readOnly=false;if(mail)mail.readOnly=false;}
   });return;
  }
  const fn=()=>{qCapture();if(el.id==='qi_system'){qRender();return;}qDraw();qSummary();qUpdateGlassLabel()};
  el.addEventListener('input',fn);el.addEventListener('change',fn);
 });
}

function qUpdateGlassLabel(){let el=$('qGlassInfo');if(el)el.textContent=qGlassLabel(qSelected())}
// Unico schema commerciale 2D utilizzato sia per l'anteprima sia per la stampa PDF.
// Le rappresentazioni dei meccanismi sono indicative: non sostituiscono i disegni del produttore.
function qTechnicalDiagram(a, id='preview') {
 const legacy={doccia:'battente',porta_vetro:'battente'};
 const system=legacy[a.system]||a.system||'lastra';
 const kind=qSYSTEMS.some(x=>x[0]===system)?system:'lastra';
 const n=Math.max(1,Math.min(16,Math.floor(qN(a.panels)||1)));
 const w=Math.max(1,qN(a.width)),h=Math.max(1,qN(a.height)),left=a.direction==='sinistra';
 const R='#d64b42',INK='#224a5b',MID='#487d91',FILL='#d9edf3';
 const ident=String(id).replace(/[^a-zA-Z0-9_-]/g,'_');
 const fmt=v=>Math.round(v).toLocaleString('it-IT');
 const tx=(x,y,v,size=11,color=INK,anchor='middle',bold=false)=>`<text x="${x}" y="${y}" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" text-anchor="${anchor}" ${bold?'font-weight="700"':''}>${qE(v)}</text>`;
 const L=(x,y,X,Y,color=INK,stroke=2,dash='')=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" stroke="${color}" stroke-width="${stroke}" ${dash?'stroke-dasharray="'+dash+'"':''} stroke-linecap="round"/>`;
 const arrow=(x,y,X,Y)=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" stroke="${R}" stroke-width="2.7" marker-end="url(#arr_${ident})"/>`;
 const rect=(x,y,width,height,fill=FILL)=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" fill-opacity=".85" stroke="${INK}" stroke-width="2"/>`;
 const seg=(x,y,X,Y,label=null,stroke=INK,width=3)=>L(x,y,X,Y,stroke,width)+(label?tx((x+X)/2,(y+Y)/2-9,label,10):'');
 const dLeft=a.doorSide==='sinistra'||(a.doorSide!=='destra'&&!left);
 const hasDoor=(kind==='impacchettabile'||kind==='pieghevole'||kind==='battente')?a.doorEnabled!=='no':a.doorEnabled==='si';
 const doorIndex=dLeft?0:n-1;
 const labelFor=i=>hasDoor&&i===doorIndex?'P':String(i+1-(hasDoor&&i>doorIndex?1:0));
 const out=[];
 out.push(`<defs><marker id="arr_${ident}" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="none" stroke="${R}" stroke-width="1.5"/></marker></defs>`);
 out.push(tx(22,25,'PROSPETTO · VETRATA CHIUSA',12,INK,'start',true));
 const fx=80,fy=48,fw=400,fh=137, yPlan=267;
 if(kind==='angolare'){
   const split=Math.max(1,Math.min(n-1,Math.floor(qN(a.cornerSplit)||Math.ceil(n/2))));
   const nb=n-split, widthB=Math.max(1,qN(a.cornerWidthB)||1500), full=w+widthB;
   const aPx=fw*w/full,bPx=fw*widthB/full;
   const modeA=a.cornerModeA||'scorrevole',modeB=a.cornerModeB||'fisso';
   const doorSide=a.cornerDoor||'nessuna';
   out.push(rect(fx,fy,aPx,fh),rect(fx+aPx,fy,bPx,fh));
   for(let k=0;k<split;k++){
     if(k)out.push(L(fx+aPx*k/split,fy,fx+aPx*k/split,fy+fh,MID,1.2));
     out.push(tx(fx+aPx*(k+.5)/split,fy+fh/2+4,doorSide==='a'&&k===0?'P':`A${k+1}`,11,INK,'middle',true));
   }
   for(let k=0;k<nb;k++){
     if(k)out.push(L(fx+aPx+bPx*k/nb,fy,fx+aPx+bPx*k/nb,fy+fh,MID,1.2));
     out.push(tx(fx+aPx+bPx*(k+.5)/nb,fy+fh/2+4,doorSide==='b'&&k===0?'P':`B${k+1}`,11,INK,'middle',true));
   }
   out.push(L(fx+aPx,fy-9,fx+aPx,fy+fh+9,R,1.8,'5 4'));
   out.push(tx(fx+aPx/2,fy-10,`LATO A · ${fmt(w)} mm`,10),tx(fx+aPx+bPx/2,fy-10,`LATO B · ${fmt(widthB)} mm`,10));
   out.push(tx(48,fy+fh/2,`${fmt(h)} mm`,10));
   out.push(tx(22,228,'PIANTA · DUE LATI INDIPENDENTI',12,INK,'start',true));
   const ox=175,oy=333,AH=235,BH=100;
   out.push(seg(ox,oy,ox+AH,oy,null,INK,3),seg(ox+AH,oy,ox+AH,oy-BH,null,INK,3));
   for(let i=0;i<split;i++){
     const x=ox+AH*(i+.5)/split;
     out.push(tx(x,oy-9,doorSide==='a'&&i===0?'P':`A${i+1}`,10,INK,'middle',true));
     if(i)out.push(L(ox+AH*i/split,oy-7,ox+AH*i/split,oy+7,MID,1));
   }
   for(let i=0;i<nb;i++){
     const y=oy-BH*(i+.5)/nb;
     out.push(tx(ox+AH+16,y+3,doorSide==='b'&&i===0?'P':`B${i+1}`,10,INK,'start',true));
     if(i)out.push(L(ox+AH-6,oy-BH*i/nb,ox+AH+6,oy-BH*i/nb,MID,1));
   }
   const sideDraw=(mode,side,dir,door)=>{
     const x0=side==='a'?ox:ox+AH,y0=oy,dx=side==='a'?AH:0,dy=side==='a'?0:-BH;
     const fixed=mode==='fisso';
     if(fixed){out.push(tx(side==='a'?ox+AH/2:ox+AH+56,side==='a'?oy+37:oy-BH/2,'FISSO',10));return;}
     const sliding=mode==='scorrevole'||mode==='fisso_scorrevole';
     const swinging=mode==='battente'||mode==='fisso_battente';
     const fold=mode==='impacchettabile';
     if(sliding){
       if(side==='a'){
         out.push(L(ox+12,oy+11,ox+AH-12,oy+11,MID,2));
         out.push(L(ox+12,oy+17,ox+AH-12,oy+17,MID,2));
         out.push(arrow(dir==='sinistra'?ox+AH-35:ox+35,oy+31,dir==='sinistra'?ox+32:ox+AH-32,oy+31));
       }else{
         out.push(L(ox+AH-11,oy-12,ox+AH-11,oy-BH+12,MID,2));
         out.push(L(ox+AH-17,oy-12,ox+AH-17,oy-BH+12,MID,2));
         out.push(arrow(ox+AH-34,dir==='sinistra'?oy-BH+18:oy-18,ox+AH-34,dir==='sinistra'?oy-18:oy-BH+18));
       }
     }else if(swinging){
       const radius=side==='a'?48:43;
       if(side==='a'){
         const hx=door?ox+8:ox+AH-8,hy=oy;
         const sign=door?-1:1;
         out.push(L(hx,hy,hx+sign*radius,hy+(a.opening==='interno'?-radius:radius),R,2));
         out.push(`<path d="M ${hx+sign*radius} ${hy} A ${radius} ${radius} 0 0 ${door?0:1} ${hx} ${hy+(a.opening==='interno'?-radius:radius)}" stroke="${R}" fill="none" stroke-width="1.5" stroke-dasharray="4 3"/>`);
       }else{
         const hy=door?oy-12:oy-BH+12,hx=ox+AH;
         out.push(L(hx,hy,hx+(a.opening==='interno'?-radius:radius),hy-36,R,2));
         out.push(`<path d="M${hx} ${hy-36} Q${hx+radius*.7} ${hy-36} ${hx+radius} ${hy}" fill="none" stroke="${R}" stroke-width="1.5" stroke-dasharray="4 3"/>`);
       }
     }else if(fold){
       const x=side==='a'?ox+AH-50:ox+AH+11,y=side==='a'?oy+16:oy-22;
       out.push(L(x,y,x+19,y-18,R,2),L(x+19,y-18,x+38,y,R,2));
       out.push(tx(x+16,y+34,'LIBRO',9,R));
     }
     out.push(tx(side==='a'?ox+AH/2:ox+AH+61,side==='a'?oy+55:oy-BH/2+26,`${side.toUpperCase()}: ${mode.replaceAll('_',' + ')}`,9,R));
   };
   sideDraw(modeA,'a',a.cornerDirectionA||a.direction||'destra',doorSide==='a');
   sideDraw(modeB,'b',a.cornerDirectionB||a.direction||'destra',doorSide==='b');
   out.push(tx(280,432,`Angolare · Lato A ${split} moduli · Lato B ${nb} moduli · P = porta (se presente)`,10));
 }else{
   out.push(rect(fx,fy,fw,fh));
   for(let i=0;i<n;i++){
     const x=fx+fw*(i+.5)/n;
     if(i)out.push(L(fx+fw*i/n,fy,fx+fw*i/n,fy+fh,MID,1.2));
     out.push(tx(x,fy+fh/2+4,labelFor(i),Math.min(15,fw/n*.38),INK,'middle',true));
   }
   out.push(L(fx,fy+fh+12,fx+fw,fy+fh+12,'#7f9aa6',1),L(fx,fy+fh+6,fx,fy+fh+18,'#7f9aa6',1),L(fx+fw,fy+fh+6,fx+fw,fy+fh+18,'#7f9aa6',1));
   out.push(tx(fx+fw/2,fy+fh+29,`${fmt(w)} mm`,10),tx(47,fy+fh/2,`${fmt(h)} mm`,10));
   out.push(tx(22,233,'PIANTA · MECCANISMO DI APERTURA',12,INK,'start',true));
   const px=91,ww=380,by=278,unit=ww/n;
   if(kind==='lastra'||kind==='fisso'){
     out.push(seg(px,by,px+ww,by));
     out.push(tx(280,355,'Vetrata fissa · nessun movimento',11));
   }else if(kind==='battente'){
     // Ante incernierate: ogni modulo ha un suo perno; il disegno non è una traslazione.
     out.push(tx(281,fy-12,`APERTURA BATTENTE ${a.opening==='interno'?'INTERNA':'ESTERNA'}`,11,R,'middle',true));
     const single=n===1;
     for(let i=0;i<n;i++){
       const sx=px+i*unit,ex=sx+unit;
       out.push(seg(sx,by,ex,by));
       const hingeLeft=(n===2?i===0:((i%2)===0));
       const hinge=hingeLeft?sx:ex,reach=Math.min(unit*.8,87);
       const direction=hingeLeft?1:-1;
       const y=by+(a.opening==='interno'?-reach:reach);
       out.push(`<circle cx="${hinge}" cy="${by}" r="4" fill="${INK}"/>`);
       out.push(L(hinge,by,hinge,y,R,2.5));
       const arcTo=hinge+direction*reach;
       out.push(`<path d="M${arcTo} ${by} A${reach} ${reach} 0 0 ${hingeLeft?0:1} ${hinge} ${y}" fill="none" stroke="${R}" stroke-width="1.7" stroke-dasharray="5 4"/>`);
       out.push(tx(sx+unit*.5,by-11,labelFor(i),10));
     }
     out.push(tx(281,424,`Porta battente · ${n} ${n===1?'anta':'ante'} · apertura verso ${a.opening==='interno'?'interno':'esterno'} · cerchio = cerniera`,10));
   }else if(kind==='pieghevole'){
     // Due stati: chiuso allineato; aperto a zig-zag nello spazio di raccolta.
     out.push(tx(281,fy-12,`RACCOLTA A ${left?'SINISTRA':'DESTRA'} · A LIBRO`,11,R,'middle',true));
     out.push(seg(px,by,px+ww,by));
     for(let i=1;i<n;i++)out.push(L(px+i*unit,by-6,px+i*unit,by+6,MID,1.2));
     out.push(arrow(left?px+ww-25:px+25,by-24,left?px+27:px+ww-27,by-24));
     const target=left?px+35:px+ww-35,sign=left?1:-1;
     let previous=[target,by+33];
     const dx=24,dy=27;
     for(let i=0;i<n;i++){
       const next=[target+sign*(i+1)*dx,by+33+(i%2===0?dy:0)];
       out.push(L(previous[0],previous[1],next[0],next[1],R,2.8));
       out.push(`<circle cx="${next[0]}" cy="${next[1]}" r="2.5" fill="${INK}"/>`);
       out.push(tx((previous[0]+next[0])/2,(previous[1]+next[1])/2-8,labelFor(i),9));
       previous=next;
     }
     out.push(tx(280,399,`Schema APERTO: ante piegate a fisarmonica verso ${left?'sinistra':'destra'}`,10,R));
     out.push(tx(280,423,`Schema CHIUSO: linea orizzontale · P = anta principale se prevista`,10));
   }else if(kind==='impacchettabile'){
     out.push(seg(px,by,px+ww,by));
     for(let i=1;i<n;i++)out.push(L(px+i*unit,by-5,px+i*unit,by+5,MID,1));
     out.push(arrow(left?px+ww-20:px+20,by-28,left?px+20:px+ww-20,by-28));
     const bx=left?px+12:px+ww-12;
     for(let i=0;i<n;i++)out.push(seg(bx-7+i*2,by+25,bx-7+i*2,by+83,labelFor(i),i%2?MID:R,2.1));
     out.push(tx(282,415,`Impacchettabile · raccolta ${left?'sinistra':'destra'} · P = porta`,10));
   }else if(kind==='scorrevole'){
     for(let i=0;i<n;i++){
       const bx=px+i*unit,yy=by+(i%Math.min(n,3))*7;
       out.push(seg(bx,yy,bx+unit+8,yy,labelFor(i),INK,2.2));
     }
     out.push(arrow(left?px+ww-20:px+20,by-27,left?px+20:px+ww-20,by-27));
     out.push(tx(280,413,`Scorrevole · ${n} moduli · movimento ${left?'sinistra':'destra'}`,10));
   }
 }
 if(kind!=='angolare')out.push(tx(280,446,`P = porta, numeri = altre lastre · Rosso = movimento · Schema indicativo`,9,'#537582'));
 return `<svg class="q-technical-svg drawing-svg" viewBox="0 0 560 465" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schema ${qE(kind)}, prospetto e pianta con ${n} moduli"><rect width="560" height="465" rx="10" fill="#f0f5f6"/>${out.join('')}</svg>`;
}

function qDraw(){
 const host=$('qDrawing');if(!host)return;
 const a=qSelected();host.innerHTML=qTechnicalDiagram(a,'interactive');
 const info=$('qLive'),n=Math.max(1,Math.floor(qN(a.panels)||1)),unit=qUnit(a);
 if(info)info.textContent=`${qSYSTEMS.find(v=>v[0]===a.system)?.[1]||a.system} · ${n} ${n===1?'modulo':'moduli'} · ${a.direction} · ${qGlassLabel(a)} · Superficie: ${unit.area.toFixed(3)} m² · Prezzo unitario: ${qEuro(unit.unit)}`;
}

function qSummary(){
 const x=$('qSummary');if(!x)return;const t=qCosts();
 const row=(name,value)=>`<div><span>${name}</span><b>${qEuro(value)}</b></div>`;
 x.innerHTML=`<div class="qtotals">${row('Prodotti',t.goods)}${t.labour?row('Manodopera',t.labour):''}${t.installation?row('Posa',t.installation):''}${t.transport?row('Trasporto',t.transport):''}${t.markupPercent?row('Ricarico ('+t.markupPercent+'%)',t.markup):''}${t.discountPercent?`<div class="qdiscount"><span>Sconto (${t.discountPercent}%)</span><b>− ${qEuro(t.discount)}</b></div>`:''}${row('Imponibile',t.net)}${row('IVA ('+t.vatPercent+'%)',t.vat)}<div class="qgrand"><span>Totale IVA inclusa</span><b>${qEuro(t.total)}</b></div></div><p class="small">Il ricarico si applica ai costi; lo sconto si applica successivamente al prezzo prima dell’IVA. Verifica il listino prima dell’invio.</p>`;
}

function qCommit(){qCapture();let a=qSelected();if(!a.width||!a.height||!a.qty||!a.panels)return toast('Misure, quantità e numero ante devono essere maggiori di zero');if(a.system==='angolare'&&(qN(a.panels)<2||qN(a.cornerSplit)<1||qN(a.cornerSplit)>=qN(a.panels)||qN(a.cornerWidthB)<=0))return toast('Per la vetrata ad angolo servono almeno 2 moduli, almeno 1 per lato e una larghezza valida del lato B');if(Q.edit){Q.items.push({...Q.edit,priceSnapshot:structuredClone(QP.data)});Q.current=Q.items.length-1;Q.edit=null}else Q.items[Q.current]={...a};qRender()}
function qNewDraft(){qCapture();Q.edit=qNew();qRender()}
function qEdit(j){qCapture();Q.edit=null;Q.current=j;qRender()}
function qDelete(j){qCapture();Q.items.splice(j,1);Q.current=Math.max(0,Math.min(Q.current,Q.items.length-1));Q.edit=Q.items.length?null:qNew();qRender()}
function qStartNew(){qReset();qInitial();qRender()}
function qPayload(){return {title:Q.title,client:Q.client,clientMode:Q.clientMode,clientFree:Q.clientFree,clientPhone:Q.clientPhone,clientEmail:Q.clientEmail,reference:Q.reference,status:Q.status,items:Q.items,labour:Q.labour,installation:Q.installation,transport:Q.transport,markup:Q.markup,discount:Q.discount,vat:Q.vat,energy:Q.energy,notes:Q.notes}}
async function qSave(){
 qCapture();if(!Q.items.length)return toast('Aggiungi almeno una configurazione');
 if(!Q.title.trim())return toast('Inserisci titolo preventivo');
 const name=qEffectiveClient().trim();if(!name||name==='Non assegnato')return toast('Inserisci il nome del cliente');
 try{
  // Resolve sul server: evita record anonimi e garantisce legame reale alla scheda cliente.
  const resolved=await api('/clients/resolve','POST',Q.client?{id:Q.client}:{name,phone:Q.clientPhone,email:Q.clientEmail});Q.client=resolved.item.id;Q.clientFree=resolved.item.name;Q.clientPhone=resolved.item.phone||'';Q.clientEmail=resolved.item.email||'';
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
// Schema 2D di stampa coerente con le misure, il numero di ante e la direzione del preventivo.
// Le viste sono indicative: non rappresentano specifiche costruttive di produttori.
function qPrintDiagram(a,idx){return qTechnicalDiagram(a,'print_'+idx)}

function qPrint(){
 qCapture();if(!Q.items.length)return toast('Aggiungi almeno una configurazione');
 const t=qCosts(),co=S.preferences||{},businessName=co.name||S.me.tenantName||'Vetreria';
 const client=S.clients.find(c=>c.id===Q.client);
 const clientName=qEffectiveClient();
 const clientInfo=[Q.clientPhone||client?.phone,Q.clientEmail||client?.email,client?.address].filter(Boolean).join(' · ');
 const addr=[co.address,[co.zip,co.city,co.province].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
 const contacts=[co.phone,co.email,co.website].filter(Boolean).join('  |  ');
 const tax=[co.vat?'P.IVA '+co.vat:'',co.pec?'PEC '+co.pec:'',co.sdi?'SDI '+co.sdi:''].filter(Boolean).join('  ·  ');
 const logoSource=co.logoQuote??co.logo??'';
 const logo=logoSource?`<img class="logo" src="${logoSource}" alt="Logo della vetreria">`:'';
 const rows=Q.items.map((a,j)=>{const u=qUnit(a);return `<tr><td class="seq">${String(j+1).padStart(2,'0')}</td><td><strong>${qE(qSYSTEMS.find(x=>x[0]===a.system)?.[1]||a.system)}</strong><span class="sub">${qE(a.description||'')} · ${qE(qGlassLabel(a))} · ${qE(qFIN.find(x=>x[0]===a.finish)?.[1]||a.finish)}</span><span class="sub">Struttura: ${qE(a.structure)} · Guarnizioni: ${qE(a.seal)} · Maniglie: ${qE(a.handles)}</span></td><td class="nowrap">${a.system==='angolare'?`A ${Number(a.width).toLocaleString('it-IT')} / B ${Number(a.cornerWidthB||1500).toLocaleString('it-IT')}`:Number(a.width).toLocaleString('it-IT')} × ${Number(a.height).toLocaleString('it-IT')} mm</td><td class="center">${a.panels} / ${qE(a.direction)}</td><td class="right">${u.bill.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:3})} m²</td><td class="center">${a.qty}</td><td class="right money">${qEuro(u.unit*a.qty)}</td></tr>`}).join('');
 const diagrams=Q.items.map((a,j)=>`<article class="drawing-card"><div class="drawing-caption"><strong>Configurazione ${String(j+1).padStart(2,'0')} · ${qE(qSYSTEMS.find(v=>v[0]===a.system)?.[1]||a.system)}</strong><span>${a.system==='angolare'?`A ${qE(a.width)} + B ${qE(a.cornerWidthB||1500)}`:qE(a.width)} × ${qE(a.height)} mm · ${Math.max(1,Math.floor(qN(a.panels)||1))} moduli</span></div>${qPrintDiagram(a,j)}<p class="drawing-note">Schema funzionale indicativo: movimento e numerazione da verificare con il sistema scelto; non è un disegno esecutivo.</p></article>`).join('');
 const line=(label,amount,cls='')=>`<div class="amount-row ${cls}"><span>${label}</span><strong>${amount<0?'− '+qEuro(-amount):qEuro(amount)}</strong></div>`;
 const sums=[line('Prodotti',t.goods),t.labour?line('Manodopera',t.labour):'',t.installation?line('Posa',t.installation):'',t.transport?line('Trasporto',t.transport):'',t.markupPercent?line('Ricarico ('+t.markupPercent+'%)',t.markup):'',t.discountPercent?line('Sconto ('+t.discountPercent+'%)',-t.discount,'discount'):'',line('Imponibile',t.net,'net'),line('IVA ('+t.vatPercent+'%)',t.vat)].join('');
 const d=new Date().toLocaleDateString('it-IT');
 const doc=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${qE(Q.title)}</title><style>
 @page{size:A4 portrait;margin:16mm 15mm 18mm 15mm}
 *,*::before,*::after{box-sizing:border-box}
 html,body{margin:0;padding:0;width:100%;max-width:100%;overflow:visible}
 body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.42;color:#193746;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .sheet{width:100%;max-width:180mm;margin:0 auto;min-width:0}
 .printaction{background:#176c73;border:0;color:white;font-weight:700;border-radius:6px;padding:11px 17px;margin:0 0 22px;cursor:pointer}
 .header{display:grid;grid-template-columns:minmax(0,1fr) 31mm;gap:7mm;align-items:start;border-bottom:1.5pt solid #176c73;padding-bottom:5mm}
 .identity{min-width:0}.logo{display:block;max-width:63mm;max-height:20mm;width:auto;height:auto;object-fit:contain;object-position:left;margin-bottom:2mm}
 .identity h1{font-size:16pt;line-height:1.2;margin:0 0 2mm;overflow-wrap:anywhere}.identity p{font-size:8pt;color:#445d69;margin:1mm 0;overflow-wrap:anywhere}
 .docmeta{text-align:right;min-width:0;font-size:8pt}.docmeta strong{font-size:10pt;letter-spacing:.3pt;display:block}.docmeta .date{margin-top:2mm}
 .intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,66mm);gap:6mm;align-items:start;margin:7mm 0 6mm}
 .intro h2{font-size:15pt;line-height:1.2;overflow-wrap:anywhere;margin:1.5mm 0}.intro p{font-size:8.5pt;color:#617988;margin:0;overflow-wrap:anywhere}
 .eyebrow{font-size:7pt;text-transform:uppercase;letter-spacing:.6pt;color:#577483}
 .client{min-width:0;border:1px solid #d5e2e6;border-radius:5px;background:#f5fafb;padding:3mm}.client b{display:block;font-size:9pt;overflow-wrap:anywhere}.client p{font-size:8pt;margin-top:1mm}
 .section-title{font-size:11pt;margin:0 0 3mm;break-after:avoid;page-break-after:avoid}
 table{border-collapse:collapse;width:100%;table-layout:fixed}thead{display:table-header-group}tr{page-break-inside:avoid;break-inside:avoid}
 th{font-size:7.1pt;font-weight:700;text-align:left;color:#214553;background:#eaf3f4;padding:2.2mm 1.3mm;border-bottom:1px solid #c8dadd}
 td{font-size:7.3pt;line-height:1.4;vertical-align:top;padding:2.8mm 1.3mm;border-bottom:1px solid #dce7e9;overflow-wrap:anywhere;word-break:normal}
 .seq{color:#587584;font-weight:700}.sub{display:block;color:#506d7b;font-size:6.9pt;margin-top:1mm;overflow-wrap:anywhere}.right{text-align:right}.center{text-align:center}.money{font-weight:700}
 .nowrap{white-space:normal}.bottom{display:flex;justify-content:flex-end;margin:6mm 0 7mm;break-inside:avoid;page-break-inside:avoid}
 .totals{width:78mm;max-width:100%;min-width:0}.amount-row{display:flex;justify-content:space-between;gap:4mm;border-bottom:1px solid #e0e9ec;font-size:8.5pt;padding:2mm 0}.amount-row strong{white-space:nowrap}.discount{color:#a43737}.net{font-weight:700;border-top:1px solid #adc6cf}
 .grand{display:flex;align-items:center;justify-content:space-between;gap:3mm;margin-top:2mm;border:1.5px solid #176c73;border-radius:3px;padding:3mm 2.5mm;font-size:11pt;font-weight:800}.grand strong{white-space:nowrap;font-size:11pt}
 .drawings{margin:0;break-before:page;page-break-before:always}.drawings h3{font-size:11pt;margin:0 0 3mm}.drawing-card{display:block;width:100%;border:1px solid #d4e4e8;border-radius:5px;padding:3mm;margin:0 0 4mm;break-inside:avoid;page-break-inside:avoid}
 .drawing-caption{display:flex;justify-content:space-between;gap:3mm;align-items:start;font-size:8pt;flex-wrap:wrap}.drawing-caption span{color:#5a7581}.drawing-svg{display:block;width:100%;max-width:150mm;height:auto;max-height:112mm;margin:2mm auto}.drawing-note{font-size:7pt;color:#5b7480;margin:1mm 0 0}
 .notes{margin:6mm 0;break-inside:avoid}.notes h3{font-size:9pt;margin:0 0 2mm}.notes p{font-size:8pt;color:#536d7b;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}
 .footer{margin-top:8mm;padding-top:3mm;border-top:1px solid #d8e4e7;display:flex;justify-content:space-between;gap:5mm;font-size:7pt;color:#577181;break-inside:avoid}
 @media screen{body{background:#f0f3f5;padding:20px}.sheet{background:#fff;max-width:210mm;padding:16mm 15mm;box-shadow:0 6px 25px #0002}}
 @media print{.printaction{display:none!important}.sheet{width:100%;max-width:none;margin:0;padding:0;box-shadow:none}.drawings{break-inside:auto}.drawing-card{border-color:#c2d9df}}
 </style></head><body><div class="sheet"><button class="printaction" onclick="window.print()">Stampa / Salva PDF</button>
 <header class="header"><div class="identity">${logo}<h1>${qE(businessName)}</h1>${addr?`<p>${qE(addr)}</p>`:''}${contacts?`<p>${qE(contacts)}</p>`:''}${tax?`<p>${qE(tax)}</p>`:''}</div><div class="docmeta"><strong>PREVENTIVO</strong><div class="date">${d}</div><div class="date">${qE(Q.status).toUpperCase()}</div></div></header>
 <div class="intro"><div><div class="eyebrow">Offerta commerciale</div><h2>${qE(Q.title)}</h2>${Q.reference?`<p>Riferimento: ${qE(Q.reference)}</p>`:''}</div><div class="client"><div class="eyebrow">Destinatario</div><b>${qE(clientName)}</b>${clientInfo?`<p>${qE(clientInfo)}</p>`:''}</div></div>
 <h3 class="section-title">Dettaglio delle lavorazioni</h3><table><colgroup><col style="width:5%"><col style="width:30%"><col style="width:17%"><col style="width:12%"><col style="width:11%"><col style="width:7%"><col style="width:18%"></colgroup><thead><tr><th>Rif.</th><th>Sistema e materiali</th><th>Dimensioni</th><th>Ante</th><th>Superficie</th><th>Qtà</th><th class="right">Importo</th></tr></thead><tbody>${rows}</tbody></table>
 <div class="bottom"><div class="totals">${sums}<div class="grand"><span>Totale IVA inclusa</span><strong>${qEuro(t.total)}</strong></div></div></div>
 <section class="drawings"><h3>Allegato tecnico — Configurazioni 2D</h3>${diagrams}</section>
 ${Q.notes?.trim()?`<section class="notes"><h3>Note e condizioni</h3><p>${qE(Q.notes)}</p></section>`:''}
 <footer class="footer"><span>Documento commerciale indicativo. Verificare misure, materiali e condizioni prima della conferma.</span><span>${qE(businessName)}</span></footer></div></body></html>`;
 const win=window.open('','_blank');if(!win)return toast('Consenti i popup per visualizzare il preventivo');win.document.write(doc);win.document.close();
}
