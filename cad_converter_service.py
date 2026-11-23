"""Isolated CAD conversion API. Run behind HTTPS, private token, resource limits.
No cutting plan is approved automatically. Converted contours are CANDIDATES.
"""
from __future__ import annotations
import base64, io, os, re, subprocess, tempfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.responses import JSONResponse
import ezdxf

app = FastAPI(title='VetroStudio CAD converter', docs_url=None, redoc_url=None)
LIMIT = 12 * 1024 * 1024
MAX_OUTPUT = 10 * 1024 * 1024

def fail(status, msg): raise HTTPException(status_code=status, detail=msg)
def validate_bytes(data, typ):
    if not data or len(data)>LIMIT: fail(413, 'File mancante o maggiore di 12 MB')
    if typ=='dwg' and not re.match(rb'^AC10\d\d', data[:6]): fail(422, 'Firma DWG non riconosciuta')
    if typ=='step' and b'ISO-10303-21' not in data[:2048]: fail(422, 'Firma STEP non riconosciuta')

def dxf_data(path):
    try: doc=ezdxf.readfile(path)
    except Exception as e: fail(422, 'File DXF non leggibile: '+str(e)[:140])
    insunits=int(doc.header.get('$INSUNITS',0))
    # DXF import rules are explicit: an unspecified unit cannot be guessed.
    if insunits != 4: fail(422, 'DWG/DXF senza unità confermate in mm ($INSUNITS=4): correggi il disegno nel CAD di origine')
    circles=[]; polylines=[]; omitted=[]; layers=set();
    for e in doc.modelspace():
        typ=e.dxftype(); layer=e.dxf.get('layer','0');layers.add(layer)
        try:
            if typ=='CIRCLE':
                center=e.dxf.center; radius=float(e.dxf.radius)
                if radius>0 and all(abs(x)<1e7 for x in (center.x,center.y,radius)):
                    circles.append({'layer':layer,'x':float(center.x),'y':float(center.y),'r':radius})
            elif typ=='LWPOLYLINE':
                pts=list(e.get_points('xyb'))
                if e.closed and len(pts)>=3 and len(pts)<=300 and all(abs(v[2])<1e-9 for v in pts):
                    polylines.append({'layer':layer,'points':[[float(v[0]),float(v[1])] for v in pts]})
                else:omitted.append(f'{typ} layer {layer}: aperta o con archi')
            elif typ=='POLYLINE':
                pts=[[float(v.dxf.location.x),float(v.dxf.location.y)] for v in e.vertices]
                if e.is_closed and len(pts)>=3 and len(pts)<=300: polylines.append({'layer':layer,'points':pts})
                else: omitted.append(f'{typ} layer {layer}: non supportata')
            elif typ not in ('LINE','POINT','TEXT','MTEXT','DIMENSION'): omitted.append(f'{typ} layer {layer}')
        except Exception: omitted.append(f'{typ} layer {layer}: non interpretabile')
    if len(circles)>500 or len(polylines)>200:fail(422,'Troppe geometrie candidate: isola il dettaglio di taglio nel DWG')
    return {'circles':circles, 'polylines':polylines, 'layers':sorted(layers), 'ignored':omitted[:30]}

def safe_candidates(raw,cutting_layers):
    eligible=set(cutting_layers)
    circles=[c for c in raw['circles'] if c['layer'] in eligible]
    polys=[p for p in raw['polylines'] if p['layer'] in eligible]
    if not circles and not polys:return {'holes':[], 'cutouts':[], 'origin':[0,0]}
    coords=[(c['x'],c['y']) for c in circles]+[tuple(pt) for p in polys for pt in p['points']]
    x0=(min(x for x,y in coords)+max(x for x,y in coords))/2
    y0=(min(y for x,y in coords)+max(y for x,y in coords))/2
    return {'holes':[{'x':round(c['x']-x0,3),'y':round(c['y']-y0,3),'r':round(c['r'],3)} for c in circles],
            'cutouts':[[[round(x-x0,3),round(y-y0,3)] for x,y in p['points']] for p in polys],
            'origin':[x0,y0]}

