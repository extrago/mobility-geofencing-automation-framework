import { test, expect } from '@playwright/test';
import { GeofenceApiClient } from '../../src/api/geofenceApiClient';
import { GeoHelper } from '../../src/utils/gis/geoHelper';

test.describe('Geofencing Boundary Analytics', () => {
    const apiClient = new GeofenceApiClient();

    const boundaryTestCases = [
        { name: 'Clearly Inside', lat: 30.05, lng: 31.25, expected: true },
        { name: 'Clearly Outside', lat: 30.20, lng: 31.40, expected: false },
        { name: 'On Vertex (Edge)', lat: 30.0, lng: 31.2, expected: true }
    ];

    test.beforeEach(async () => {
        apiClient.getGeofence = async () => ({
            id: 'zone-123',
            geometry: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[31.2, 30.0], [31.3, 30.0], [31.3, 30.1], [31.2, 30.1], [31.2, 30.0]]]
                }
            }
        } as any);

        apiClient.getLatestEventForVehicle = async (_vehicleId) => ({
            eventType: 'ENTRY'
        } as any);
    });

    for (const data of boundaryTestCases) {
        test(`Scenario: ${data.name}`, async () => {
            const zoneResponse = await apiClient.getGeofence('zone-123');

            const isInside = GeoHelper.isPointInsideGeofence(
                data.lng,
                data.lat,
                zoneResponse.geometry
            );

            expect(isInside).toBe(data.expected);
        });
    }
});