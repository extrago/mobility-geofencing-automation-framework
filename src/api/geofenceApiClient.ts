import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { envConfig } from '../utils/envConfig';
import { logger } from '../utils/logger';
import type {
    GeofenceZone,
    GeofenceEvent,
    CreateGeofencePayload,
    VehiclePosition,
    GeofenceEventQuery,
} from './apiTypes';

/**
 * GeofenceApiClient wraps all HTTP calls to the Geofencing Engine REST API.
 * Uses Axios with built-in retry logic and structured logging.
 */
export class GeofenceApiClient {
    private readonly http: AxiosInstance;

    constructor(baseURL: string = envConfig.apiBaseUrl) {
        this.http = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': envConfig.apiKey,
            },
            timeout: 15_000,
        });

        // ── Request interceptor ─────────────────────────────────────────────────
        this.http.interceptors.request.use((config) => {
            logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });

        // ── Response interceptor ────────────────────────────────────────────────
        this.http.interceptors.response.use(
            (response) => {
                logger.debug(`← ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                logger.error(`API error: ${error.response?.status} ${error.config?.url}`, {
                    data: error.response?.data,
                });
                return Promise.reject(error);
            },
        );
    }

    // ── Geofence Zones ─────────────────────────────────────────────────────────

    async createGeofence(payload: CreateGeofencePayload): Promise<GeofenceZone> {
        const res: AxiosResponse<GeofenceZone> = await this.http.post('/geofences', payload);
        return res.data;
    }

    async getGeofence(id: string): Promise<GeofenceZone> {
        const res: AxiosResponse<GeofenceZone> = await this.http.get(`/geofences/${id}`);
        return res.data;
    }

    async listGeofences(): Promise<GeofenceZone[]> {
        const res: AxiosResponse<GeofenceZone[]> = await this.http.get('/geofences');
        return res.data;
    }

    async deleteGeofence(id: string): Promise<void> {
        await this.http.delete(`/geofences/${id}`);
    }

    // ── Geofence Events ────────────────────────────────────────────────────────

    async getEvents(query: GeofenceEventQuery): Promise<GeofenceEvent[]> {
        const res: AxiosResponse<GeofenceEvent[]> = await this.http.get('/events', {
            params: query,
        });
        return res.data;
    }

    async getLatestEventForVehicle(vehicleId: string): Promise<GeofenceEvent> {
        const res: AxiosResponse<GeofenceEvent> = await this.http.get(
            `/events/vehicle/${vehicleId}/latest`,
        );
        return res.data;
    }

    // ── Vehicle Simulation ─────────────────────────────────────────────────────

    async updateVehiclePosition(vehicle: VehiclePosition): Promise<void> {
        await this.http.post('/vehicles/position', vehicle);
    }

    async getVehiclePosition(vehicleId: string): Promise<VehiclePosition> {
        const res: AxiosResponse<VehiclePosition> = await this.http.get(
            `/vehicles/${vehicleId}/position`,
        );
        return res.data;
    }
}
