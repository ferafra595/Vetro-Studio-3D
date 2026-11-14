VetroStudio 3D — Miglioramenti branding, clienti e preventivo

CONTENUTO DELLA ZIP
- worker.js                -> sostituisci alla radice del repository
- public/index.html        -> sostituisci
- public/app.js            -> sostituisci
- public/preventivo-vetro.js -> sostituisci

NON MODIFICARE:
- schema.sql, database Cloudflare D1 e le sue tabelle
- funzioni di autenticazione Cloudflare e segreti SUPER ADMIN
- studio.js, cad2d.js, geometry-core.js e relativi altri file

NOVITA'
1. PDF A4 impaginato con intestazione, dati aziendali, destinatario, tabella lavorazioni e riepilogo leggibile anche in stampa.
2. Logo pannello e logo preventivo separati, entrambi opzionali (PNG/JPEG/WebP fino a 125 KB ciascuno).
3. Colore pulsanti e colore menu laterale configurabili separatamente.
4. Cliente esistente selezionabile per ID stabile; nella ricerca sono visibili telefono ed email per distinguere gli omonimi. Nuovo cliente con telefono e/o email per evitare la fusione automatica di schede con lo stesso nome.
5. Colore struttura, guarnizioni e colore maniglie ora sono menu con opzioni predefinite, mantenendo le voci già salvate sui preventivi esistenti.

NOTA DATI
Le nuove preferenze si salvano nello stesso record JSON di tenant_preferences su D1, senza migrazioni.
Le impostazioni precedenti 'logo' e 'color' sono lette come fallback, senza cancellarle.
Le preferenze grafiche di una vetreria non alterano quelle delle altre.

VERIFICA CONSIGLIATA DOPO DEPLOY
- Impostazioni: carica logo pannello e logo preventivo diversi, scegli due colori e salva.
- Preventivo: seleziona da elenco il cliente corretto tra due omonimi; verifica la scheda associata.
- Nuovo cliente: inserisci nome e recapito e salva.
- Prova le tre tendine e genera un PDF A4 (stampa a colori oppure in bianco e nero).
- Controlla l'apertura di un preventivo già salvato e l'accesso al gestionale.

TEST ESEGUITI
- Controllo sintattico JS di worker.js, app.js, preventivo-vetro.js
- Test Chromium locale con API simulate per impostazioni, clienti omonimi, tendine, anteprima preventivo e PDF
- Verifica visiva della prima pagina del PDF e del riepilogo

NON ESEGUITO: collaudo remoto del deployment Cloudflare Pages con D1 reale.
