# VetroStudio 3D — Prima evoluzione V5

## Novità
- Libreria unificata con 8 categorie: scale, parapetti, porte, vetrine, box doccia, divisori, specchi, progetto libero.
- 25 nuovi modelli (più gli 8 modelli di scale/parapetti già presenti).
- Modelli per porte battenti, doppie, scorrevoli, pivot e con sopraluce.
- Composizione iniziale di pannelli e accessori per docce, vetrine, divisori e specchi.
- Controlli parametrici di dimensioni, numero moduli, spessore, telai e binari dove previsti.
- Conservazione degli oggetti aggiunti manualmente durante la rigenerazione del modello.
- Integrazione con editor oggetti, cronologia di modifica e salvataggio JSON già esistenti.

## Installazione
Carica il contenuto della cartella nella radice del repository GitHub collegato a Cloudflare Pages. Non sostituire i binding D1 né i secret già presenti. Nessuna migrazione SQL richiesta. Premi `Tutti i modelli` nella schermata progettazione. Fai sempre un backup del progetto prima di usare un nuovo modello.

## Limiti reali
La costruzione delle nuove tipologie è geometrica/parametrica di base, non certificata per produzione. Le aperture di porte e docce sono rappresentate come configurazioni, non includono ancora una simulazione cinematica affidabile. Il modello pivot non simula la rotazione. I componenti aggiunti manualmente vengono conservati, quelli generati dal modello sono ricalcolati. I controlli dei nuovi modelli non includono ancora tutte le ferramenta e le lavorazioni industriali.

L'editor CAD, le esportazioni e i preventivi mantengono i limiti già dichiarati dal progetto originario. Eseguire un collaudo manuale in browser prima del deploy in produzione. Questa versione non è una replica completa di iSoftGlass.
