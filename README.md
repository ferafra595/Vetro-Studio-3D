# VetroStudio 3D — progetto Cloudflare

Applicazione web multiproprietario (SUPER ADMIN e una utenza per ciascuna vetreria) basata su **Cloudflare Workers, Assets e D1**. Non è una demo statica: salva clienti, listini, progetti, revisioni, ticket e configurazioni nel database, con autenticazione lato server. I pagamenti online sono **non attivi**: le scadenze e i piani sono amministrati manualmente.

## Avvio su Cloudflare

1. Installa Node.js 20+ sul tuo PC e, nella cartella del progetto, esegui `npm install`.
2. Accedi a Cloudflare con `npx wrangler login`.
3. Crea il database con `npx wrangler d1 create vetrostudio-db`.
4. Copia l'identificativo restituito nel campo `database_id` di `wrangler.toml` (sostituisci `REPLACE_WITH_YOUR_D1_DATABASE_ID`).
5. Esegui `npm run db:remote` per creare tabelle e catalogo base in D1.
6. Pubblica con `npm run deploy`. Questo progetto usa un **Worker con asset statici**, non l'upload diretto di una cartella in Pages.
7. Configura un segreto di installazione con `npx wrangler secret put BOOTSTRAP_TOKEN`: quando richiesto, inserisci una stringa segreta lunga e casuale, che dovrai utilizzare soltanto per la configurazione iniziale.
8. Apri l'URL fornito dal deploy. Nella prima schermata inserisci token di installazione, email e password per creare il tuo SUPER ADMIN.
9. Accedi come SUPER ADMIN, crea una vetreria dal pannello, assegnale un piano e imposta la sua email/password. Esci e accedi con le credenziali della vetreria per verificare l'isolamento.

**Importante:** non è possibile proteggere un SUPER ADMIN semplicemente nascondendo il pulsante nella pagina. Il backend esegue autenticazione, hash password PBKDF2 (100.000 iterazioni nel limite Cloudflare), cookie HttpOnly/Secure/SameSite e controlli di autorizzazione. Per la commercializzazione aggiungi protezione anti brute force a livello Cloudflare e verifica la politica di backup.

## Test in locale

Dopo `npm install`, esegui `npm run db:local` e poi `npm run dev`. Avvia il browser sull'indirizzo locale di Wrangler. Per creare l'account iniziale in locale imposta il segreto `BOOTSTRAP_TOKEN` (ad esempio tramite `.dev.vars` **non da pubblicare** e non incluso nello ZIP). L'ambiente di prova D1 è separato dal database remoto.

## Moduli operativi inclusi

- Autenticazione utenti, sessioni e protezione dati per vetreria.
- Inizializzazione protetta dell'unico SUPER ADMIN; login tenant singolo senza utenti collaboratori.
- Piani gestiti dal SUPER ADMIN, creazione/sospensione vetrerie, richieste di registrazione, nessun addebito online.
- Clienti aziendali, catalogo globale + privato, materiali, prezzi e accessori.
- Progetti persistenti in D1 con revisioni; modelli predefiniti con geometrie 3D parametriche di base, lastre aggiuntive e accessori con coordinate.
- Preventivi stampabili in PDF dal browser, esportazione CSV, PNG, DXF 2D semplice e GLTF dei modelli 3D attualmente rappresentati.
- Ticket di assistenza, scambio messaggi, stato e priorità.
- Esportazione backup JSON per vetreria.

## Limiti da non ignorare prima di vendere

Questa versione ha un **backend reale e CRUD persistente**, ma **non è un CAD industriale completo né un prodotto già collaudato per la commercializzazione**. In particolare:

- Lo strumento di sagoma libera registra vertici 2D ed esporta un DXF, ma **non crea ancora lastre tridimensionali sagomate**; mancano curve Bezier/NURBS, booleane vere, fori visualizzati nel modello, controllo tolleranze e generazione automatica dei cicli macchina.
- L'importazione DXF supporta soltanto entità `LINE` in file ASCII, come punti di riferimento; non importa tutti gli elementi o le scale e non garantisce conversioni geometriche complete.
- Le geometrie 3D di muri, scale, accessori e strutture sono rappresentazioni semplificate, da perfezionare per uso tecnico.
- I listini iniziali sono **esempi modificabili**, non prezzi di fornitori certificati. Le verifiche strutturali di parapetti, vetri di sicurezza, ferramenta e montaggi richiedono progettazione e verifica professionale.
- Al momento non sono integrati upload persistenti di modelli GLB/GLTF fornitori, immagini/planimetrie, archivio R2, invio di email, notifiche push, rinnovi automatici, Stripe, fatturazione, completo percorso di onboarding o recupero password via email.
- L'esportazione PDF usa la funzionalità di stampa browser; la geometria GLTF include soltanto il modello visibile e non una distinta tecnica completa.
- Serve un collaudo sull'account Cloudflare di destinazione: il pacchetto è stato verificato staticamente e la migrazione SQLite è stata eseguita in test, ma non è stato effettuato un deploy di produzione né un test end-to-end remoto.

Per un prodotto commerciale reale servono anche test multi-tenant, rate limiting, monitoraggio errori, gestione delle politiche di privacy/GDPR, backup automatici con ripristino provato, gestione del ciclo di vita degli abbonamenti e controllo di carico. Il piano gratuito di Cloudflare ha limiti; non è garantita gratuità in produzione con più clienti.

## File

- `public/index.html`: interfaccia.
- `public/app.js`: logica UI, configuratore 3D e esportazioni.
- `src/worker.js`: API protette Cloudflare e gestione dati.
- `migrations/0001_init.sql`: database e catalogo di avvio.
- `wrangler.toml`: configurazione Workers/Assets/D1; inserire il proprio ID database.

Non inserire mai password o token direttamente nei file HTML, nel repository o in `wrangler.toml`.
