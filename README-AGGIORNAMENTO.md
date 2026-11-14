# VetroStudio 3D — Scheda cliente, preventivi e impostazioni aziendali

## Prima di pubblicare

1. **Esegui un backup D1** della produzione.
2. Apri la console del database D1 corretto in Cloudflare e applica **una sola volta** il file `migration-clienti-impostazioni.sql` (puoi rieseguirlo: usa `IF NOT EXISTS`).
3. Nella radice del repository, **sostituisci** `worker.js`.
4. Nella cartella `public`, **sostituisci** `app.js`, `preventivo-vetro.js`, `index.html`.
5. Mantieni intatti `studio.js`, `cad2d.js`, `geometry-core.js`, `functions` e il resto del progetto.
6. Esegui un nuovo deployment Cloudflare Pages (produzione).

## Funzioni

- Ricarico sui costi **0% di default** nei nuovi preventivi. Preventivi storici conservano i propri valori.
- Campo cliente unico con suggerimenti dall'archivio; inserendo un nome nuovo, il salvataggio crea la relativa scheda in D1.
- I preventivi sono associati a `client_id` e appaiono nella scheda cliente.
- Nuova **Scheda cliente**: anagrafica, contatti, note, storico di preventivi/progetti, creazione progetto/preventivo con cliente già assegnato.
- Progetti 3D che hanno un cliente assegnato appaiono nello storico del medesimo cliente.
- Impostazioni vetreria: logo fino a 125 KB (PNG/JPG/WebP), dati societari e contatti, web/social, colore tema e cambio password.
- PDF Preventivo Vetro: intestazione con logo/dati aziendali impostati. Anche il vecchio PDF dei progetti include gli stessi dati.

## Database / sicurezza

- `tenant_preferences` è una tabella nuova: una riga per vetreria, accessibile solo al tenant autenticato.
- Il logo viene conservato come data URL nella tabella delle preferenze: è un compromesso semplice con dimensione limitata, non ideale per loghi grandi. In futuro si può usare R2.
- Un progetto può essere assegnato solo a un cliente della stessa vetreria (verifica lato backend).
- I clienti con progetti o preventivi collegati non possono essere eliminati direttamente, per non perdere lo storico.
- Non è modificata alcuna tabella esistente; migrazione non distruttiva.

## Limitazioni dichiarate

- Nessun collaudo reale su account Cloudflare né su database di produzione. Esegui i controlli post-deploy prima dell'utilizzo operativo.
- Il collegamento automatico di *vecchi preventivi salvati soltanto con il nome libero* non è retroattivo. Possono essere aperti e salvati nuovamente per creare/associare il cliente.
- Il preventivo utilizza l'archivio progetti D1 già presente; non aggiunge una nuova tabella preventivi né un registro fiscale.
