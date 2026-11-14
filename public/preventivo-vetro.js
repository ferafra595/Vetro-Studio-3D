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
 <div class="qlayout"><div class="panel"><div class="qflex"><h3>2. Parametri prodotto</h3><span class="small">Configurazione ${Q.current+1}</span></div>${qItemFields(i)}<div class="qflex" style="margin-top:12px"><button class="btn primary" onclick="qCommit()">${Q.edit?'＋ Aggiungi al preventivo':'✓ Aggiorna configurazione'}</button><button class="btn" onclick="qNewDraft()">Nuova configurazione</button></div></div><div class="panel"><h3>3. Prospetto e pianta (2D) <span style="font-size:11px;color:#176c73">· R2</span></h3><div id="qDrawing"></div><p class="small">Schema funzionale per sistema, aggiornato con direzione e numero moduli; non elaborato esecutivo.</p><div class="qbrief" id="qLive"></div></div></div>
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
// REVISIONE SCHEMI 2D R2 — prospetti e piante specifici per sistema.
// Unico SVG usato da anteprima e documento stampato. Misure di riferimento in mm.
const Q_DIAGRAM_REV='R2 · 14/11/2026';
function qTechnicalDiagram(a, id='preview'){
 const system=a.system||'lastra';
 const n=Math.max(1,Math.min(16,Math.round(qN(a.panels)||1)));
 const w=Math.max(1,qN(a.width)), h=Math.max(1,qN(a.height));
 const left=a.direction==='sinistra', outward=a.opening!=='interno';
 const cobalt='#22566b', subtle='#6594a5', red='#cc453e', fill='#d9eef4', light='#f0f6f8';
 const unique='q'+String(id).replace(/[^a-zA-Z0-9_]/g,'_');
 const escape=t=>qE(String(t));
 const el=[];
 const push=t=>el.push(t);
 const txt=(x,y,t,size=11,color=cobalt,anchor='middle',weight=400)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escape(t)}</text>`;
 const ln=(x,y,X,Y,col=cobalt,sw=2,dash='')=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const box=(x,y,ww,hh,col=fill)=>`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${col}" stroke="${cobalt}" stroke-width="2"/>`;
 const dot=(x,y,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${red}" stroke="white" stroke-width="1.2"/>`;
 const arrow=(x,y,X,Y)=>ln(x,y,X,Y,red,2.7)+`<path d="M ${X} ${Y} l ${x===X?'-6 -9':'-10 -6'} m ${x===X?'12 0':'0 12'}" fill="none"/>`;
 const arr=(x,y,X,Y)=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" stroke="${red}" stroke-width="2.7" marker-end="url(#${unique})"/>`;
 const fmt=v=>Math.round(v).toLocaleString('it-IT');
 const dimension=(x1,y1,x2,y2,v)=>ln(x1,y1,x2,y2,subtle,1)+txt((x1+x2)/2,(y1+y2)/2-5,`${fmt(v)} mm`,10);
 const rawDoor=a.doorSide==='sinistra'?'sinistra':a.doorSide==='destra'?'destra':(left?'destra':'sinistra');
 const hasDoor=(system==='battente'||system==='pieghevole'||system==='impacchettabile')?a.doorEnabled!=='no':a.doorEnabled==='si';
 const labels=(count,doorSide=rawDoor,door=hasDoor)=>{
   const idx=doorSide==='sinistra'?0:count-1;let k=0;
   return Array.from({length:count},(_,i)=>door&&i===idx?'P':String(++k));
 };
 const eleLabel=(x,y,t)=>txt(x,y,t,11,cobalt,'middle',700);
 const elevation=(x,y,ww,hh,count,lab,door=false,doorSide=rawDoor)=>{
   push(txt(x,y-12,lab,10,cobalt,'start',700));
   push(box(x,y,ww,hh));const names=labels(count,doorSide,door);
   for(let j=0;j<count;j++){
     if(j)push(ln(x+ww*j/count,y,x+ww*j/count,y+hh,subtle,1.3));
     const cx=x+ww*(j+.5)/count;
     push(eleLabel(cx,y+hh/2+4,names[j]));
   }
   return names;
 };
 // Perno e arco di rotazione per apertura battente. La vista indica il verso, non dimensioni della ferramenta.
 const swing=(hingeX,hingeY,r,side,external)=>{
   const x2=hingeX+(side==='destra'?-r:r), signY=external?1:-1;
   const endY=hingeY+signY*r;
   push(dot(hingeX,hingeY,4));
   push(ln(hingeX,hingeY,hingeX,endY,red,3));
   const sweep=((side==='destra') !== external)?1:0;
   push(`<path d="M ${x2} ${hingeY} A ${r} ${r} 0 0 ${sweep} ${hingeX} ${endY}" fill="none" stroke="${red}" stroke-width="1.8" stroke-dasharray="5 4"/>`);
   push(txt(hingeX+(side==='destra'?-r*.45:r*.45),hingeY+signY*(r+17),external?'ESTERNO':'INTERNO',9,red));
 };
 push(`<defs><marker id="${unique}" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="${red}"/></marker></defs>`);
 push(`<rect x="0" y="0" width="600" height="510" rx="12" fill="${light}"/>`);
 push(txt(20,23,'SCHEMA FUNZIONALE 2D',13,cobalt,'start',700));
 push(txt(579,23,'REV. R2',9,subtle,'end',700));
 if(system==='angolare'){
   const split=Math.max(1,Math.min(n-1,Math.round(qN(a.cornerSplit)||Math.ceil(n/2))));
   const rightCount=Math.max(1,n-split), wb=Math.max(1,qN(a.cornerWidthB)||1500);
   const modes=[a.cornerModeA||'scorrevole',a.cornerModeB||'fisso'];
   const dirs=[a.cornerDirectionA||'destra',a.cornerDirectionB||'destra'];
   const door=a.cornerDoor||'nessuna';
   // Due prospetti, ognuno con lunghezza e numerazione propria: nessuna falsa vista rettilinea.
   const wa=255, wbpx=255, elevY=73, elevH=115;
   const modeTitle=m=>({fisso:'FISSO',scorrevole:'SCORREVOLE',battente:'BATTENTE',fisso_battente:'FISSO + BATTENTE',fisso_scorrevole:'FISSO + SCORREVOLE',impacchettabile:'IMPACCHETTABILE'})[m]||m.toUpperCase();
   elevation(22,elevY,wa,elevH,split,`LATO A · ${modeTitle(modes[0])}`,door==='a',dirs[0]==='sinistra'?'sinistra':'destra');
   elevation(323,elevY,wbpx,elevH,rightCount,`LATO B · ${modeTitle(modes[1])}`,door==='b',dirs[1]==='sinistra'?'sinistra':'destra');
   push(dimension(22,205,277,205,w));push(dimension(323,205,578,205,wb));
   push(txt(20,245,'PIANTA A L · SISTEMI INDIPENDENTI',12,cobalt,'start',700));
   const ox=157, oy=433, lenA=285, lenB=156;
   push(ln(ox,oy,ox+lenA,oy,cobalt,4));push(ln(ox+lenA,oy,ox+lenA,oy-lenB,cobalt,4));
   for(let i=0;i<split;i++){const cx=ox+lenA*(i+.5)/split;push(eleLabel(cx,oy-13,door==='a'&&i===(dirs[0]==='sinistra'?0:split-1)?'P':`A${i+1}`));if(i)push(ln(ox+lenA*i/split,oy-5,ox+lenA*i/split,oy+5,subtle,1.2));}
   for(let i=0;i<rightCount;i++){const cy=oy-lenB*(i+.5)/rightCount;push(txt(ox+lenA+14,cy+3,door==='b'&&i===(dirs[1]==='sinistra'?0:rightCount-1)?'P':`B${i+1}`,10,cobalt,'start',700));if(i)push(ln(ox+lenA-5,oy-lenB*i/rightCount,ox+lenA+5,oy-lenB*i/rightCount,subtle,1.2));}
   const drawSide=(which,mode,dir)=>{
     if(mode==='fisso'){push(txt(which==='a'?ox+lenA/2:ox+lenA+60,which==='a'?oy+41:oy-lenB/2,'FISSO',10));return;}
     const sliding=/scorrevole|impacchettabile/.test(mode);
     const folding=mode==='impacchettabile';
     const swinging=/battente/.test(mode);
     if(which==='a'){
       if(sliding){push(ln(ox+12,oy+11,ox+lenA-12,oy+11,subtle,1.6));push(arr(dir==='sinistra'?ox+lenA-35:ox+35,oy+32,dir==='sinistra'?ox+26:ox+lenA-26,oy+32));if(folding)for(let k=0;k<3;k++)push(ln((dir==='sinistra'?ox+18:ox+lenA-18)+k*5,oy+8,(dir==='sinistra'?ox+18:ox+lenA-18)+k*5,oy+31,red,2));}
       if(swinging){swing(dir==='sinistra'?ox+14:ox+lenA-14,oy,55,dir,a.opening!=='interno');}
     }else{
       if(sliding){push(ln(ox+lenA-11,oy-12,ox+lenA-11,oy-lenB+12,subtle,1.6));push(arr(ox+lenA-34,dir==='sinistra'?oy-lenB+22:oy-22,ox+lenA-34,dir==='sinistra'?oy-22:oy-lenB+22));if(folding)for(let k=0;k<3;k++)push(ln(ox+lenA-7,oy-14-k*5,ox+lenA-29,oy-14-k*5,red,2));}
       if(swinging){const hy=dir==='sinistra'?oy-lenB+15:oy-15;push(dot(ox+lenA,hy));push(ln(ox+lenA,hy,ox+lenA+(outward?45:-45),hy,red,3));push(`<path d="M${ox+lenA} ${hy-46} Q${ox+lenA+38} ${hy-46} ${ox+lenA+46} ${hy}" stroke="${red}" stroke-width="1.6" stroke-dasharray="4 4" fill="none"/>`);}
     }
   };
   drawSide('a',modes[0],dirs[0]);drawSide('b',modes[1],dirs[1]);
   push(txt(20,483,'PIANTA: angolo 90° · lato A e lato B possono avere aperture differenti',10,cobalt,'start'));
 }else{
   const main=labels(n,rawDoor,system==='fisso'||system==='lastra'?false:hasDoor);const ex=62, ey=62, ew=475, eh=140;
   elevation(ex,ey,ew,eh,n,`PROSPETTO · ${fmt(w)} × ${fmt(h)} mm`,system==='fisso'||system==='lastra'?false:hasDoor,rawDoor);
   push(dimension(ex,218,ex+ew,218,w));
   push(txt(22,251,`PIANTA DI FUNZIONAMENTO · ${system.toUpperCase()}`,12,cobalt,'start',700));
   const x0=91,x1=525,yy=327,span=x1-x0,step=span/n;
   const labelAll=()=>main.forEach((v,i)=>push(txt(x0+(i+.5)*step,yy-13,v,11,cobalt,'middle',700)));
   if(system==='fisso'||system==='lastra'){
     push(ln(x0,yy,x1,yy,cobalt,4));for(let k=1;k<n;k++)push(ln(x0+k*step,yy-7,x0+k*step,yy+7,subtle,1));labelAll();
     push(txt(300,420,'ELEMENTO FISSO · nessuna anta in movimento',11,cobalt));
   }else if(system==='scorrevole'){
     // Binari non a zig-zag: piani longitudinali paralleli sovrapposti.
     for(let k=0;k<Math.min(n,4);k++)push(ln(x0,yy+k*9,x1,yy+k*9,subtle,1.1));
     for(let i=0;i<n;i++){const xx=x0+i*step, track=i%Math.min(n,4);push(ln(xx,yy+track*9,xx+step+7,yy+track*9,cobalt,3));push(txt(xx+step/2,yy-13,main[i],10));}
     push(arr(left?x1-15:x0+15,yy-32,left?x0+17:x1-17,yy-32));
     push(txt(300,425,`SCORRIMENTO VERSO ${left?'SINISTRA':'DESTRA'} · binari rappresentati in parallelo`,10,cobalt));
   }else if(system==='battente'){
     for(let k=0;k<n;k++){
       const xa=x0+step*k, xb=xa+step;
       push(ln(xa,yy,xb,yy,cobalt,3));
       const hingeRight=(n===1?(rawDoor==='destra'):(k%2===1));
       const hinge=hingeRight?xb:xa;
       push(txt((xa+xb)/2,yy-13,main[k],11,cobalt,'middle',700));
       swing(hinge,yy,Math.min(74,step*.86),hingeRight?'destra':'sinistra',outward);
     }
     push(txt(300,457,`BATTENTE · ${n} ${n===1?'ANTA':'ANTE'} · APERTURA VERSO ${outward?'ESTERNO':'INTERNO'} · punto rosso = cerniera`,10,cobalt));
   }else if(system==='pieghevole'){
     push(ln(x0,yy,x1,yy,cobalt,3));for(let i=0;i<n;i++)push(txt(x0+(i+.5)*step,yy-13,main[i],11,cobalt,'middle',700));
     push(arr(left?x1-23:x0+23,yy-32,left?x0+23:x1-23,yy-32));
     const anchor=left?x0+15:x1-15,sgn=left?1:-1;
     push(txt(20,389,'ANTE RACCOLTE · VISTA DALL’ALTO',10,cobalt,'start',700));
     // Ogni anta piega alternando l'orientamento, come una fisarmonica.
     let previous=[anchor,402];
     const dx=Math.min(27,230/n),dy=29;
     for(let i=0;i<n;i++){
       const next=[anchor+sgn*(i+1)*dx,402+(i%2?0:dy)];
       push(ln(previous[0],previous[1],next[0],next[1],red,3));push(dot(next[0],next[1],2.5));
       push(txt((previous[0]+next[0])/2,(previous[1]+next[1])/2-8,main[left?i:n-1-i],9));
       previous=next;
     }
     push(txt(300,485,`PIEGHEVOLE · RACCOLTA A ${left?'SINISTRA':'DESTRA'} · segmenti rossi = ante ripiegate`,10,cobalt));
   }else if(system==='impacchettabile'){
     push(ln(x0,yy,x1,yy,cobalt,3));labelAll();push(arr(left?x1-15:x0+15,yy-27,left?x0+15:x1-15,yy-27));
     const anchor=left?x0+23:x1-23;
     for(let j=0;j<n;j++){const xx=anchor+(left?1:-1)*j*7;push(ln(xx,yy+38,xx,yy+108,red,2.4));push(txt(xx,yy+126,main[left?j:n-1-j],8,cobalt));}
     push(txt(300,485,`IMPACCHETTABILE · RACCOLTA A ${left?'SINISTRA':'DESTRA'} · ante parcheggiate lateralmente`,10,cobalt));
   }
 }
 push(txt(300,502,'P = porta, cifre = lastre · rosso = apertura · schema indicativo, non esecutivo',9,subtle));
 return `<svg data-vetrostudio-diagram-revision="R2" class="q-technical-svg drawing-svg" viewBox="0 0 600 515" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schema ${escape(system)}, prospetto e pianta"><g>${el.join('')}</g></svg>`;
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
