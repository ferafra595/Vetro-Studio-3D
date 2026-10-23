# VetroStudio 3D — Cloudflare Pages + D1

## Struttura minima
- `public/index.html` e `public/app.js`: interfaccia
- `functions/api/[[path]].js`: API Cloudflare Pages Functions
- `worker.js`: logica API condivisa
- `schema.sql`: schema database D1

## GitHub → Cloudflare Pages
Nel progetto Pages collegato a GitHub usa:
- Framework preset: None
- Root directory: `/` (repository root)
- Build command: `exit 0`
- Build output directory: `public`
- Production branch: `main`

**Attenzione:** metti il contenuto di questa cartella nella radice del repository GitHub, non in una sottocartella.

## Database D1
1. In Cloudflare > Workers & Pages > D1 crea un database `vetrostudio-db`.
2. Nella console D1 importa/esegui il contenuto di `schema.sql` (in alternativa da terminale `npx wrangler d1 execute vetrostudio-db --remote --file=./schema.sql`).
3. In Workers & Pages > il tuo progetto Pages > Settings > Bindings aggiungi D1 database binding chiamato **DB** collegato al database `vetrostudio-db`. Configura sia Production sia Preview se necessarie.
4. In Settings > Variables and Secrets configura un segreto **BOOTSTRAP_TOKEN** (valore privato scelto da te). Non pubblicarlo nel repository.
5. Ridistribuisci il progetto (Redeploy) per applicare binding e variabili.
6. Apri `/api/health` e verifica la risposta JSON `ok:true`; `/api/setup-status` deve rispondere dopo il collegamento D1.
7. Apri il sito e crea il SUPER ADMIN usando il token di installazione.

## Importante
- Non basta impostare `public` come output: senza la cartella `functions` l'interfaccia comparirà ma login, SUPER ADMIN, clienti e progetti non funzioneranno.
- Non aggiungere `wrangler.toml` della versione Worker a questo progetto Pages.
- Questa correzione riguarda l'integrazione Pages e non completa gli strumenti CAD industriali e le funzioni mancanti già indicate. Il deploy reale sul tuo account rimane da verificare.
- Il codice non include ancora protezioni di produzione sufficienti contro abuso login, e va collaudato e rafforzato prima di venderlo.
