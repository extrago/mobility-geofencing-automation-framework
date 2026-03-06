import { booleanPointInPolygon, point } from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

/**
 * Accepted GeoJSON shapes for a geofence polygon.
 * Both raw geometry objects and GeoJSON Feature wrappers are supported.
 */
type GeofencePolygon =
    | Polygon
    | MultiPolygon
    | Feature<Polygon>
    | Feature<MultiPolygon>;

/**
 * Determines whether the given value is a usable GeoJSON polygon for Turf.
 * Accepts raw geometry objects (`Polygon` / `MultiPolygon`) and
 * GeoJSON Feature wrappers around them.
 */
function isValidPolygon(value: unknown): value is GeofencePolygon {
    if (value === null || typeof value !== 'object') return false;

    const obj = value as Record<string, unknown>;
    const type = obj['type'];

    // Plain geometry
    if (type === 'Polygon' || type === 'MultiPolygon') return true;

    // Feature wrapper
    if (type === 'Feature') {
        const geometry = obj['geometry'] as Record<string, unknown> | null | undefined;
        return (
            geometry !== null &&
            geometry !== undefined &&
            (geometry['type'] === 'Polygon' || geometry['type'] === 'MultiPolygon')
        );
    }

    return false;
}

/**
 * A stateless utility class for GIS-related geofence operations.
 *
 * All methods are **static** — no instantiation needed.
 *
 * @example Import using the `@` path alias (configured in `tsconfig.json`):
 * ```ts
 * import { GeoHelper } from '@/utils/gis/geoHelper.js';
 *
 * const inside = GeoHelper.isPointInsideGeofence(37.615, 55.760, polygonFeature);
 * ```
 */
export class GeoHelper {
    // ── Prevent instantiation ─────────────────────────────────────────────────
    private constructor() {
        throw new Error('GeoHelper is a static utility class and cannot be instantiated.');
    }

    /**
     * Checks whether a geographic point lies inside a GeoJSON polygon geofence.
     *
     * Delegates to `@turf/turf`'s `booleanPointInPolygon`, which uses a
     * ray-casting algorithm and handles:
     * - Simple polygons and polygons with holes
     * - `MultiPolygon` geometries
     * - Points exactly on the boundary (treated as **inside** by default)
     *
     * ---
     * @param longitude     - WGS84 longitude in decimal degrees (X axis, range −180 to 180).
     * @param latitude      - WGS84 latitude  in decimal degrees (Y axis, range −90  to 90).
     * @param geojsonPolygon - A GeoJSON `Polygon`, `MultiPolygon`, or a `Feature`
     *                         wrapping either of those types. Accepts `any` for
     *                         flexibility with raw API / fixture data, but the input
     *                         is validated before use.
     * @returns `true` if the point is inside (or on the boundary of) the polygon,
     *          `false` if outside.
     *
     * @throws {TypeError}  If `geojsonPolygon` is `null`, `undefined`, or does not
     *                      represent a valid GeoJSON Polygon / MultiPolygon.
     * @throws {RangeError} If `longitude` or `latitude` is outside the valid WGS84 range.
     *
     * @example
     * ```ts
     * const zone: Feature<Polygon> = {
     *   type: 'Feature',
     *   properties: {},
     *   geometry: {
     *     type: 'Polygon',
     *     coordinates: [
     *       [[37.61, 55.75], [37.63, 55.75], [37.63, 55.77], [37.61, 55.77], [37.61, 55.75]],
     *     ],
     *   },
     * };
     *
     * GeoHelper.isPointInsideGeofence(37.615, 55.760, zone);  // → true
     * GeoHelper.isPointInsideGeofence(37.500, 55.700, zone);  // → false
     * ```
     */
    static isPointInsideGeofence(
        longitude: number,
        latitude: number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geojsonPolygon: any,
    ): boolean {
        // ── Input validation ───────────────────────────────────────────────────

        if (longitude < -180 || longitude > 180) {
            throw new RangeError(
                `Invalid longitude: ${longitude}. Must be in the range −180 to 180.`,
            );
        }

        if (latitude < -90 || latitude > 90) {
            throw new RangeError(
                `Invalid latitude: ${latitude}. Must be in the range −90 to 90.`,
            );
        }

        if (!isValidPolygon(geojsonPolygon)) {
            throw new TypeError(
                'geojsonPolygon must be a valid GeoJSON Polygon, MultiPolygon, or a Feature wrapping one. ' +
                `Received: ${JSON.stringify(geojsonPolygon)?.slice(0, 120)}`,
            );
        }

        // ── Spatial check ──────────────────────────────────────────────────────

        try {
            // GeoJSON convention: coordinates are [longitude, latitude]
            const turfPoint = point([longitude, latitude]);
            return booleanPointInPolygon(turfPoint, geojsonPolygon);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(
                `GeoHelper.isPointInsideGeofence failed during spatial evaluation: ${message}`,
            );
        }
    }
}
