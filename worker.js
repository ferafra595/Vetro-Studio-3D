const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store',...headers}});
const uid=()=>crypto.randomUUID();
const iso=()=>new Date().toISOString();
const bytes=s=>new TextEncoder().encode(s);
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function sha(s){return hex(await crypto.subtle.digest('SHA-256',bytes(s)))}
async function safeEqual(a,b){const ha=await sha(a),hb=await sha(b);let delta=0;for(let i=0;i<ha.length;i++)delta|=ha.charCodeAt(i)^hb.charCodeAt(i);return delta===0}
async function passhash(password,salt){let k=await crypto.subtle.importKey('raw',bytes(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:un64(salt),iterations:100000,hash:'SHA-256'},k,256))}
async function setPass(pass){let salt=b64(crypto.getRandomValues(new Uint8Array(16)));return [salt,await passhash(pass,salt)]}
function cookie(token){return `vs_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`}
const fail=(s,msg)=>json({error:msg},s);
async function auth(req,env){const token=req.headers.get('cookie')?.match(/(?:^|;\s*)vs_session=([^;]+)/)?.[1];if(!token)return null;const row=await env.DB.prepare('SELECT u.id,u.tenant_id,u.email,u.role,u.active,t.status tenant_status,t.name tenant_name,t.plan_id,t.ends_at FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN tenants t ON t.id=u.tenant_id WHERE s.token_hash=? AND s.expires_at>?').bind(await sha(token),iso()).first();if(!row||!row.active||row.tenant_status==='blocked')return null;return row}
async function begin(req,env,user){const token=hex(crypto.getRandomValues(new Uint8Array(32)));let expires=new Date(Date.now()+7*86400000).toISOString();await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sha(token),user.id,expires).run();return json({ok:true,role:user.role,tenantId:user.tenant_id},200, {'set-cookie':cookie(token)})}
const parse=async req=>{try{return await req.json()}catch{return {}}};
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const textv=(v,l=10000)=>String(v??'').slice(0,l);
async function audit(env,u,action,details=''){await env.DB.prepare('INSERT INTO audit(id,actor_id,tenant_id,action,details) VALUES(?,?,?,?,?)').bind(uid(),u.id,u.tenant_id,action,textv(details,2000)).run()}
async function handle(req,env){const url=new URL(req.url),p=url.pathname,method=req.method;if(!['GET','HEAD','OPTIONS'].includes(method)){const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==url.host)return fail(403,'Origine non autorizzata')} if(method==='OPTIONS')return new Response(null,{status:204});
if(p==='/api/health')return json({ok:true,service:'VetroStudio 3D',time:iso()});
if(p==='/api/setup-status')return json({needsSetup:false,adminConfigured:!!(env.SUPER_ADMIN_EMAIL&&env.SUPER_ADMIN_PASSWORD)});
if(p==='/api/bootstrap')return fail(404,'Endpoint disattivato');
if(p==='/api/signup-request'&&method==='POST'){const x=await parse(req);if(!String(x.email||'').includes('@')||!String(x.company||'').trim())return fail(400,'Ragione sociale ed email valide sono obbligatorie');await env.DB.prepare('INSERT INTO signup_requests(id,company,email,vat,phone,note) VALUES(?,?,?,?,?,?)').bind(uid(),textv(x.company,160),textv(x.email,200),textv(x.vat,60),textv(x.phone,80),textv(x.note,500)).run();return json({ok:true,message:'Richiesta inviata'})}
if(p==='/api/login'&&method==='POST'){
 const x=await parse(req),email=String(x.email||'').trim().toLowerCase(),password=String(x.password||'');
 if(!email||!password)return fail(400,'Credenziali richieste');
 const adminEmail=String(env.SUPER_ADMIN_EMAIL||'').trim().toLowerCase();
 if(adminEmail&&email===adminEmail){
  if(!env.SUPER_ADMIN_PASSWORD||!(await safeEqual(password,String(env.SUPER_ADMIN_PASSWORD))))return fail(401,'Credenziali non valide');
  let row=await env.DB.prepare("SELECT * FROM users WHERE role='superadmin' LIMIT 1").first();
  if(row){
   if(row.email!==adminEmail){const occupied=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(adminEmail).first();if(occupied)return fail(409,'Email già assegnata a un account vetreria');await env.DB.prepare('UPDATE users SET email=?,active=1 WHERE id=?').bind(adminEmail,row.id).run();row.email=adminEmail}
  }else{
   const occupied=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(adminEmail).first();if(occupied)return fail(409,'Email già assegnata a un account vetreria');
   const id=uid(),[salt,hash]=await setPass(hex(crypto.getRandomValues(new Uint8Array(32))));
   await env.DB.prepare("INSERT INTO users(id,email,password_salt,password_hash,role,active) VALUES(?,?,?,?, 'superadmin',1)").bind(id,adminEmail,salt,hash).run();row={id,email:adminEmail,role:'superadmin',tenant_id:null};
  }
  return await begin(req,env,row);
 }
 const row=await env.DB.prepare("SELECT * FROM users WHERE email=? AND role='tenant'").bind(email).first();
 if(!row||!row.active)return fail(401,'Credenziali non valide');
 if(!(await safeEqual(await passhash(password,row.password_salt),row.password_hash)))return fail(401,'Credenziali non valide');
 const t=await env.DB.prepare('SELECT status FROM tenants WHERE id=?').bind(row.tenant_id).first();
 if(!t||t.status==='blocked')return fail(403,'Account sospeso: contatta il supporto');
 return await begin(req,env,row);
}
const u=await auth(req,env);if(!u)return fail(401,'Sessione non valida. Effettua l’accesso.');
if(u.role==='tenant'&&u.tenant_status==='paused'&&!['GET','HEAD'].includes(method)&&!['/api/logout','/api/account/password'].includes(p))return fail(403,'Account in sola lettura: abbonamento sospeso');
// Libreria tecnica privata: dati su D1, file CAD su R2; nessuna condivisione tra vetrerie.
if(p.startsWith('/api/technical-accessories')){
 if(u.role!=='tenant')return fail(403,'Accesso riservato alla vetreria');
 const match=p.match(/^\/api\/technical-accessories(?:\/([\w-]+))?(?:\/files\/(dwg|step|dxf|glb))?$/);
 if(!match)return fail(404,'Percorso non valido');
 const id=match[1],fileType=match[2],tenant=u.tenant_id;
 if(!id&&method==='GET')return json({items:(await env.DB.prepare('SELECT id,code,name,category,manufacturer,glass_min,glass_max,price,status,cut_spec,model_meta,created_at,updated_at FROM technical_accessories WHERE tenant_id=? ORDER BY name').bind(tenant).all()).results});
 if(!id&&method==='POST'){
  const x=await parse(req),code=textv(x.code,80).trim(),name=textv(x.name,160).trim();
  if(!code||!name)return fail(400,'Codice e nome sono obbligatori');
  const newId=uid();
  try{await env.DB.prepare('INSERT INTO technical_accessories(id,tenant_id,code,name,category,manufacturer,glass_min,glass_max,price,status,cut_spec,model_meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(newId,tenant,code,name,textv(x.category||'cerniera',60),textv(x.manufacturer,160),num(x.glass_min||4),num(x.glass_max||25),num(x.price||0),'draft',JSON.stringify({holes:[],cutouts:[],origin:[0,0]}),JSON.stringify({})).run();}
  catch(e){return fail(409,'Codice già utilizzato in questa vetreria')}
  await audit(env,u,'technical.create',newId);return json({ok:true,id:newId});
 }
 if(!id)return fail(405,'Metodo non previsto');
 const item=await env.DB.prepare('SELECT * FROM technical_accessories WHERE id=? AND tenant_id=?').bind(id,tenant).first();
 if(!item)return fail(404,'Accessorio non trovato');
 if(fileType){
  if(!env.TECH_FILES)return fail(503,'Archivio R2 non collegato: configura il binding TECH_FILES');
  const key=`technical/${tenant}/${id}/${fileType}`;
  if(method==='GET'){
   const stored=await env.TECH_FILES.get(key);if(!stored)return fail(404,'File non caricato');
   return new Response(stored.body,{headers:{'Content-Type':fileType==='glb'?'model/gltf-binary':'application/octet-stream','Content-Disposition':'attachment; filename="'+id+'.'+fileType+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(method==='PUT'){
   const size=Number(req.headers.get('content-length')||0);
   if(size>12*1024*1024)return fail(413,'Il file supera il limite di 12 MB');
   const bytes=await req.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>12*1024*1024)return fail(400,'File vuoto o troppo grande');
   const magic=new Uint8Array(bytes.slice(0,16));
   const begin=String.fromCharCode(...magic);
   if(fileType==='dwg'&&!begin.startsWith('AC10'))return fail(400,'DWG non riconosciuto');
   if(fileType==='step'&&!new TextDecoder().decode(bytes.slice(0,2048)).includes('ISO-10303-21'))return fail(400,'STEP non riconosciuto');
   if(fileType==='glb'&&!(magic[0]===103&&magic[1]===108&&magic[2]===84&&magic[3]===70))return fail(400,'GLB non riconosciuto');
   if(fileType==='dxf'&&!new TextDecoder().decode(bytes.slice(0,256)).includes('SECTION'))return fail(400,'DXF non riconosciuto');
   await env.TECH_FILES.put(key,bytes,{httpMetadata:{contentType:fileType==='glb'?'model/gltf-binary':'application/octet-stream'}});
   const meta=JSON.parse(item.model_meta||'{}');meta[fileType]={size:bytes.byteLength,uploadedAt:iso()};
   await env.DB.prepare("UPDATE technical_accessories SET model_meta=?,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=?").bind(JSON.stringify(meta),id,tenant).run();
   await audit(env,u,'technical.file',id);return json({ok:true,bytes:bytes.byteLength});
  }
  return fail(405,'Metodo non supportato');
 }
 if(method==='GET')return json({item});
 if(method==='PATCH'){
  const x=await parse(req);
  const code=textv(x.code??item.code,80).trim(),name=textv(x.name??item.name,160).trim();
  if(!code||!name)return fail(400,'Codice e nome obbligatori');
  const min=num(x.glass_min??item.glass_min),max=num(x.glass_max??item.glass_max);
  if(min<=0||max<min||max>100)return fail(400,'Spessori non validi');
  let cuts=x.cut_spec??JSON.parse(item.cut_spec||'{}');
  if(!cuts||!Array.isArray(cuts.holes)||!Array.isArray(cuts.cutouts)||cuts.holes.length>80||cuts.cutouts.length>40)return fail(400,'Lavorazioni non valide');
  for(const h of cuts.holes)if(!Number.isFinite(+h.x)||!Number.isFinite(+h.y)||!Number.isFinite(+h.r)||+h.r<=0||+h.r>300)return fail(400,'Foratura non valida');
  for(const poly of cuts.cutouts)if(!Array.isArray(poly)||poly.length<3||poly.length>300||poly.some(q=>!Array.isArray(q)||q.length!==2||!q.every(v=>Number.isFinite(+v))))return fail(400,'Contorno non valido');
  const status=x.status==='approved'?'approved':'draft';
  if(status==='approved'&&!(cuts.holes.length||cuts.cutouts.length||x.no_cutting===true))return fail(400,'Definisci le lavorazioni o conferma che non sono necessarie');
  try{await env.DB.prepare('UPDATE technical_accessories SET code=?,name=?,category=?,manufacturer=?,glass_min=?,glass_max=?,price=?,status=?,cut_spec=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=?').bind(code,name,textv(x.category??item.category,60),textv(x.manufacturer??item.manufacturer,160),min,max,num(x.price??item.price),status,JSON.stringify(cuts),id,tenant).run()}catch(e){return fail(409,'Codice duplicato')}
  await audit(env,u,'technical.update',id);return json({ok:true});
 }
 if(method==='DELETE'){
  await env.DB.prepare('DELETE FROM technical_accessories WHERE id=? AND tenant_id=?').bind(id,tenant).run();
  if(env.TECH_FILES)await Promise.all(['dwg','dxf','step','glb'].map(ext=>env.TECH_FILES.delete(`technical/${tenant}/${id}/${ext}`)));
  await audit(env,u,'technical.delete',id);return json({ok:true});
 }
 return fail(405,'Metodo non supportato');
}
if(p==='/api/me')return json({id:u.id,email:u.email,role:u.role,tenantId:u.tenant_id,tenantName:u.tenant_name,planId:u.plan_id,tenantStatus:u.tenant_status,endsAt:u.ends_at});
if(p==='/api/logout'&&method==='POST'){const token=req.headers.get('cookie')?.match(/vs_session=([^;]+)/)?.[1];if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(token)).run();return json({ok:true},200,{'set-cookie':'vs_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'})}
if(p==='/api/account/password'&&method==='POST'){if(u.role==='superadmin')return fail(403,'Modifica le credenziali SUPER ADMIN dai segreti Cloudflare');const x=await parse(req);if(!x.current||!x.next)return fail(400,'Compila entrambi i campi');const row=await env.DB.prepare('SELECT password_salt,password_hash FROM users WHERE id=?').bind(u.id).first();if(await passhash(x.current,row.password_salt)!==row.password_hash)return fail(403,'Password attuale errata');const [salt,hash]=await setPass(x.next);await env.DB.prepare('UPDATE users SET password_salt=?,password_hash=? WHERE id=?').bind(salt,hash,u.id).run();await audit(env,u,'password.changed');return json({ok:true})}
if(p==='/api/signup-requests'&&u.role==='superadmin'&&method==='GET')return json({items:(await env.DB.prepare('SELECT * FROM signup_requests ORDER BY created_at DESC LIMIT 300').all()).results});
const signMatch=p.match(/^\/api\/signup-requests\/([\w-]+)$/);if(signMatch&&u.role==='superadmin'&&method==='PATCH'){const x=await parse(req);if(!['pending','reviewed','rejected'].includes(x.status))return fail(400,'Stato non valido');await env.DB.prepare('UPDATE signup_requests SET status=? WHERE id=?').bind(x.status,signMatch[1]).run();return json({ok:true})}
if(p==='/api/plans'&&method==='GET')return json({items:(await env.DB.prepare('SELECT * FROM plans ORDER BY created_at DESC').all()).results});
if(p==='/api/plans'&&method==='POST'){if(u.role!=='superadmin')return fail(403,'Non autorizzato');const x=await parse(req),id=x.id||uid();if(!x.name)return fail(400,'Nome obbligatorio');await env.DB.prepare('INSERT INTO plans(id,name,monthly,yearly,max_projects,enabled,features) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,monthly=excluded.monthly,yearly=excluded.yearly,max_projects=excluded.max_projects,enabled=excluded.enabled,features=excluded.features').bind(id,textv(x.name,120),num(x.monthly),num(x.yearly),num(x.max_projects),x.enabled===false?0:1,JSON.stringify(x.features||{})).run();await audit(env,u,'plan.upsert',id);return json({ok:true,id})}
if(p==='/api/tenants'&&method==='GET'){if(u.role!=='superadmin')return fail(403,'Non autorizzato');return json({items:(await env.DB.prepare('SELECT t.*,u.email login_email FROM tenants t LEFT JOIN users u ON u.tenant_id=t.id ORDER BY t.created_at DESC').all()).results})}
if(p==='/api/tenants'&&method==='POST'){if(u.role!=='superadmin')return fail(403,'Non autorizzato');let x=await parse(req);if(!x.name||!x.email||!x.password)return fail(400,'Ragione sociale, email e password obbligatorie');const id=uid(),userId=uid(),[salt,hash]=await setPass(x.password);try{await env.DB.batch([env.DB.prepare('INSERT INTO tenants(id,name,email,phone,address,vat,plan_id,status,ends_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,textv(x.name,160),textv(x.email,200),textv(x.phone,70),textv(x.address,250),textv(x.vat,40),x.plan_id||'professional','active',x.ends_at||null),env.DB.prepare("INSERT INTO users(id,tenant_id,email,password_salt,password_hash,role) VALUES(?,?,?,?,?,'tenant')").bind(userId,id,String(x.email).toLowerCase(),salt,hash)]);await audit(env,u,'tenant.create',id);return json({ok:true,id})}catch(e){return fail(400,'Creazione fallita: email già presente o dati non validi')}}
const tmatch=p.match(/^\/api\/tenants\/([^/]+)$/);if(tmatch&&method==='PATCH'){if(u.role!=='superadmin')return fail(403,'Non autorizzato');const x=await parse(req),id=tmatch[1];const t=await env.DB.prepare('SELECT * FROM tenants WHERE id=?').bind(id).first();if(!t)return fail(404,'Vetreria non trovata');await env.DB.prepare('UPDATE tenants SET name=?,status=?,plan_id=?,ends_at=?,phone=?,address=?,vat=? WHERE id=?').bind(textv(x.name??t.name,160),x.status??t.status,x.plan_id??t.plan_id,x.ends_at===undefined?t.ends_at:x.ends_at,textv(x.phone??t.phone,70),textv(x.address??t.address,250),textv(x.vat??t.vat,40),id).run();await audit(env,u,'tenant.update',id);return json({ok:true})}
if(p==='/api/tenant/profile'&&method==='PATCH'){if(u.role!=='tenant')return fail(403,'Non autorizzato');const x=await parse(req);await env.DB.prepare('UPDATE tenants SET name=?,vat=?,phone=?,address=? WHERE id=?').bind(textv(x.name,160),textv(x.vat,40),textv(x.phone,70),textv(x.address,250),u.tenant_id).run();return json({ok:true})}
// Preferenze e identità aziendale; ogni operazione è vincolata al tenant autenticato.
if(p==='/api/tenant/preferences'&&u.role==='tenant'){
 if(method==='GET'){
  const x=await env.DB.prepare('SELECT data FROM tenant_preferences WHERE tenant_id=?').bind(u.tenant_id).first();
  return json({data:x?JSON.parse(x.data):{}});
 }
 if(method==='PATCH'){
  const x=await parse(req); const accepted=['name','vat','phone','address','email','website','instagram','facebook','linkedin','city','zip','province','pec','sdi','logo','color','logoPanel','logoQuote','buttonColor','sidebarColor'];
  const old=await env.DB.prepare('SELECT data FROM tenant_preferences WHERE tenant_id=?').bind(u.tenant_id).first();
  let data=old?JSON.parse(old.data):{};
  for(const k of accepted)if(Object.hasOwn(x,k)){
   if(['logo','logoPanel','logoQuote'].includes(k)){
    const v=String(x[k]||'');
    if(v.length>180000||v&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v))return fail(400,'Logo non valido. Usa PNG, JPEG o WebP inferiori a circa 130 KB.');
    data[k]=v;
   }else if(['color','buttonColor','sidebarColor'].includes(k)){
    if(!/^#[0-9a-fA-F]{6}$/.test(String(x[k])))return fail(400,'Colore non valido');
    data[k]=x[k];
   }else data[k]=textv(x[k],k==='address'?400:180);
  }
  await env.DB.prepare(`INSERT INTO tenant_preferences(tenant_id,data) VALUES(?,?) ON CONFLICT(tenant_id) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP`).bind(u.tenant_id,JSON.stringify(data)).run();
  if(Object.hasOwn(x,'name'))await env.DB.prepare('UPDATE tenants SET name=? WHERE id=?').bind(textv(x.name,160),u.tenant_id).run();
  await audit(env,u,'tenant.preferences');return json({ok:true,data});
 }
}
// Ricerca o creazione cliente: il nome libero viene sempre trasformato in un cliente reale.
if(p==='/api/clients/resolve'&&method==='POST'&&u.role==='tenant'){
 const x=await parse(req);const name=String(x.name||'').trim(),email=String(x.email||'').trim().toLowerCase(),phone=String(x.phone||'').replace(/[^0-9+]/g,'');
 if(x.id){const item=await env.DB.prepare('SELECT * FROM clients WHERE id=? AND tenant_id=?').bind(String(x.id),u.tenant_id).first();return item?json({ok:true,item}):fail(404,'Cliente non trovato')}
 if(name.length<2||name.length>160)return fail(400,'Inserisci un nome cliente valido (2–160 caratteri)');
 const rows=(await env.DB.prepare('SELECT * FROM clients WHERE tenant_id=? AND lower(trim(name))=lower(?) LIMIT 30').bind(u.tenant_id,name).all()).results;
 const normalizePhone=v=>String(v||'').replace(/[^0-9+]/g,'');
 let found=email?rows.find(c=>String(c.email||'').trim().toLowerCase()===email):null;
 if(!found&&phone)found=rows.find(c=>normalizePhone(c.phone)===phone);
 if(!found&&rows.length===1&&!email&&!phone)found=rows[0];
 if(found)return json({ok:true,item:found});
 if(rows.length&&!email&&!phone)return fail(409,'Esistono clienti con questo nome: seleziona quello corretto oppure inserisci telefono o email per distinguere un nuovo cliente.');
 if(rows.length&&(email||phone)&&rows.some(c=>(email&&String(c.email||'').toLowerCase()===email)||(phone&&normalizePhone(c.phone)===phone)))return fail(409,'Contatto già registrato: seleziona la scheda cliente.');
 const id=uid();await env.DB.prepare('INSERT INTO clients(id,tenant_id,name,email,phone,address,notes) VALUES(?,?,?,?,?,?,?)').bind(id,u.tenant_id,name,textv(email,200),textv(phone,80),textv(x.address,400),'').run();await audit(env,u,'client.create',id);
 const item=await env.DB.prepare('SELECT * FROM clients WHERE id=? AND tenant_id=?').bind(id,u.tenant_id).first();return json({ok:true,item});
}
// Vista client-centric: preventivi e progetti associati allo stesso cliente.
const cdetail=p.match(/^\/api\/clients\/([\w-]+)\/records$/);
if(cdetail&&method==='GET'&&u.role==='tenant'){
 const id=cdetail[1]; const c=await env.DB.prepare('SELECT * FROM clients WHERE id=? AND tenant_id=?').bind(id,u.tenant_id).first();
 if(!c)return fail(404,'Cliente non trovato');
 const projects=(await env.DB.prepare('SELECT id,title,status,model,quote,revision,created_at,updated_at FROM projects WHERE tenant_id=? AND client_id=? ORDER BY updated_at DESC').bind(u.tenant_id,id).all()).results;
 return json({client:c,projects});
}
if(p==='/api/admin/stats'){if(u.role!=='superadmin')return fail(403,'Non autorizzato');const [a,b,c]=await Promise.all([env.DB.prepare('SELECT COUNT(*) n FROM tenants').first(),env.DB.prepare("SELECT COUNT(*) n FROM tenants WHERE status='active'").first(),env.DB.prepare("SELECT COUNT(*) n FROM tickets WHERE status!='risolto'").first()]);return json({companies:a.n,active:b.n,openTickets:c.n})}
const specs={clients:{fields:['name','email','phone','address','notes'],required:'name'},projects:{fields:['title','client_id','status','model','quote'],required:'title'},catalogue:{fields:['kind','name','unit','cost','price','metadata'],required:'name'},tickets:{fields:['subject','body','priority','status','project_id'],required:'subject'}};
const m=p.match(/^\/api\/(clients|projects|catalogue|tickets)(?:\/([\w-]+))?$/);if(m){const table=m[1],id=m[2],spec=specs[table];if(table!=='tickets'&&u.role!=='tenant'&&table!=='catalogue')return fail(403,'Non autorizzato');if(u.role==='superadmin'&&table==='catalogue'&&!id){if(method==='GET')return json({items:(await env.DB.prepare('SELECT * FROM catalogue WHERE tenant_id IS NULL ORDER BY kind,name').all()).results});}
if(u.role==='superadmin'&&table==='tickets'){if(method==='GET')return json({items:(await env.DB.prepare('SELECT k.*,t.name tenant_name FROM tickets k JOIN tenants t ON k.tenant_id=t.id ORDER BY k.created_at DESC').all()).results})}
if(method==='GET'){if(u.role!=='tenant')return fail(403,'Non autorizzato');if(id){const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND ${table==='catalogue'?'(tenant_id=? OR tenant_id IS NULL)':'tenant_id=?'}`).bind(id,u.tenant_id).first();return row?json({item:row}):fail(404,'Non trovato')}const sql=table==='catalogue'?'SELECT * FROM catalogue WHERE tenant_id=? OR tenant_id IS NULL ORDER BY kind,name':`SELECT * FROM ${table} WHERE tenant_id=? ORDER BY created_at DESC LIMIT 500`;return json({items:(await env.DB.prepare(sql).bind(u.tenant_id).all()).results})}
if(method==='POST'){if(u.role!=='tenant'&&!(u.role==='superadmin'&&table==='catalogue'))return fail(403,'Non autorizzato');const x=await parse(req);if(!x[spec.required])return fail(400,'Campo obbligatorio mancante');if(table==='projects'&&x.client_id){const owner=await env.DB.prepare('SELECT id FROM clients WHERE id=? AND tenant_id=?').bind(x.client_id,u.tenant_id).first();if(!owner)return fail(400,'Cliente non appartenente alla vetreria')}const newId=uid();let keys=spec.fields,vals=keys.map(k=>x[k]===undefined?null:(k==='model'||k==='quote'||k==='metadata'?JSON.stringify(x[k]):k==='cost'||k==='price'?num(x[k]):textv(x[k])));let sql=`INSERT INTO ${table} (id,tenant_id,${keys.join(',')}) VALUES (?, ?,${keys.map(()=>'?').join(',')})`;await env.DB.prepare(sql).bind(newId,u.role==='superadmin'?null:u.tenant_id,...vals).run();await audit(env,u,table+'.create',newId);return json({ok:true,id:newId})}
if(method==='PATCH'&&id){if(u.role==='superadmin'&&table==='tickets'){const x=await parse(req);await env.DB.prepare('UPDATE tickets SET status=?,priority=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(x.status||'aperto',x.priority||'normale',id).run();return json({ok:true})}if(u.role!=='tenant')return fail(403,'Non autorizzato');const old=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND tenant_id=?`).bind(id,u.tenant_id).first();if(!old)return fail(404,'Non trovato');const x=await parse(req);if(table==='projects'){await env.DB.prepare('INSERT INTO project_revisions(id,project_id,tenant_id,revision,model,quote) VALUES(?,?,?,?,?,?)').bind(uid(),id,u.tenant_id,old.revision,old.model,old.quote).run()};if(table==='projects'&&x.client_id){const owner=await env.DB.prepare('SELECT id FROM clients WHERE id=? AND tenant_id=?').bind(x.client_id,u.tenant_id).first();if(!owner)return fail(400,'Cliente non appartenente alla vetreria')}const fields=spec.fields;let values=fields.map(k=>x[k]===undefined?old[k]:(k==='model'||k==='quote'||k==='metadata'?JSON.stringify(x[k]):k==='cost'||k==='price'?num(x[k]):textv(x[k])));let suffix=table==='projects'?', revision=revision+1,updated_at=CURRENT_TIMESTAMP':table==='tickets'?',updated_at=CURRENT_TIMESTAMP':'';await env.DB.prepare(`UPDATE ${table} SET ${fields.map(k=>k+'=?').join(',')}${suffix} WHERE id=? AND tenant_id=?`).bind(...values,id,u.tenant_id).run();await audit(env,u,table+'.update',id);return json({ok:true})}
if(method==='DELETE'&&id){if(u.role!=='tenant')return fail(403,'Non autorizzato');if(table==='clients'){const linked=await env.DB.prepare('SELECT COUNT(*) AS n FROM projects WHERE tenant_id=? AND client_id=?').bind(u.tenant_id,id).first();if(linked.n)return fail(409,'Questo cliente ha progetti o preventivi: non può essere eliminato.');}await env.DB.prepare(`DELETE FROM ${table} WHERE id=? AND tenant_id=?`).bind(id,u.tenant_id).run();await audit(env,u,table+'.delete',id);return json({ok:true})}
}
const msg=p.match(/^\/api\/tickets\/([\w-]+)\/messages$/);if(msg){const ticket=await env.DB.prepare('SELECT * FROM tickets WHERE id=?').bind(msg[1]).first();if(!ticket||u.role==='tenant'&&ticket.tenant_id!==u.tenant_id)return fail(404,'Ticket non trovato');if(method==='GET')return json({items:(await env.DB.prepare('SELECT * FROM ticket_messages WHERE ticket_id=? ORDER BY created_at').bind(ticket.id).all()).results});if(method==='POST'){const x=await parse(req);if(!x.message)return fail(400,'Scrivi un messaggio');await env.DB.prepare('INSERT INTO ticket_messages(id,ticket_id,tenant_id,sender,message) VALUES(?,?,?,?,?)').bind(uid(),ticket.id,ticket.tenant_id,u.role,textv(x.message,10000)).run();return json({ok:true})}}
if(p==='/api/export'&&u.role==='tenant'){const data={};for(let table of ['clients','projects','catalogue','tickets'])data[table]=(await env.DB.prepare(`SELECT * FROM ${table} WHERE tenant_id=?`).bind(u.tenant_id).all()).results;return json({exportedAt:iso(),tenantId:u.tenant_id,data})}
return fail(404,'Endpoint sconosciuto')}
export default {async fetch(req,env){try{if(new URL(req.url).pathname.startsWith('/api/'))return await handle(req,env);return env.ASSETS.fetch(req)}catch(err){console.error(err);return fail(500,'Errore server. Controlla i log di Cloudflare.')}}};
