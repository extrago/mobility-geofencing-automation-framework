import { test, expect } from '@playwright/test';
// Relative path required: Playwright's esbuild runtime does NOT resolve tsconfig `paths` aliases.
// Use '@/' alias only inside src/ files compiled via tsc — not directly in spec files.
import { GeoHelper } from '@/utils/gis/geoHelper.js';

test.describe('GeoHelper Spatial Logic', () => {

    const cairoZone = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [31.20, 30.00], [31.30, 30.00],
                [31.30, 30.10], [31.20, 30.10],
                [31.20, 30.00],
            ]],
        },
    };

    test('should return true if vehicle is inside Cairo Zone', () => {
        const isInside = GeoHelper.isPointInsideGeofence(31.25, 30.05, cairoZone);
        expect(isInside).toBe(true);
    });

    test('should return false if vehicle is outside Cairo Zone', () => {
        const isInside = GeoHelper.isPointInsideGeofence(31.50, 30.50, cairoZone);
        expect(isInside).toBe(false);
    });

    test('should throw RangeError for longitude > 180', () => {
        expect(() => GeoHelper.isPointInsideGeofence(200, 30, cairoZone)).toThrow(RangeError);
    });

    test('should throw RangeError for latitude > 90', () => {
        expect(() => GeoHelper.isPointInsideGeofence(31.25, 95, cairoZone)).toThrow(RangeError);
    });

    test('should throw TypeError for null polygon', () => {
        expect(() => GeoHelper.isPointInsideGeofence(31.25, 30.05, null)).toThrow(TypeError);
    });

    test('should throw TypeError for polygon with wrong type', () => {
        expect(() =>
            GeoHelper.isPointInsideGeofence(31.25, 30.05, { type: 'FeatureCollection', features: [] }),
        ).toThrow(TypeError);
    });
});
