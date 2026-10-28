# VetroStudio 3D — progetto unificato

Questo archivio contiene **un solo modulo per il configuratore**, `public/studio.js`. Non caricare o mantenere i vecchi `designer-v2...v6`, `renderer-v7...v9`, `studio-v10`, `stair-fix-v12`, `stair-engine-v13`: sono stati rimossi perché sovrascrivevano funzioni tra loro.

## Pubblicazione Cloudflare Pages

- Repository: cartella radice di questo archivio.
- Framework: `None`.
- Build command: `exit 0`.
- Output: `public`.
- Pages Functions: la cartella `functions` alla radice.
- Database D1: binding `DB` sul progetto Pages, con le tabelle in `schema.sql`.
- Credenziali SUPER ADMIN: Secrets Cloudflare `SUPER_ADMIN_EMAIL` e `SUPER_ADMIN_PASSWORD`.
- Pagamenti online: non collegati.

**Se si aggiorna da una versione precedente, eliminare anche da GitHub i vecchi file di configuratore non più usati**, non soltanto caricare quelli nuovi. `app.js` e le funzioni server mantengono gli accessi e il gestionale esistenti.

## Limiti da conoscere

Le scale e i parapetti sono modelli parametrizzati per la visualizzazione e la preventivazione preliminare, non calcoli strutturali certificati. Fori, fissaggi, dimensionamento, carichi, norme e tolleranze richiedono verifica tecnica prima della produzione. La galleria usa geometrie generate nel browser, non modelli di prodotto certificati. Le finiture del motore unificato sono materiali procedurali semplificati, non texture fotografiche PBR.

L'autosalvataggio si attiva **dopo** che il progetto ha un ID nel database (primo salvataggio manuale). I PDF provengono dalla funzione di stampa del browser. Three.js richiede una connessione per i CDN indicati in `index.html`.
