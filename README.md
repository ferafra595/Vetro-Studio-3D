# VetroStudio 3D — struttura essenziale Cloudflare

La struttura è stata ridotta a **una sola cartella (`public/`)** e ai file indispensabili nella radice:

```
VetroStudio3D_ESSENZIALE/
  public/
    index.html     # interfaccia
    app.js         # interazione e configuratore
  worker.js        # API, login e autorizzazioni
  schema.sql       # tabelle e catalogo base D1
  wrangler.toml    # configurazione Cloudflare
  package.json     # comandi per pubblicazione
  README.md        # istruzioni
```

**La cartella `public/` è necessaria per la sicurezza.** Contiene solo i file da mostrare al browser; i file `worker.js`, `schema.sql` e le impostazioni non devono essere pubblicati come asset del sito.

## Installazione

1. Installa Node.js 20+ e apri un terminale nella cartella estratta.
2. Esegui `npm install` e `npx wrangler login`.
3. Crea D1: `npx wrangler d1 create vetrostudio-db`.
4. Copia il database ID nel campo `database_id` di `wrangler.toml`.
5. Inizializza il database: `npm run db:remote`.
6. Pubblica il Worker e il sito: `npm run deploy`.
7. Imposta il token iniziale: `npx wrangler secret put BOOTSTRAP_TOKEN`.
8. Apri l'URL del deploy e usa il token per creare il primo SUPER ADMIN. Poi dal pannello crea vetrerie e gestisci gli abbonamenti manualmente.

Per provare in locale: `npm run db:local` e `npm run dev`. Per il bootstrap locale configura `BOOTSTRAP_TOKEN` in un file `.dev.vars`, che **non devi pubblicare né includere nel repository**.

Questa applicazione usa **Cloudflare Workers + D1**, non la sola funzione di upload statico di Cloudflare Pages. L'uso locale e remoto di D1 è separato.

## Stato delle funzionalità

La riorganizzazione mantiene lo stesso codice della versione precedente: autenticazione, tenant separati, CRUD di clienti/listini/progetti/ticket, progetti con revisioni, configuratore 3D parametrico, preventivi/esportazioni e SUPER ADMIN. I pagamenti online rimangono da integrare.

**Limiti invariati:** NON è ancora un CAD industriale completo o un SaaS collaudato per la vendita. Disegno libero e DXF sono parziali; upload persistenti di modelli GLB/GLTF, R2, onboarding completo, verifiche strutturali, backup automatici e pagamenti online richiedono altro sviluppo. I prezzi di esempio non sono prezzi certificati. Il primo collaudo Cloudflare sull'account di destinazione resta necessario.

I segreti e le password non vanno salvati dentro file pubblici. Per la produzione occorre inoltre attivare misure contro tentativi ripetuti di login e test di sicurezza multi-tenant.
