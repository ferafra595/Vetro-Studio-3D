# VetroStudio 3D — aggiornamento V6

Modificati `public/designer-v2.js`, `public/designer-v4.js`, `public/index.html`; aggiunto `public/designer-v6.js`.

- Un solo punto d'accesso: **Scegli categoria e modello**, con galleria per le categorie esistenti. Eliminati i comandi duplicati per la galleria delle scale e il vecchio selettore generico.
- Docce: costruzione parametrica con pannelli, porte, supporti, cerniere, maniglie, pareti di riferimento e binari dove previsti. Modelli B01–B10.
- Scale: modelli S05–S08, tra cui varianti a L/U con rampe, pianerottolo, pannelli, fissaggi e corrimano. Composizioni geometriche modificabili, non calcoli strutturali.
- Il resto del gestionale, API, login, database D1, listini e assistenza resta invariato.

## Distribuzione
Sostituisci il contenuto del repository GitHub con i file dell'archivio, mantenendo Cloudflare Pages con output `public`; non eseguire nuove migrazioni D1. I vecchi script V2–V5 sono necessari e restano inclusi.

## Limitazioni tecniche
Il renderer usa primitive Three.js e il motore attuale non è un CAD industriale validato. I modelli sono geometrie reali modificabili, ma non garantiscono fedeltà millimetrica ai prodotti commerciali illustrati nelle foto; in particolare non comprendono verifiche strutturali, certificazione dei fissaggi, movimento cinematico delle ante o conformità dei componenti. Le sagome e le scale complesse richiedono ancora verifica tecnica prima della produzione.
