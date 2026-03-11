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
