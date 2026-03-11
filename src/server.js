'use strict';

/**
 * Mock API + Vehicle Simulator servers for the Mobility Geofencing CI pipeline.
 *
 * PORT 4000  → Geofencing REST API  (/api/v1/...)
 * PORT 9090  → Vehicle Simulator    (/telemetry, /simulate/entry)
 *
 * Uses only Node.js built-ins — no extra dependencies required.
 */

const http = require('http');
const { randomUUID } = require('crypto');

const API_PORT = Number(process.env.PORT || 4000);
const SIM_PORT = Number(process.env.SIM_PORT || 9090);
const API_PREFIX = '/api/v1';

// ── In-memory stores ──────────────────────────────────────────────────────────
const geofences = new Map();   // id → GeofenceZone
const events = new Map();   // id → GeofenceEvent
const vehicles = new Map();   // vehicleId → latest GeofenceEvent

// ── Helpers ───────────────────────────────────────────────────────────────────
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
            catch { resolve({}); }
        });
        req.on('error', reject);
    });
}

function send(res, statusCode, body) {
    const payload = JSON.stringify(body);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);
}

function nowIso() { return new Date().toISOString(); }

/**
 * Simple point-in-polygon test (ray-casting) for GeoJSON Polygon coordinates.
 * coords: array of [lng, lat] ring (first ring only)
 * point:  [lng, lat]
 */
