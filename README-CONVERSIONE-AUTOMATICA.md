# VetroStudio - importazione diretta DWG + STEP

## Cosa comprende
- `public/technical-accessories.js`: nuovo caricamento diretto, riconoscimento, bozza e approvazione esplicita. Il Worker continua a conservare originali e GLB in R2 e la specifica tagli in D1.
- `worker.js`: endpoint autenticato `/api/technical-accessories/convert` che inoltra i file a un servizio privato di conversione.
- `cad_converter_service.py`, `requirements-converter.txt`, `Dockerfile.converter`: servizio Python da distribuire su server/container separato. Cloudflare Workers non esegue CadQuery/LibreDWG nativamente.

## Installazione
1. Backup repository e database D1. Serve **già attiva** Libreria tecnica con migrazione SQL, bucket R2 e binding `TECH_FILES`.
2. Sostituisci `public/technical-accessories.js`. Per il Worker, **se hai altre modifiche recenti non sostituire il file intero**: esegui `python apply_to_current_worker.py worker.js` sulla tua versione attuale e pubblica quel Worker; lo script conserva le altre funzionalità. Il file `worker.js` incluso è solo un esempio basato sulla versione Libreria tecnica. Non cancellare `studio.js`, `cad2d.js` o gli altri file.
3. Distribuisci il servizio CAD su un host che esegua container Docker, con HTTPS e risorse sufficienti per CAD. Nel container definisci `CAD_CONVERTER_TOKEN` come segreto lungo e casuale. Non pubblicare il token nel frontend.
4. Configura nel Worker Cloudflare: variabile `CAD_CONVERTER_URL=https://tuo-servizio-cad.example` e segreto `CAD_CONVERTER_TOKEN` con lo stesso valore. Non inserire il token in `wrangler.toml` né nel repository. Un servizio esterno può avere costi anche con codice open source.
5. Riavvia/redistribuisci Worker, apri Libreria tecnica, registra un accessorio, carica DWG + STEP, premi **Importa e riconosci automaticamente**.
6. Controlla layer, quote, origine dei tagli e compatibilità col prodotto. Poi spunta conferma e approva. Solo le schede approvate vengono proposte al configuratore. La prima approvazione è sempre manuale.

## Avvertenze importanti
- Il lettore DWG libero non supporta ogni variante proprietaria. Se un DWG non è convertibile, il sistema mostra un errore senza creare lavorazioni.
- Il DWG deve dichiarare unità *millimetri*. Se manca questa indicazione, la conversione si blocca. Non viene indovinata la scala.
- Cerchi e polilinee chiuse sono **candidati**, non necessariamente fori/tagli. Se il DWG contiene telai, quote o cartigli, carica un DWG con il dettaglio del vetro isolato oppure specifica esplicitamente i layer da interpretare (ad esempio `GLASS_CUT,FORI`).
- STEP viene convertito a GLB soltanto per la visualizzazione. Un modello STEP non certifica quali lavorazioni richieda il prodotto.
- Le dimensioni effettive, l'orientamento dell'origine e la posizione della ferramenta devono essere confrontati con la scheda del produttore prima dell'approvazione. L'auto-conversione non produce istruzioni CNC certificate.
- Per i progetti più vecchi, verifica che il file `studio.js` sia quello che integra `VSTechBridge` e GLBLoader; altrimenti gli accessori non potranno essere agganciati al 2D/3D.
- R2/hosting/CPU di conversione possono avere costi. La trasformazione di file CAD non è garantita gratis in produzione.

## Test da fare sul sito pubblicato
1. Upload entrambi i file: le nuove lavorazioni sono in bozza.
2. Confronto DXF/quote originali, approvazione manuale.
3. Inserimento su una lastra spessore compatibile: appaiono tagli 2D e accessorio GLB 3D.
4. Spostamento dell'accessorio: lavorazioni traslate.
5. Eliminazione dell'accessorio: scompaiono soltanto le sue lavorazioni.
6. Salvataggio, riapertura, esportazione DXF e verifica delle misure.
7. Test di un DWG non decodificabile, spessori incompatibili e fori sovrapposti (devono essere bloccati).

## Stato dei collaudi
È stato testato localmente il parser DXF e il convertitore STEP disponibile in questa sessione. Non è stato possibile eseguire `dwgread` né un deployment Docker/Cloudflare, quindi **la conversione reale del DWG GS-304 resta non verificata**.
