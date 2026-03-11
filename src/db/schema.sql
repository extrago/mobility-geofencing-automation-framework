CREATE EXTENSION IF NOT EXISTS postgis;

-- Geofence zone definitions with PostGIS geometry
CREATE TABLE IF NOT EXISTS geofence_zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'CUSTOM',
    geometry    GEOMETRY(GEOMETRY, 4326),
    speed_limit_kmh INTEGER,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for fast containment queries
CREATE INDEX IF NOT EXISTS idx_geofence_zones_geom
    ON geofence_zones USING GIST (geometry);

-- Geofence crossing events
CREATE TABLE IF NOT EXISTS geofence_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id  TEXT,
    geofence_id UUID REFERENCES geofence_zones(id) ON DELETE SET NULL,
    event_type  TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    speed       DOUBLE PRECISION DEFAULT 0,
    heading     DOUBLE PRECISION DEFAULT 0,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geofence_events_vehicle
    ON geofence_events (vehicle_id);

-- ── Seed data (idempotent) ────────────────────────────────────────────────────
-- "Downtown Restricted Zone" is used by vehicleEnteringRestrictedZone.spec.ts
-- to verify PostGIS spatial containment queries.
INSERT INTO geofence_zones (id, name, type, geometry, active)
VALUES (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Downtown Restricted Zone',
    'RESTRICTED',
    ST_SetSRID(
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[37.61,55.75],[37.63,55.75],[37.63,55.765],[37.61,55.765],[37.61,55.75]]]}'),
        4326
    ),
    true
)
ON CONFLICT (id) DO NOTHING;

