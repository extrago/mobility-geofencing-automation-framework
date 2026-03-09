import { test, expect } from '@playwright/test';
import { GeofenceApiClient } from '../../src/api/geofenceApiClient';
import { VehicleSimulatorClient } from '../../src/simulator/vehicleClient';

test.describe('Alexandria Port: Dynamic Trajectory Simulation', () => {
    const apiClient = new GeofenceApiClient();
    const simulator = new VehicleSimulatorClient();

    test('Full Journey: Track Vehicle from Main Gate to Cargo Dock', async () => {
        // 1. تعريف المسار (نقاط GPS حقيقية لميناء إسكندرية)
        const alexandriaRoute = [
            { name: 'Main Gate', lat: 31.185, lng: 29.855 },
            { name: 'Customs Checkpoint', lat: 31.192, lng: 29.862 },
            { name: 'Container Terminal', lat: 31.198, lng: 29.868 },
            { name: 'Final Loading Dock', lat: 31.201, lng: 29.870 }
        ];

        const vehicleId = `TRUCK-ALX-${Math.floor(Math.random() * 1000)}`;

        // 2. محاكاة الحركة نقطة بنقطة
        for (const point of alexandriaRoute) {
            console.log(`Moving vehicle ${vehicleId} to: ${point.name}`);

            // تحديث مكان العربية في الـ Simulator
            await simulator.updateLocation(vehicleId, point.lat, point.lng);

            // 3. التحقق (Polling) إن الـ API لقط الإحداثيات الجديدة
            await test.step(`Verify tracking at ${point.name}`, async () => {
                await expect.poll(async () => {
                    const event = await apiClient.getLatestEventForVehicle(vehicleId);
                    return event.latitude;
                }, {
                    intervals: [1000, 2000],
                    timeout: 10000
                }).toBe(point.lat);
            });
        }
    });
});