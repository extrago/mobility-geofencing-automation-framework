import { test, expect } from '../../src/fixtures/testFixtures';
import { buildCircularZone, isPointInsideZone } from '../../src/utils/gis/geoJsonUtils';
import { cleanupTestVehicleData } from '../../src/db/spatialQueries';
import type { GeofenceZone, CreateGeofencePayload } from '../../src/api/apiTypes';

const TEST_CENTRE: [number, number] = [37.6173, 55.7558]; // Moscow city centre
const RADIUS_M = 500;
const VEHICLE_ID = `test-geofence-activation-${Date.now()}`;

test.describe('Geofence Activation and Deactivation', () => {
    let createdZone: GeofenceZone;

    test.afterAll(async () => {
        await cleanupTestVehicleData(`test-geofence-activation-%`);
    });

    test('API: can create a circular geofence zone and receive an ID', async ({
        apiClient,
        geofencePanel,
        mapPage,
    }) => {
        const circularGeometry = buildCircularZone(TEST_CENTRE, RADIUS_M);
        const payload: CreateGeofencePayload = {
            name: 'Test Circular Zone',
            type: 'RESTRICTED',
            geometry: circularGeometry,
            alertOnEntry: true,
            alertOnExit: true,
        };

        createdZone = await apiClient.createGeofence(payload);
        expect(createdZone.id).toBeTruthy();
        expect(createdZone.active).toBe(true);
    });

    test('API: the created zone is returned in the zone list', async ({ apiClient }) => {
        const zones = await apiClient.listGeofences();
        const found = zones.find((z) => z.id === createdZone.id);
        expect(found).toBeDefined();
    });

    test('GIS: point at zone centre is confirmed inside the zone', async () => {
        const geometry = buildCircularZone(TEST_CENTRE, RADIUS_M);
        const inside = isPointInsideZone(TEST_CENTRE, geometry);
        expect(inside).toBe(true);
    });

    test('GIS: point 1 km away is confirmed outside the zone', async () => {
        const farPoint: [number, number] = [TEST_CENTRE[0] + 0.015, TEST_CENTRE[1]];
        const geometry = buildCircularZone(TEST_CENTRE, RADIUS_M);
        const inside = isPointInsideZone(farPoint, geometry);
        expect(inside).toBe(false);
    });

    test('UI: created zone appears on the map after creation', async ({
        page,
        mapPage,
    }) => {
        await mapPage.goto();
        await mapPage.panToCoordinate(TEST_CENTRE[1], TEST_CENTRE[0]);
        const zoneMarker = page.locator(`[data-testid="zone-marker-${createdZone.id}"]`);
        await expect(zoneMarker).toBeVisible({ timeout: 10_000 });
    });

    test('API: can delete the created zone', async ({ apiClient }) => {
        await apiClient.deleteGeofence(createdZone.id);
        const zones = await apiClient.listGeofences();
        const found = zones.find((z) => z.id === createdZone.id);
        expect(found).toBeUndefined();
    });
});
