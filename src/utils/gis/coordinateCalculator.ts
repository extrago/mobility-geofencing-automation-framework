import type { Position } from 'geojson';

/** Converts decimal degrees to radians. */
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Earth radius in metres (WGS84 mean). */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Haversine formula — great-circle distance in metres.
 * Useful as a lightweight alternative to @turf/turf for simple distance checks.
 */
export function haversineDistance(from: Position, to: Position): number {
    // Non-null assertions are safe: GeoJSON Position always has at least [lng, lat]
    const lng1 = from[0]!;
    const lat1 = from[1]!;
    const lng2 = to[0]!;
    const lat2 = to[1]!;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the bearing (degrees, 0–360) from origin to destination.
 */
export function bearingTo(from: Position, to: Position): number {
    const lat1Rad = toRad(from[1]!);
    const lng1Rad = toRad(from[0]!);
    const lat2Rad = toRad(to[1]!);
    const lng2Rad = toRad(to[0]!);

    const y = Math.sin(lng2Rad - lng1Rad) * Math.cos(lat2Rad);
    const x =
        Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lng2Rad - lng1Rad);

    const theta = Math.atan2(y, x);
    return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Projects a point {origin} by {distanceM} metres in {bearing} degrees.
 * Returns new [lng, lat] position.
 */
export function projectPoint(
    origin: Position,
    distanceM: number,
    bearing: number,
): Position {
    const lng = toRad(origin[0]!);
    const lat = toRad(origin[1]!);
    const bearingRad = toRad(bearing);
    const d = distanceM / EARTH_RADIUS_M;

    const newLat = Math.asin(
        Math.sin(lat) * Math.cos(d) +
        Math.cos(lat) * Math.sin(d) * Math.cos(bearingRad),
    );

    const newLng =
        lng +
        Math.atan2(
            Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat),
            Math.cos(d) - Math.sin(lat) * Math.sin(newLat),
        );

    return [(newLng * 180) / Math.PI, (newLat * 180) / Math.PI];
}

/**
 * Interpolates N evenly-spaced waypoints along a straight-line route.
 * Useful for simulating vehicle movement in test scenarios.
 */
export function interpolateRoute(
    from: Position,
    to: Position,
    steps: number,
): Position[] {
    const fromLng = from[0]!;
    const fromLat = from[1]!;
    const toLng = to[0]!;
    const toLat = to[1]!;

    return Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        return [
            fromLng + (toLng - fromLng) * t,
            fromLat + (toLat - fromLat) * t,
        ] as Position;
    });
}

/**
 * Converts a DMS string like "48°51'30.12\"N" to decimal degrees.
 */
export function dmsToDecimal(dms: string): number {
    const match = dms.match(/(\d+)°(\d+)'([\d.]+)"([NSEW])/);
    if (!match) throw new Error(`Invalid DMS format: "${dms}"`);
    // match[0] is the full match; named elements start at index 1
    const deg = match[1]!;
    const min = match[2]!;
    const sec = match[3]!;
    const dir = match[4]!;
    const decimal = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
    return ['S', 'W'].includes(dir) ? -decimal : decimal;
}
