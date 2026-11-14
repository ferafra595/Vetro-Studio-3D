#!/usr/bin/env python3
"""Offline STEP -> GLB converter for VetroStudio technical accessory library.
Requires: pip install cadquery trimesh numpy
Output coordinates stay in millimetres; source STEP units are interpreted by OpenCascade.
Run locally; do not publish source STEP as a public site asset.
"""
import argparse
from pathlib import Path
import numpy as np
import cadquery as cq
import trimesh


def convert(src: Path, dst: Path, tolerance=0.12):
    shape = cq.importers.importStep(str(src))
    solids = list(shape.solids().vals())
    if not solids:
        raise ValueError('STEP file does not contain a supported solid')
    scene = trimesh.Scene()
    count = 0
    for i, solid in enumerate(solids):
        vertices, triangles = solid.tessellate(tolerance, 0.2)
        v = np.array([[p.x,p.y,p.z] for p in vertices], dtype=np.float64)
        faces = np.array(triangles, dtype=np.int64)
        if not len(faces):
            continue
        mesh = trimesh.Trimesh(vertices=v, faces=faces, process=False)
        if not mesh.is_empty:
            scene.add_geometry(mesh, node_name=f'solid_{i:03d}', geom_name=f'part_{i:03d}')
            count += 1
    if not count: raise ValueError('No tessellated solids were produced')
    scene.export(str(dst), file_type='glb')
    bounds = scene.bounds
    return count, list(map(float,bounds[1]-bounds[0]))

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('step',type=Path)
    ap.add_argument('glb',type=Path)
    args=ap.parse_args()
    n,dimensions=convert(args.step,args.glb)
    print(f'GLB generated: {n} solids, bounds (mm): {dimensions}')
