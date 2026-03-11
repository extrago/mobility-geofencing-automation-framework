'use strict';

/**
 * Lightweight mock API server for the Mobility Geofencing Automation Framework.
 *
 * Listens on port 4000 (or process.env.PORT) and exposes the /api/v1 routes
 * that GeofenceApiClient and the Playwright test suite depend on.
 *
 * Uses only Node.js built-ins — no extra dependencies required.
 */

const http = require('http');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 4000);
const API_PREFIX = '/api/v1';

// ── In-memory stores ──────────────────────────────────────────────────────────
const geofences = new Map();
const events = new Map();   // keyed by event id
const vehicles = new Map();   // vehicleId → latest event

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

// ── Route handler ─────────────────────────────────────────────────────────────
async function handler(req, res) {
    const url = req.url || '/';
    const method = req.method || 'GET';
    const path = url.startsWith(API_PREFIX) ? url.slice(API_PREFIX.length) : url;

    // ── Health / readiness ──────────────────────────────────────────────────────
    if (path === '/' || path === '/health') {
        return send(res, 200, { status: 'ok', service: 'mobility-geofencing-api', ts: nowIso() });
    }

    // ── Geofences ───────────────────────────────────────────────────────────────

    // POST /geofences
    if (method === 'POST' && path === '/geofences') {
        const body = await readBody(req);
        const id = randomUUID();
        const zone = {
            id,
            name: body.name ?? 'Unnamed Zone',
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

    // GET /geofences
    if (method === 'GET' && path === '/geofences') {
        const list = [...geofences.values()];
        return send(res, 200, { data: list, total: list.length, page: 1, pageSize: list.length });
    }

    // GET /geofences/:id
    const geofenceMatch = path.match(/^\/geofences\/([^/]+)$/);
    if (method === 'GET' && geofenceMatch) {
        const zone = geofences.get(geofenceMatch[1]);
        if (!zone) return send(res, 404, { code: 'NOT_FOUND', message: 'Geofence not found' });
        return send(res, 200, zone);
    }

    // DELETE /geofences/:id
    if (method === 'DELETE' && geofenceMatch) {
        const id = geofenceMatch[1];
        if (!geofences.has(id)) return send(res, 404, { code: 'NOT_FOUND', message: 'Geofence not found' });
        geofences.delete(id);
        return send(res, 204, {});
    }

    // ── Events ──────────────────────────────────────────────────────────────────

    // POST /events  (ingest a geofence event)
    if (method === 'POST' && path === '/events') {
        const body = await readBody(req);
        const id = randomUUID();
        const event = {
            id,
            vehicleId: body.vehicleId ?? 'unknown',
            geofenceId: body.geofenceId ?? 'unknown',
            eventType: body.eventType ?? 'ENTRY',
            latitude: body.latitude ?? 0,
            longitude: body.longitude ?? 0,
            speed: body.speed ?? 0,
            heading: body.heading ?? 0,
            timestamp: body.timestamp ?? nowIso(),
            metadata: body.metadata ?? {},
        };
        events.set(id, event);
        vehicles.set(event.vehicleId, event);   // update latest for vehicle
        return send(res, 201, event);
    }

    // GET /events/vehicle/:vehicleId/latest
    const vehicleLatestMatch = path.match(/^\/events\/vehicle\/([^/]+)\/latest$/);
    if (method === 'GET' && vehicleLatestMatch) {
        const latest = vehicles.get(vehicleLatestMatch[1]);
        if (!latest) return send(res, 404, { code: 'NOT_FOUND', message: 'No events found for vehicle' });
        return send(res, 200, latest);
    }

    // GET /events?vehicleId=&geofenceId=&eventType=&limit=&offset=
    if (method === 'GET' && path.startsWith('/events')) {
        const qs = new URL(url, `http://localhost:${PORT}`).searchParams;
        let list = [...events.values()];
        if (qs.get('vehicleId')) list = list.filter(e => e.vehicleId === qs.get('vehicleId'));
        if (qs.get('geofenceId')) list = list.filter(e => e.geofenceId === qs.get('geofenceId'));
        if (qs.get('eventType')) list = list.filter(e => e.eventType === qs.get('eventType'));
        const limit = Number(qs.get('limit') || 50);
        const offset = Number(qs.get('offset') || 0);
        const paged = list.slice(offset, offset + limit);
        return send(res, 200, { data: paged, total: list.length, page: Math.floor(offset / limit) + 1, pageSize: limit });
    }

    // ── Default 404 ─────────────────────────────────────────────────────────────
    return send(res, 404, { code: 'NOT_FOUND', message: `Route not found: ${method} ${url}` });
}

// ── Start ─────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    handler(req, res).catch(err => {
        console.error('[server] Unhandled error:', err);
        send(res, 500, { code: 'INTERNAL_ERROR', message: 'Internal server error' });
    });
});

server.listen(PORT, () => {
    console.log(`[server] Mobility Geofencing API mock running on http://localhost:${PORT}`);
    console.log(`[server] API prefix: ${API_PREFIX}`);
});

server.on('error', err => {
    console.error('[server] Fatal:', err.message);
    process.exit(1);
});
