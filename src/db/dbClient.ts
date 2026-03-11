import { Pool, QueryResult } from 'pg';

export class DbClient {
    private static instance: DbClient;
    private pool: Pool;

    private constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });
    }

    public static getInstance(): DbClient {
        if (!DbClient.instance) {
            DbClient.instance = new DbClient();
        }
        return DbClient.instance;
    }

    public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
        try {
            const result = await this.pool.query(text, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Database Query Failed: ${error}`);
        }
    }

    public async close() {
        await this.pool.end();
    }

    // ── Static convenience helpers used by test specs ──────────────────────────

    /**
     * Fetches a geofence zone record from the DB by ID.
     * Used by geofence.spec.ts which calls DbClient.getGeofenceSpatialData(id).
     */
    public static async getGeofenceSpatialData(id: string): Promise<any> {
        const db = DbClient.getInstance();
        const rows = await db.query(
            `SELECT id, name, type, ST_AsGeoJSON(geometry)::json AS geometry, active
             FROM geofence_zones WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    }

    /**
     * Static wrapper so tests can call `DbClient.close()` without holding a reference
     * to the singleton instance.
     */
    public static async close(): Promise<void> {
        if (DbClient.instance) {
            await DbClient.instance.pool.end();
        }
    }
}