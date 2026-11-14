VETROSTUDIO 3D — PREVENTIVO VETRO / LISTINO PREZZI

Copia i seguenti file nella directory public/ del repository GitHub:
- app.js (sostituisce il precedente)
- index.html (sostituisce il precedente)
- preventivo-vetro.js (sostituisce il precedente)

Non modificare studio.js, cad2d.js, geometry-core.js, Pages Functions, D1 o SUPER ADMIN.

NOVITÀ
- Preventivo Vetro con parametri prodotto e prospetto/pianta 2D affiancati
- Più configurazioni per preventivo, modificabili ed eliminabili
- Modelli generici: lastra, scorrevole, impacchettabile, fissa, battente
- Numero moduli, direzione, tipo vetro, finiture, struttura e accessori
- Listino Preventivi in menu, prezzi individuali per ogni vetreria su D1
- Valori predefiniti zero, non prezzi inventati
- I prezzi del listino vengono congelati nelle configurazioni aggiunte
- Stampa / Salva PDF dal browser

IL LISTINO VIENE SALVATO COME ELEMENTO RISERVATO DEL CATALOGO
(kind __vetrostudio_quote_prices) utilizzando le API già esistenti.
Le altre vetrerie non possono accedervi, grazie alle restrizioni tenant già implementate lato server.

LIMITI
- Prospetto e pianta sono schematici, non disegni di produzione.
- Non sostituisce certificazioni dei sistemi scorrevoli o impacchettabili.
- Il documento PDF è ottenuto tramite stampa del browser.
- Eseguire test di integrazione sul deployment Cloudflare prima della commercializzazione.
