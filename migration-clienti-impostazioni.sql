-- Eseguire UNA VOLTA sul database D1 di produzione esistente.
-- Non elimina né modifica le tabelle già esistenti.
CREATE TABLE IF NOT EXISTS tenant_preferences (
 tenant_id TEXT PRIMARY KEY,
 data TEXT NOT NULL DEFAULT '{}',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS projects_tenant_client ON projects(tenant_id,client_id);
