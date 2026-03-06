// @turf/turf ships its own declarations; this error resolves after `npm install`.
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson';

/**
 * Checks whether a given [lng, lat] point lies inside a GeoJSON polygon zone.
 */
export function isPointInsideZone(
    coordinates: Position,
    zone: Feature<Polygon | MultiPolygon>,
): boolean {
    const point = turf.point(coordinates);
    return turf.booleanPointInPolygon(point, zone);
}

/**
 * Computes the geodesic distance (metres) between two WGS84 coordinates.
 */
export function distanceBetween(
    from: Position,
    to: Position,
): number {
    const origin = turf.point(from);
    const destination = turf.point(to);
    return turf.distance(origin, destination, { units: 'meters' });
}

/**
 * Builds a circular geofence polygon from a centre point and radius.
 * @param centre - [lng, lat]
 * @param radiusMeters - radius in metres
 * @param steps - polygon resolution (default 64)
 */
export function buildCircularZone(
    centre: Position,
    radiusMeters: number,
    steps = 64,
): Feature<Polygon> {
    return turf.circle(centre, radiusMeters / 1000, { steps, units: 'kilometers' });
}

/**
 * Returns the bounding box of a GeoJSON feature as [minLng, minLat, maxLng, maxLat].
 */
export function getBoundingBox(
    zone: Feature<Polygon | MultiPolygon>,
): turf.BBox {
    return turf.bbox(zone);
}

/**
 * Calculates the area of a GeoJSON polygon in square metres.
 */
export function calculateAreaSqM(zone: Feature<Polygon | MultiPolygon>): number {
    return turf.area(zone);
}

/**
 * Validates that every coordinate in a GeoJSON polygon lies within valid WGS84 bounds.
 * noUncheckedIndexedAccess: use ! assertions — outer ring (index 0) and lng/lat
 * (indices 0,1) are always present in a valid Polygon.
 */
export function validateCoordinates(zone: Feature<Polygon>): boolean {
    const ring = zone.geometry.coordinates[0];
    if (!ring) return false;
    return ring.every((coord) => {
        const lng = coord[0]!;
        const lat = coord[1]!;
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    });
}

/**
 * Snaps a coordinate to the nearest edge of a polygon zone.
 */
export function snapToZoneBoundary(
    pointCoords: Position,
    zone: Feature<Polygon>,
): Position {
    const point = turf.point(pointCoords);
    const line = turf.polygonToLine(zone) as Feature<turf.LineString>;
    const snapped = turf.nearestPointOnLine(line, point);
    return snapped.geometry.coordinates;
}
