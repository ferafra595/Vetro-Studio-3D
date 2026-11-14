-- Eseguire UNA VOLTA sul D1 esistente; non elimina dati.
CREATE TABLE IF NOT EXISTS technical_accessories (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 code TEXT NOT NULL,
 name TEXT NOT NULL,
 category TEXT NOT NULL DEFAULT 'cerniera',
 manufacturer TEXT NOT NULL DEFAULT '',
 glass_min REAL NOT NULL DEFAULT 4,
 glass_max REAL NOT NULL DEFAULT 25,
 price REAL NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved')),
 cut_spec TEXT NOT NULL DEFAULT '{"holes":[],"cutouts":[],"origin":[0,0]}',
 model_meta TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
 UNIQUE (tenant_id,code)
);
CREATE INDEX IF NOT EXISTS idx_technical_tenant ON technical_accessories(tenant_id,name);
