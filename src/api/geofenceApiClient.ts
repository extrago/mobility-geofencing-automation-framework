import axios, { AxiosInstance } from 'axios';

export class GeofenceApiClient {
    private http: AxiosInstance;

    constructor() {
        const baseURL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
        const apiKey = process.env.API_KEY || '';

        this.http = axios.create({
            baseURL: baseURL,
            timeout: Number(process.env.DEFAULT_TIMEOUT) || 30000,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'Authorization': apiKey ? `Bearer ${apiKey}` : ''
            }
        });

        this.http.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.status || error.message);
                return Promise.reject(error);
            }
        );
    }

    async createGeofence(payload: any) {
        const res = await this.http.post('/geofences', payload);
        return res.data;
    }

    async getGeofence(id: string) {
        const res = await this.http.get(`/geofences/${id}`);
        return res.data;
    }

    async listGeofences(): Promise<any[]> {
        const res = await this.http.get('/geofences');
        // Server returns paginated { data: [...], total, page, pageSize }
        return Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
    }

    async deleteGeofence(id: string) {
        const res = await this.http.delete(`/geofences/${id}`);
        return res.status;
    }

    async updateVehiclePosition(payload: any) {
        const res = await this.http.post('/vehicles/position', payload);
        return res.data;
    }

    async getLatestEventForVehicle(vehicleId: string) {
        const res = await this.http.get(`/events/vehicle/${vehicleId}/latest`);
        return res.data;
    }
}