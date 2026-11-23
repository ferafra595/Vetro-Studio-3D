#!/usr/bin/env python3
"""Apply CAD conversion route to the user's CURRENT Worker, preserving other features.
Usage: python apply_to_current_worker.py ./worker.js
"""
from pathlib import Path
import sys
if len(sys.argv)!=2:raise SystemExit('Uso: python apply_to_current_worker.py percorso/worker.js')
path=Path(sys.argv[1]);s=path.read_text(encoding='utf-8')
if "p==='/api/technical-accessories/convert'" in s:
    print('Route CAD already installed');raise SystemExit(0)
marker="if(p.startsWith('/api/technical-accessories')){\n if(u.role!=='tenant')return fail(403,'Accesso riservato alla vetreria');"
if marker not in s:raise SystemExit('Il Worker non ha la Libreria tecnica attiva. Non modificato. Installa prima la Libreria tecnica.')
source=Path(__file__).with_name('worker.js').read_text()
start=source.index(' // Direct CAD conversion through an independently hosted')
end=source.index(" const match=p.match(/^\\/api\\/technical-accessories",start)
insert=source[start:end]
backup=path.with_suffix('.js.before-cad-converter');backup.write_text(s)
s=s.replace(marker,marker+'\n'+insert,1)
path.write_text(s)
print('Route CAD aggiunta senza rimuovere altre funzioni. Backup:',backup)
