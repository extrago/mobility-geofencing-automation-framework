import type { Feature, Polygon, MultiPolygon } from 'geojson';

// ── Shared ─────────────────────────────────────────────────────────────────────

export type GeofenceType = 'RESTRICTED' | 'SPEED_LIMIT' | 'TOLL' | 'CUSTOM';
export type EventType = 'ENTRY' | 'EXIT' | 'DWELL';

// ── Geofence Zone ──────────────────────────────────────────────────────────────

export interface GeofenceZone {
    id: string;
    name: string;
    type: GeofenceType;
    geometry: Feature<Polygon | MultiPolygon>;
    speedLimitKmh?: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateGeofencePayload {
    name: string;
    type: GeofenceType;
    geometry: Feature<Polygon | MultiPolygon>;
    speedLimitKmh?: number;
    alertOnEntry?: boolean;
    alertOnExit?: boolean;
}

// ── Geofence Events ────────────────────────────────────────────────────────────

export interface GeofenceEvent {
    id: string;
    vehicleId: string;
    geofenceId: string;
    eventType: EventType;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

export interface GeofenceEventQuery {
    vehicleId?: string;
    geofenceId?: string;
    eventType?: EventType;
    fromTimestamp?: string;
    toTimestamp?: string;
    limit?: number;
    offset?: number;
}

// ── Vehicle ────────────────────────────────────────────────────────────────────

export interface VehiclePosition {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: string;
}

// ── API Responses ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
