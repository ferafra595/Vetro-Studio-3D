# VetroStudio CAD 2D — correzione archi e barra strumenti

Sostituisci in GitHub soltanto:
- `public/cad2d.js`
- `public/geometry-core.js`

Non cambiare database D1, login, SUPER ADMIN o altri file.

## Modifiche
- Le forme rapide **Arco superiore**, **Angoli arrotondati** e **Cerchio** vengono generate con segmenti parametrici (bulge) invece di decine di vertici di controllo.
- La tassellazione per la visualizzazione scarta microsegmenti numericamente duplicati (senza cambiare la geometria parametrica originale).
- Le quote dei lati piccoli non vengono ripetute una sopra l'altra; gli indici dei punti sono ridotti sulle sagome già molto dense.
- Passo griglia, Snap e Griglia sono riuniti in un gruppo di controlli chiaro e leggibile.

## Per correggere la sagoma già deformata
Seleziona `Arco superiore` dalle forme rapide: questo **rigenera il contorno** e rimuove eventuali fori, quindi conserva prima una copia del progetto se le lavorazioni esistenti ti servono.

## Limiti
Le forme predefinite usano archi parametrici; il CAD non è ancora certificato per produzione CNC e resta necessario verificare le lavorazioni rispetto ai dati tecnici di fornitore e materiale.
