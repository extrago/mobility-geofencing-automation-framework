import type { PoolClient } from 'pg';
import { DbClient } from './dbClient';
import type { GeofenceEvent } from '../api/apiTypes';

const db = DbClient.getInstance();

// ── Geofence Zone Queries ──────────────────────────────────────────────────────

/**
 * Fetches all active geofence zones that spatially contain the given point.
 * Uses PostGIS ST_Contains for server-side spatial evaluation.
 */
export async function findZonesContainingPoint(
    lng: number,
    lat: number,
): Promise<Array<{ id: string; name: string; type: string }>> {
    const sql = `
    SELECT id, name, type
    FROM geofence_zones
    WHERE active = true
      AND ST_Contains(
            geometry,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
          )
  `;
    return db.query(sql, [lng, lat]);
}

/**
 * Checks whether two geofence zones spatially overlap.
 */
export async function doZonesOverlap(
    zoneIdA: string,
    zoneIdB: string,
): Promise<boolean> {
    const sql = `
    SELECT ST_Overlaps(a.geometry, b.geometry) AS overlaps
    FROM geofence_zones a, geofence_zones b
    WHERE a.id = $1 AND b.id = $2
  `;
    const rows = await db.query<{ overlaps: boolean }>(sql, [zoneIdA, zoneIdB]);
    return rows[0]?.overlaps ?? false;
}

/**
 * Returns zones within a bounding box [minLng, minLat, maxLng, maxLat].
 */
export async function findZonesInBoundingBox(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
): Promise<Array<{ id: string; name: string }>> {
    const sql = `
    SELECT id, name
    FROM geofence_zones
    WHERE active = true
      AND ST_Intersects(
            geometry,
            ST_MakeEnvelope($1, $2, $3, $4, 4326)
          )
  `;
    return db.query(sql, [minLng, minLat, maxLng, maxLat]);
}

// ── Geofence Event Queries ─────────────────────────────────────────────────────

/**
 * Returns the most recent N geofence events for a given vehicle.
 */
export async function getRecentEventsForVehicle(
    vehicleId: string,
    limit = 10,
): Promise<GeofenceEvent[]> {
    const sql = `
    SELECT
      id, vehicle_id AS "vehicleId", geofence_id AS "geofenceId",
      event_type AS "eventType", latitude, longitude, speed, heading,
      timestamp::text AS "timestamp"
    FROM geofence_events
    WHERE vehicle_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `;
    return db.query<GeofenceEvent>(sql, [vehicleId, limit]);
}

/**
 * Counts entry events for a zone within a time window.
 */
export async function countEntryEvents(
    geofenceId: string,
    fromTimestamp: string,
    toTimestamp: string,
): Promise<number> {
    const sql = `
    SELECT COUNT(*) AS count
    FROM geofence_events
    WHERE geofence_id = $1
      AND event_type = 'ENTRY'
      AND timestamp BETWEEN $2::timestamptz AND $3::timestamptz
  `;
    const rows = await db.query<{ count: string }>(sql, [
        geofenceId,
        fromTimestamp,
        toTimestamp,
    ]);
    return parseInt(rows[0]?.count ?? '0', 10);
}

/**
 * Deletes all test-generated data matching a vehicle ID pattern.
 * Safe to call in afterEach/afterAll teardown hooks.
 */
export async function cleanupTestVehicleData(
    vehicleIdPattern: string,
    client?: PoolClient,
): Promise<void> {
    // Guard: only delete events older than 5 minutes.
    // With 4 parallel browser workers, one browser's afterAll can run while
    // another browser's DB tests are still querying recently-written events.
    // Limiting deletion to events > 5 minutes old prevents that contamination
    // while still cleaning up stale data from previous test runs.
    const sql = `DELETE FROM geofence_events WHERE vehicle_id LIKE $1 AND timestamp < NOW() - INTERVAL '5 minutes'`;
    if (client) {
        await client.query(sql, [vehicleIdPattern]);
    } else {
        await db.query(sql, [vehicleIdPattern]);
    }
}