def step_glb(path):
    import cadquery as cq, numpy as np, trimesh
    solids=list(cq.importers.importStep(str(path)).solids().vals()); scene=trimesh.Scene()
    if not solids:fail(422,'STEP privo di solidi renderizzabili')
    if len(solids)>200:fail(422,'STEP troppo complesso: più di 200 solidi')
    for i,solid in enumerate(solids):
        vertices,triangles=solid.tessellate(0.18,0.25)
        v=np.array([[p.x,p.y,p.z] for p in vertices],dtype=np.float64)
        faces=np.array(triangles,dtype=np.int64)
        if len(faces)>150000 or len(v)>150000:fail(422,'Geometria STEP troppo dettagliata')
        mesh=trimesh.Trimesh(vertices=v,faces=faces,process=False)
        if not mesh.is_empty:scene.add_geometry(mesh,node_name=f'part_{i:03d}')
    if not scene.geometry:fail(422,'STEP privo di geometria triangolabile')
    result=scene.export(file_type='glb')
    if len(result)>MAX_OUTPUT:fail(413,'GLB convertito supera 10 MB: semplifica il modello')
    return result,[round(float(v),2) for v in (scene.bounds[1]-scene.bounds[0])]

@app.get('/health')
def health():return {'ok':True,'service':'VetroStudio CAD converter'}

@app.post('/convert')
async def convert(x_cad_token: str | None=Header(None),
                  dwg:UploadFile|None=File(None), step:UploadFile|None=File(None),
                  cutting_layers:str=Form('')):
    secret=os.getenv('CAD_CONVERTER_TOKEN','')
    import hmac
    if not secret or not x_cad_token or not hmac.compare_digest(x_cad_token,secret):fail(401,'Token convertitore non valido')
    if not dwg and not step:fail(400,'Carica almeno un DWG o STEP')
    warnings=[]; raw=None; glb=None; dimensions=None; cuts={'holes':[],'cutouts':[],'origin':[0,0]}
    with tempfile.TemporaryDirectory(prefix='vs_cad_') as tmp:
        root=Path(tmp)
        if dwg:
            data=await dwg.read(LIMIT+1);validate_bytes(data,'dwg');src=root/'source.dwg';src.write_bytes(data)
            out=root/'source.dxf'
            try:
                r=subprocess.run(['dwgread','-O','DXF','-o',str(out),str(src)],capture_output=True,timeout=35,check=False)
            except FileNotFoundError:fail(503,'Convertitore LibreDWG non installato sul servizio')
            except subprocess.TimeoutExpired:fail(422,'Conversione DWG scaduta')
            if r.returncode or not out.exists():fail(422,'Conversione DWG fallita: file o versione non supportati')
            raw=dxf_data(out)
            explicit=[s.strip() for s in cutting_layers.split(',') if s.strip()]
            suggested=[name for name in raw['layers'] if re.search(r'cut|tagl|foro|hole|glass|vetro|scass|lavor',name,re.I)]
            eligible=explicit or suggested
            if not eligible:warnings.append('Nessun layer di taglio identificato: seleziona i layer corretti prima di applicare le lavorazioni')
            if raw['ignored']:warnings.append(f'{len(raw["ignored"])} entità ignorate: controlla che non rappresentino tagli')
            if not explicit and suggested:warnings.append('Layer selezionati automaticamente dal nome: verifica sempre l’anteprima')
            cuts=safe_candidates(raw,eligible)
        if step:
            data=await step.read(LIMIT+1);validate_bytes(data,'step');p=root/'source.step';p.write_bytes(data)
            try:glb,dimensions=step_glb(p)
            except HTTPException:raise
            except Exception as e:fail(422,'Conversione STEP fallita: '+str(e)[:120])
    return {'ok':True,'format':'vetrostudio-technical-import','version':1,'status':'draft',
            'cuts':cuts,'glb_base64':base64.b64encode(glb).decode('ascii') if glb else None,
            'dimensions_mm':dimensions,'layers':raw['layers'] if raw else [],
            'suggested_layers':suggested if raw else [],'selected_layers':eligible if raw else [],
            'candidate_count':(len(raw['circles'])+len(raw['polylines'])) if raw else 0,
            'warnings':warnings,'requires_approval':True}