function pointInPolygon(coords, lng, lat) {
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const [xi, yi] = coords[i];
        const [xj, yj] = coords[j];
        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Check if [lng, lat] is inside any stored geofence zone.
 * Returns the first matching zone or null.
 */
function detectZoneEntry(lng, lat) {
    for (const zone of geofences.values()) {
        if (!zone.active || !zone.geometry) continue;
        try {
            // geometry may be a GeoJSON Feature or a Geometry
            const geom = zone.geometry.geometry ?? zone.geometry;
            if (geom.type !== 'Polygon') continue;
            const ring = geom.coordinates[0];
            if (pointInPolygon(ring, lng, lat)) return zone;
        } catch { /* skip malformed */ }
    }
    return null;
}

// ── API Server (port 4000) ────────────────────────────────────────────────────

async function apiHandler(req, res) {
    const rawUrl = req.url || '/';
    const method = req.method || 'GET';
    const path = rawUrl.startsWith(API_PREFIX)
        ? rawUrl.slice(API_PREFIX.length)
        : rawUrl;

    // ── Health ──────────────────────────────────────────────────────────────────
    if (path === '/' || path === '/health') {
        return send(res, 200, { status: 'ok', service: 'geofencing-api', ts: nowIso() });
    }

    // ── Geofences ───────────────────────────────────────────────────────────────

    // POST /geofences — create a zone
    if (method === 'POST' && path === '/geofences') {
        const body = await readBody(req);
        if (!body.name || body.name.trim() === '') {
            return send(res, 400, { code: 'VALIDATION_ERROR', message: 'name is required' });
        }
        const id = randomUUID();
        const zone = {
            id,
            name: body.name,
            type: body.type ?? 'CUSTOM',
            geometry: body.geometry ?? null,
            speedLimitKmh: body.speedLimitKmh ?? null,
            active: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        geofences.set(id, zone);
        return send(res, 201, zone);
    }

    // GET /geofences — list all
    if (method === 'GET' && path === '/geofences') {
        const list = [...geofences.values()];
        return send(res, 200, { data: list, total: list.length, page: 1, pageSize: list.length });
    }

    // GET/DELETE /geofences/:id
    const geofenceMatch = path.match(/^\/geofences\/([^/?]+)(?:\?.*)?$/);
    if (geofenceMatch) {
        const id = geofenceMatch[1];
        if (method === 'GET') {
            const zone = geofences.get(id);
            if (!zone) return send(res, 404, { code: 'NOT_FOUND', message: 'Geofence not found' });
            return send(res, 200, zone);
        }
        if (method === 'DELETE') {
            if (!geofences.has(id)) return send(res, 404, { code: 'NOT_FOUND', message: 'Geofence not found' });
            geofences.delete(id);
            return send(res, 204, {});
        }
    }

    // ── Vehicle Positions ───────────────────────────────────────────────────────

    // POST /vehicles/position — ingest a raw position & auto-detect zone crossings
    if (method === 'POST' && path === '/vehicles/position') {
        const body = await readBody(req);
        const vehicleId = body.vehicleId ?? 'unknown';
        const lat = Number(body.latitude ?? 0);
        const lng = Number(body.longitude ?? 0);

        const matchedZone = detectZoneEntry(lng, lat);
        if (matchedZone) {
            const ev = {
                id: randomUUID(),
                vehicleId,
                geofenceId: matchedZone.id,
                eventType: 'ENTRY',
                latitude: lat,
                longitude: lng,
                speed: Number(body.speed ?? 0),
                heading: Number(body.heading ?? 0),
                timestamp: body.timestamp ?? nowIso(),
                metadata: {},
            };
            events.set(ev.id, ev);
            vehicles.set(vehicleId, ev);
            return send(res, 200, ev);
        }

        // No zone match — store a placeholder so polls see a valid location
        const ev = {
            id: randomUUID(),
            vehicleId,
            geofenceId: null,
            eventType: 'NONE',
            latitude: lat,
            longitude: lng,
            speed: Number(body.speed ?? 0),
            heading: Number(body.heading ?? 0),
            timestamp: body.timestamp ?? nowIso(),
            metadata: {},
        };
        events.set(ev.id, ev);
        vehicles.set(vehicleId, ev);
        return send(res, 200, ev);
    }

    // ── Events ──────────────────────────────────────────────────────────────────

    // POST /events
    if (method === 'POST' && path === '/events') {
        const body = await readBody(req);
        const id = randomUUID();
        const event = {
            id,
            vehicleId: body.vehicleId ?? 'unknown',
            geofenceId: body.geofenceId ?? null,
            eventType: body.eventType ?? 'ENTRY',
            latitude: Number(body.latitude ?? 0),
            longitude: Number(body.longitude ?? 0),
            speed: Number(body.speed ?? 0),
            heading: Number(body.heading ?? 0),
            timestamp: body.timestamp ?? nowIso(),
            metadata: body.metadata ?? {},
        };
        events.set(id, event);
        vehicles.set(event.vehicleId, event);
        return send(res, 201, event);
    }

    // GET /events/vehicle/:vehicleId/latest
    const vehicleLatestMatch = path.match(/^\/events\/vehicle\/([^/?]+)\/latest$/);
    if (method === 'GET' && vehicleLatestMatch) {
        const latest = vehicles.get(vehicleLatestMatch[1]);
        if (!latest) {
            // 400 — vehicle not known / out-of-range coordinates (matches negative test expectation)
            return send(res, 400, { code: 'BAD_REQUEST', message: 'No data found for vehicle' });
        }
        return send(res, 200, latest);
    }

    // GET /events?vehicleId=&...
    if (method === 'GET' && path.startsWith('/events')) {
        const qs = new URL(rawUrl, `http://localhost:${API_PORT}`).searchParams;
        let list = [...events.values()];
        if (qs.get('vehicleId')) list = list.filter(e => e.vehicleId === qs.get('vehicleId'));
        if (qs.get('geofenceId')) list = list.filter(e => e.geofenceId === qs.get('geofenceId'));
        if (qs.get('eventType')) list = list.filter(e => e.eventType === qs.get('eventType'));
        const limit = Number(qs.get('limit') || 50);
        const offset = Number(qs.get('offset') || 0);
        const paged = list.slice(offset, offset + limit);
        return send(res, 200, { data: paged, total: list.length, page: Math.floor(offset / limit) + 1, pageSize: limit });
    }

    return send(res, 404, { code: 'NOT_FOUND', message: `Route not found: ${method} ${rawUrl}` });
}

// ── Simulator Server (port 9090) ──────────────────────────────────────────────

async function simHandler(req, res) {
    const rawUrl = req.url || '/';
    const method = req.method || 'GET';

    // POST /telemetry — vehicle location update; auto-creates an event if inside a zone
    if (method === 'POST' && rawUrl === '/telemetry') {
        const body = await readBody(req);
        const vehicleId = body.vehicleId ?? 'unknown';
        const lat = Number(body.location?.lat ?? body.lat ?? 0);
        const lng = Number(body.location?.lng ?? body.lng ?? 0);

        const matchedZone = detectZoneEntry(lng, lat);
        const ev = {
            id: randomUUID(),
            vehicleId,
            geofenceId: matchedZone?.id ?? null,
            eventType: matchedZone ? 'ENTRY' : 'NONE',
            latitude: lat,
            longitude: lng,
            speed: Number(body.speed ?? 0),
            heading: Number(body.heading ?? 0),
            timestamp: body.timestamp ?? nowIso(),
            metadata: {},
        };
        events.set(ev.id, ev);
        vehicles.set(vehicleId, ev);
        return send(res, 200, { status: 'received', event: ev });
    }

    // POST /simulate/entry — force an ENTRY event for a vehicle+zone pair
    if (method === 'POST' && rawUrl === '/simulate/entry') {
        const body = await readBody(req);
        const vehicleId = body.vehicleId ?? 'unknown';
        const geofenceId = body.zoneId ?? body.geofenceId ?? null;
        const ev = {
            id: randomUUID(),
            vehicleId,
            geofenceId,
            eventType: 'ENTRY',
            latitude: 0,
            longitude: 0,
            speed: 0,
            heading: 0,
            timestamp: nowIso(),
            metadata: {},
        };
        events.set(ev.id, ev);
        vehicles.set(vehicleId, ev);
        return send(res, 200, ev);
    }

    // Health check
    if (rawUrl === '/health' || rawUrl === '/') {
        return send(res, 200, { status: 'ok', service: 'vehicle-simulator' });
    }

    return send(res, 404, { code: 'NOT_FOUND', message: `Simulator route not found: ${method} ${rawUrl}` });
}

// ── Start both servers ────────────────────────────────────────────────────────

function createServer(handler, port, name) {
    const server = http.createServer((req, res) => {
        handler(req, res).catch(err => {
            console.error(`[${name}] Unhandled error:`, err);
            try { send(res, 500, { code: 'INTERNAL_ERROR', message: 'Internal server error' }); } catch { }
        });
    });
    server.listen(port, () => {
        console.log(`[${name}] running on http://localhost:${port}`);
    });
    server.on('error', err => {
        console.error(`[${name}] Fatal:`, err.message);
        process.exit(1);
    });
    return server;
}

createServer(apiHandler, API_PORT, 'api-server');
createServer(simHandler, SIM_PORT, 'sim-server');

console.log('[server] API prefix: ' + API_PREFIX);
