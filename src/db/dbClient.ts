import { Pool, QueryResult } from 'pg';

export class DbClient {
    private static pool: Pool;

    private constructor() {
        if (!DbClient.pool) {
            DbClient.pool = new Pool({
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT),
                database: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
        }
    }

    public static async query(text: string, params?: any[]): Promise<QueryResult> {
        new DbClient();
        const start = Date.now();
        try {
            const res = await DbClient.pool.query(text, params);
            return res;
        } catch (error) {
            throw new Error(`Database Query Failed: ${error}`);
        }
    }

    public static async getGeofenceSpatialData(zoneId: string) {
        const sql = `
            SELECT id, name, type, ST_AsGeoJSON(geometry)::json as geometry 
            FROM geofences 
            WHERE id = $1
        `;
        const res = await this.query(sql, [zoneId]);
        return res.rows[0];
    }

    public static async close() {
        if (DbClient.pool) {
            await DbClient.pool.end();
        }
    }
}