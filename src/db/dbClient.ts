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
}