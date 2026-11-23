from pathlib import Path
import os,tempfile
import ezdxf
from fastapi.testclient import TestClient
import cad_converter_service as s
os.environ['CAD_CONVERTER_TOKEN']='test-private-long-token'
c=TestClient(s.app)

def create_dxf(path,units=4):
    d=ezdxf.new('R2010');d.header['$INSUNITS']=units;d.layers.new('GLASS_CUT')
    m=d.modelspace();m.add_circle((100,100),7,dxfattribs={'layer':'GLASS_CUT'});m.add_circle((150,100),7,dxfattribs={'layer':'GLASS_CUT'});
    m.add_lwpolyline([(0,0),(200,0),(200,250),(0,250)],close=True,dxfattribs={'layer':'BODY'})
    d.saveas(path)

with tempfile.TemporaryDirectory() as td:
    path=Path(td)/'test.dxf';create_dxf(path)
    r=s.dxf_data(path)
    assert len(r['circles'])==2 and len(r['polylines'])==1
    cuts=s.safe_candidates(r,['GLASS_CUT'])
    assert len(cuts['holes'])==2 and len(cuts['cutouts'])==0
    path2=Path(td)/'bad.dxf';create_dxf(path2,units=0)
    try:s.dxf_data(path2);raise AssertionError('Unitless geometry accepted')
    except Exception as e: assert 'mm' in str(e.detail)
    assert c.get('/health').status_code==200
    assert c.post('/convert').status_code==401
    step=Path('/mnt/data/GS-304_D-B-990-1_S-B.STEP')
    r=c.post('/convert',headers={'X-CAD-Token':'test-private-long-token'},files={'step':('gs.step',step.read_bytes(),'application/octet-stream')},timeout=120)
    assert r.status_code==200, r.text[:500]
    out=r.json();assert out['status']=='draft' and out['glb_base64'] and len(out['glb_base64'])>1000
    print('STEP GS-304 converted; dimensions:',out['dimensions_mm'],'GLB chars',len(out['glb_base64']))
print('All converter tests passed')
