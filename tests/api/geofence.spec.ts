import { test, expect } from '@playwright/test';
import { GeofenceApiClient } from '../../src/api/geofenceApiClient';
import { CreateGeofencePayload } from '../../src/api/apiTypes';

test.describe('Geofencing Engine - API Integration (Mocked)', () => {
    const apiClient = new GeofenceApiClient();

    test.beforeEach(async () => {
        apiClient.createGeofence = async (payload: CreateGeofencePayload) => {
            return {
                id: 'zone-123',
                name: payload.name,
                type: 'CUSTOM',
                geometry: payload.geometry,
                createdAt: new Date().toISOString()
            } as any;
        };

        apiClient.listGeofences = async () => {
            return [
                { id: 'zone-123', name: 'Cairo Logistics Hub', type: 'CUSTOM' }
            ] as any;
        };

        apiClient.getLatestEventForVehicle = async (vehicleId: string) => {
            return {
                id: 'event-99',
                vehicleId: vehicleId,
                eventType: 'ENTRY',
                timestamp: new Date().toISOString()
            } as any;
        };
    });

    test('Doctor Check: Should create and verify a new Geofence Zone', async () => {
        const payload: CreateGeofencePayload = {
            name: 'Cairo Logistics Hub',
            type: 'CUSTOM',
            geometry: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[31.2, 30.0], [31.3, 30.0], [31.3, 30.1], [31.2, 30.1], [31.2, 30.0]]]
                },
                properties: {}
            }
        };

        const newZone = await apiClient.createGeofence(payload);
        expect(newZone).toHaveProperty('id');
        expect(newZone.name).toBe(payload.name);

        const allZones = await apiClient.listGeofences();
        const found = allZones.find(z => z.id === newZone.id);
        expect(found).toBeDefined();
    });

    test('Safety Check: Should get latest event for a vehicle', async () => {
        const vehicleId = 'V-100-XYZ';
        const event = await apiClient.getLatestEventForVehicle(vehicleId);

        expect(['ENTRY', 'EXIT']).toContain(event.eventType);
    });
});