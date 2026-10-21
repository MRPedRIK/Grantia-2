CREATE TABLE users (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','tech','user'))
);
CREATE TABLE assets (
 id BIGSERIAL PRIMARY KEY, patrimony_number VARCHAR(100) UNIQUE NOT NULL,
 device_type TEXT NOT NULL, model TEXT NOT NULL, current_location TEXT NOT NULL,
 home_location TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','in_transit_hq','at_hq','in_repair','in_transit_user')),
 assigned_tech_id BIGINT REFERENCES users(id), version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE tickets (
 id BIGSERIAL PRIMARY KEY, asset_id BIGINT NOT NULL REFERENCES assets(id),
 description TEXT NOT NULL, opened_by BIGINT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX one_open_ticket ON tickets(asset_id) WHERE status='open';
CREATE TABLE movement_logs (
 id BIGSERIAL PRIMARY KEY, asset_id BIGINT NOT NULL REFERENCES assets(id),
 action_type TEXT NOT NULL, from_location TEXT NOT NULL, to_location TEXT NOT NULL,
 handled_by_user BIGINT NOT NULL REFERENCES users(id), timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
 collector TEXT, deliverer TEXT, notes TEXT, assigned_tech_id BIGINT REFERENCES users(id)
);
CREATE INDEX movements_asset_time ON movement_logs(asset_id, timestamp DESC);
