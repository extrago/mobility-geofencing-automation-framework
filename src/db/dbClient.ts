import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { envConfig } from '../utils/envConfig';
import { logger } from '../utils/logger';

/**
 * Singleton PostgreSQL/PostGIS connection pool.
 * Use `DbClient.getInstance()` to access the shared pool.
 */
export class DbClient {
    private static instance: DbClient;
    private pool: Pool;

    private constructor() {
        this.pool = new Pool({
            host: envConfig.db.host,
            port: envConfig.db.port,
            database: envConfig.db.database,
            user: envConfig.db.user,
            password: envConfig.db.password,
            ssl: envConfig.db.ssl ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });

        this.pool.on('error', (err) => {
            logger.error('Unexpected DB pool error', err);
        });
    }

    static getInstance(): DbClient {
        if (!DbClient.instance) {
            DbClient.instance = new DbClient();
        }
        return DbClient.instance;
    }

    /**
     * Executes a parameterised query and returns all rows.
     */
    async query<T extends QueryResultRow = QueryResultRow>(
        sql: string,
        params?: unknown[],
    ): Promise<T[]> {
        const client: PoolClient = await this.pool.connect();
        try {
            logger.debug(`DB query: ${sql.slice(0, 120)}`);
            const result: QueryResult<T> = await client.query(sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Executes multiple queries within a single transaction.
     */
    async transaction<T>(
        callback: (client: PoolClient) => Promise<T>,
    ): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (err) {
            await client.query('ROLLBACK');
            logger.error('Transaction rolled back', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
        logger.info('DB pool closed');
    }
}
