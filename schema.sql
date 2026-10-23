CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, vat TEXT DEFAULT '', email TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'active', plan_id TEXT, ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('superadmin','tenant')), active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(tenant_id) REFERENCES tenants(id));
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, monthly REAL NOT NULL DEFAULT 0, yearly REAL NOT NULL DEFAULT 0, max_projects INTEGER DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1, features TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS clients_tenant ON clients(tenant_id);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, client_id TEXT, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'bozza', model TEXT NOT NULL DEFAULT '{}', quote TEXT NOT NULL DEFAULT '{}', revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS projects_tenant ON projects(tenant_id);
CREATE TABLE IF NOT EXISTS project_revisions (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, tenant_id TEXT NOT NULL, revision INTEGER NOT NULL, model TEXT NOT NULL, quote TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS catalogue (id TEXT PRIMARY KEY, tenant_id TEXT, kind TEXT NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'pz', cost REAL NOT NULL DEFAULT 0, price REAL NOT NULL DEFAULT 0, metadata TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS catalogue_tenant ON catalogue(tenant_id);
CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, project_id TEXT, subject TEXT NOT NULL, body TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'normale', status TEXT NOT NULL DEFAULT 'aperto', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS ticket_messages (id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, tenant_id TEXT NOT NULL, sender TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, tenant_id TEXT, action TEXT NOT NULL, details TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plans (id,name,monthly,yearly,features) VALUES ('professional','Professional',49,490,'{"designer":true,"quotes":true,"support":true}');
INSERT OR IGNORE INTO catalogue (id,tenant_id,kind,name,unit,cost,price,metadata) VALUES
('glass-6',NULL,'vetro','Vetro temperato 6 mm','m²',60,98,'{"thickness":6}'),
('glass-8',NULL,'vetro','Vetro temperato 8 mm','m²',85,135,'{"thickness":8}'),
('glass-10',NULL,'vetro','Vetro temperato 10 mm','m²',115,180,'{"thickness":10}'),
('glass-12',NULL,'vetro','Vetro temperato 12 mm','m²',160,235,'{"thickness":12}'),
('acc-handle',NULL,'accessorio','Maniglia verticale inox','pz',23,45,'{}'),
('acc-hinge',NULL,'accessorio','Cerniera vetro/parete','pz',35,70,'{}'),
('acc-borchia',NULL,'accessorio','Borchia fissaggio inox','pz',12,24,'{}'),
('work-polish',NULL,'lavorazione','Molatura filo lucido','ml',5,10,'{}'),
('work-hole',NULL,'lavorazione','Foratura standard','pz',7,15,'{}'),
('service-install',NULL,'servizio','Posa in opera','ora',25,45,'{}'),
('service-transport',NULL,'servizio','Trasporto','viaggio',15,35,'{}');
CREATE TABLE IF NOT EXISTS signup_requests (id TEXT PRIMARY KEY, company TEXT NOT NULL, email TEXT NOT NULL, vat TEXT DEFAULT '', phone TEXT DEFAULT '', note TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS signup_status_idx ON signup_requests(status);
