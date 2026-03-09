CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS geofence_events (
    id SERIAL PRIMARY KEY,
    vehicle_id TEXT,
    event_type TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);