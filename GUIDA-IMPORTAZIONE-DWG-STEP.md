# VetroStudio — Accessori STEP + DWG (importazione browser)

## Stato
Il sito è pubblicato dal percorso **public/**. La libreria tecnica utilizzata dal browser è **public/technical-accessories.js**, con:
- **public/cad-browser-import.js**: STEP → GLB e DXF ASCII;
- **public/dwg-browser-import.js**: lettura DWG nel browser tramite LibreDWG WebAssembly. Il motore è distribuito sotto `public/vendor/libredwg/{dist,wasm}` (file locali, senza CDN a runtime).

## Flusso
1. Catalogo e listini → Libreria tecnica → crea/seleziona accessorio. Il sito deve mostrare **R5 · DWG + STEP locali**.
2. Importa file STEP dell'accessorio e DWG del *glass cut-out* del produttore.
3. Specifica il layer CAD contenente **solo fori e contorni di taglio** se sono presenti più layer.
4. Se il DWG non dichiara le unità, conferma che il disegno del produttore è in millimetri. Una dichiarazione esplicita non-mm blocca sempre l'importazione.
5. Il browser interpreta solo CIRCLE e LWPOLYLINE chiuse rettilinee sul layer scelto. INSERT, archi, spline, hatch, dimensioni e geometrie miste non vengono convertiti in tagli presunti.
6. Viene visualizzato un riepilogo prima del salvataggio **in bozza**. Se il DWG è convertito con successo, viene generato e archiviato automaticamente anche un DXF ASCII in millimetri con **solo** le lavorazioni riconosciute, relativo all'origine del pattern. Si può scaricare nuovamente dal pulsante *Esporta DXF delle lavorazioni*. Il DXF non replica gli altri elementi del disegno sorgente. Poi la scheda richiede approvazione tecnica e controlli delle misure.
7. Se approvato, scegli l'accessorio sul vetro nel configuratore; i tagli restano collegati alla posizione.

L'importazione STEP senza un disegno di taglio valido **non elimina** le lavorazioni precedenti.

## Costi e licenza
Non è richiesto alcun server CAD esterno. L'interprete DWG opzionale carica `@mlightcad/libredwg-web@0.7.14` tramite CDN e WASM; progetto coperto da **GPL-3.0**. Prima di distribuire VetroStudio come SaaS commerciale a clienti, verificare licenza, attribuzioni e obblighi di fornitura del codice sorgente con consulenza legale appropriata. Zero canone per il convertitore non significa assenza di obblighi di licenza. La disponibilità del CDN e i limiti R2/Workers rimangono esterni alla garanzia del progetto.

## Limitazioni e collaudo
Il codice è controllato mediante `node --test tests/dwg-import.test.cjs` e GitHub Actions. Il workflow include un test nel browser del caricamento WASM STEP e DWG. **Non** è ancora stato effettuato un collaudo dimensionale end-to-end sul DWG GS-304 nel sito pubblicato. Il file GS-304 del produttore è DWG AC1015: questa versione è rilevata dal file originale, ma non è ancora provato che le sue entità si convertano integralmente.

I formati DWG possono contenere curve, blocchi ed entità non supportate. In tal caso il programma **deve bloccare** la generazione dei tagli, richiedendo una lavorazione verificata dall'operatore. Il modello STEP non fornisce di per sé i tagli del vetro.

Le lavorazioni risultanti non costituiscono un disegno esecutivo o un programma CNC certificato. Controllare sempre quote, spessori, riferimenti, gioco e istruzioni del produttore.

## Test automatici
GitHub Actions: `.github/workflows/test-cad.yml`.
