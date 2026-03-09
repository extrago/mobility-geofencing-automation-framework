import { booleanPointInPolygon, point } from '@turf/turf';

export class GeoHelper {
    private constructor() {
        throw new Error('GeoHelper is a static utility class and cannot be instantiated.');
    }

    static isPointInsideGeofence(
        longitude: number,
        latitude: number,
        geojsonPolygon: any,
    ): boolean {
        if (longitude < -180 || longitude > 180) throw new RangeError('Invalid longitude');
        if (latitude < -90 || latitude > 90) throw new RangeError('Invalid latitude');

        if (geojsonPolygon === null || geojsonPolygon === undefined) {
            throw new TypeError('geojsonPolygon must not be null or undefined');
        }

        const geomType =
            geojsonPolygon.type === 'Feature'
                ? geojsonPolygon.geometry?.type
                : geojsonPolygon.type;

        if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
            throw new TypeError(
                `geojsonPolygon must be a Polygon or MultiPolygon Feature, got: ${geojsonPolygon.type}`,
            );
        }

        try {
            const turfPoint = point([longitude, latitude]);
            return booleanPointInPolygon(turfPoint, geojsonPolygon);
        } catch (err: unknown) {
            throw new Error(`GeoHelper failed: ${err}`);
        }
    }
}