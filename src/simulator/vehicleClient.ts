import axios, { AxiosInstance } from 'axios';

export class VehicleSimulatorClient {
    private http: AxiosInstance;

    constructor() {
        this.http = axios.create({
            baseURL: process.env.VEHICLE_SIMULATOR_URL || 'http://localhost:9090',
            timeout: 5000
        });
    }

    async updateLocation(vehicleId: string, lat: number, lng: number) {
        const res = await this.http.post('/telemetry', {
            vehicleId,
            location: { lat, lng },
            timestamp: new Date().toISOString()
        });
        return res.status === 200;
    }

    async triggerEntry(vehicleId: string, zoneId: string) {
        const res = await this.http.post('/simulate/entry', { vehicleId, zoneId });
        return res.data;
    }
}