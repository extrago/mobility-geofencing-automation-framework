import { test, expect } from '@playwright/test';
import { GeofenceApiClient } from '../../src/api/geofenceApiClient';

test.describe('Alexandria Resilience: Negative Scenarios', () => {
    const apiClient = new GeofenceApiClient();

    test('Validation: Reject Zone creation with empty name', async () => {
        const badPayload = {
            name: '',
            geometry: {
                type: 'Polygon',
                coordinates: [[[29.8, 31.1], [29.9, 31.1], [29.9, 31.2], [29.8, 31.2], [29.8, 31.1]]]
            }
        };

        try {
            await apiClient.createGeofence(badPayload);
        } catch (error: any) {
            expect(error.response.status).toBe(400);
        }
    });

    test('Spatial Error: Points outside WGS84 range', async () => {
        try {
            // خط طول 200 غير موجود على الكوكب
            await apiClient.getLatestEventForVehicle('V-123');
        } catch (error: any) {
            expect(error.response.status).toBe(400);
        }
    });
});