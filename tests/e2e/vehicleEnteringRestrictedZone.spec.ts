import { test, expect } from '../../src/fixtures/testFixtures.js';
import { isPointInsideZone, buildCircularZone } from '../../src/utils/gis/geoJsonUtils.js';
import { interpolateRoute } from '../../src/utils/gis/coordinateCalculator.js';
import {
    findZonesContainingPoint,
    getRecentEventsForVehicle,
    cleanupTestVehicleData,
} from '../../src/db/spatialQueries.js';
import restrictedZoneCollection from '../fixtures/data/restrictedZone.json';
import vehicleRouteCollection from '../fixtures/data/vehicleRoute.json';
import type { Feature, Polygon, FeatureCollection, LineString } from 'geojson';

// ── Constants ──────────────────────────────────────────────────────────────────

const VEHICLE_ID = `test-vehicle-${Date.now()}`;
const ZONE_NAME = 'Downtown Restricted Zone';

// The JSON files are FeatureCollections — extract the first Feature
const restrictedZone = (restrictedZoneCollection as FeatureCollection<Polygon>).features[0] as Feature<Polygon>;
const vehicleRoute = (vehicleRouteCollection as FeatureCollection<LineString>).features[0] as Feature<LineString>;

// Non-null assertions are safe: the fixture always has these coordinates
const ENTRY_POINT = vehicleRoute.geometry.coordinates[0] as [number, number];
const INSIDE_POINT = vehicleRoute.geometry.coordinates[5] as [number, number];

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Vehicle Entering Restricted Zone', () => {
    test.beforeEach(async ({ mapPage }) => {
        await mapPage.goto();
    });

    test.afterAll(async () => {
        await cleanupTestVehicleData(`test-vehicle-%`);
    });

    // ── GIS layer ──────────────────────────────────────────────────────────────

    test('GIS: entry point is outside the restricted zone', () => {
        const zone = restrictedZone as Feature<Polygon>;
        const isInside = isPointInsideZone(ENTRY_POINT, zone);
        expect(isInside).toBe(false);
    });

    test('GIS: vehicle crosses into the restricted zone', () => {
        const zone = restrictedZone as Feature<Polygon>;
        const isInside = isPointInsideZone(INSIDE_POINT, zone);
        expect(isInside).toBe(true);
    });

    test('GIS: route interpolation produces correct number of waypoints', () => {
        const waypoints = interpolateRoute(ENTRY_POINT, INSIDE_POINT, 10);
        expect(waypoints).toHaveLength(11); // steps + 1
    });

    // ── API layer ──────────────────────────────────────────────────────────────

    test('API: geofence entry event is emitted when vehicle crosses boundary', async ({
        apiClient,
    }) => {
        // Simulate waypoints approaching and entering the zone
        const waypoints = interpolateRoute(ENTRY_POINT, INSIDE_POINT, 5);

        for (const waypoint of waypoints) {
            // Non-null assertions safe: interpolateRoute always returns [lng, lat] pairs
            const lng = waypoint[0]!;
            const lat = waypoint[1]!;
            await apiClient.updateVehiclePosition({
                vehicleId: VEHICLE_ID,
                latitude: lat,
                longitude: lng,
                speed: 50,
                heading: 90,
                timestamp: new Date().toISOString(),
            });
        }

        // Allow engine to process asynchronously
        await new Promise((r) => setTimeout(r, 2_000));

        const latestEvent = await apiClient.getLatestEventForVehicle(VEHICLE_ID);
        expect(latestEvent.eventType).toBe('ENTRY');
        expect(latestEvent.vehicleId).toBe(VEHICLE_ID);
    });

    // ── Database layer ─────────────────────────────────────────────────────────

    test('DB: PostGIS confirms vehicle is inside restricted zone', async () => {
        const [lng, lat] = INSIDE_POINT;
        const zones = await findZonesContainingPoint(lng, lat);
        const names = zones.map((z) => z.name);
        expect(names).toContain(ZONE_NAME);
    });

    test('DB: entry event is persisted to geofence_events table', async () => {
        const events = await getRecentEventsForVehicle(VEHICLE_ID, 5);
        const entryEvent = events.find((e) => e.eventType === 'ENTRY');
        expect(entryEvent).toBeDefined();
        expect(entryEvent?.vehicleId).toBe(VEHICLE_ID);
    });

    // ── UI / E2E layer ─────────────────────────────────────────────────────────

    test('UI: restricted zone is highlighted on map when vehicle enters', async ({
        page,
        mapPage,
    }) => {
        await mapPage.panToCoordinate(INSIDE_POINT[1], INSIDE_POINT[0]);

        // Expect the zone overlay to receive an "alert" class from the engine event
        const restrictedOverlay = page.locator('[data-testid="zone-overlay-restricted"]');
        await expect(restrictedOverlay).toHaveClass(/alert/, { timeout: 10_000 });
    });

    test('UI: alert banner appears when vehicle enters restricted zone', async ({
        page,
        mapPage,
    }) => {
        await mapPage.panToCoordinate(INSIDE_POINT[1], INSIDE_POINT[0]);

        const alertBanner = page.locator('[data-testid="geofence-alert-banner"]');
        await expect(alertBanner).toBeVisible({ timeout: 10_000 });
        await expect(alertBanner).toContainText('Restricted Zone');
    });
});
