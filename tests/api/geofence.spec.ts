import { test, expect } from '@playwright/test';
import { GeofenceApiClient } from '../../src/api/geofenceApiClient';
import { DbClient } from '../../src/db/dbClient';
import { VehicleSimulatorClient } from '../../src/simulator/vehicleClient';

test.describe('Alexandria Port: End-to-End Mobility Lifecycle', () => {
    const apiClient = new GeofenceApiClient();
    const simulator = new VehicleSimulatorClient();

    test.afterAll(async () => {
        await DbClient.close();
    });

    test('Industry Scenario: Alexandria Logistics Zone Persistence and Tracking', async () => {
        const zonePayload = {
            name: 'Alexandria Port Logistics Hub',
            type: 'CUSTOM',
            geometry: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[29.85, 31.18], [29.88, 31.18], [29.88, 31.21], [29.85, 31.21], [29.85, 31.18]]]
                },
                properties: {}
            }
        };

        const zone = await apiClient.createGeofence(zonePayload);
        const zoneId = zone.id;

        expect(zoneId).toBeDefined();

        const dbCheck = await DbClient.getGeofenceSpatialData(zoneId);
        expect(dbCheck).toBeDefined();
        expect(dbCheck.name).toBe(zonePayload.name);

        const vehicleId = `V-ALX-${Math.floor(Math.random() * 9999)}`;
        const alexPortLat = 31.195;
        const alexPortLng = 29.865;

        await simulator.updateLocation(vehicleId, alexPortLat, alexPortLng);

        await test.step('Verify Event Generation for Alexandria Zone', async () => {
            await expect.poll(async () => {
                const event = await apiClient.getLatestEventForVehicle(vehicleId);
                return event.eventType;
            }, {
                intervals: [1000, 2000],
                timeout: 10000
            }).toBe('ENTRY');
        });
    });
});