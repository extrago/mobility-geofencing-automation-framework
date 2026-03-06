import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
}

export const envConfig = {
    // Application
    baseUrl: process.env['BASE_URL'] ?? 'http://localhost:3000',
    apiBaseUrl: process.env['API_BASE_URL'] ?? 'http://localhost:4000/api/v1',

    // Authentication
    apiKey: process.env['API_KEY'] ?? '',

    // PostgreSQL / PostGIS
    db: {
        host: process.env['DB_HOST'] ?? 'localhost',
        port: Number(process.env['DB_PORT'] ?? 5432),
        database: process.env['DB_NAME'] ?? 'geofencing_db',
        user: process.env['DB_USER'] ?? 'postgres',
        password: requireEnv('DB_PASSWORD'),
        ssl: process.env['DB_SSL'] === 'true',
    },

    // Test configuration
    defaultTimeout: Number(process.env['DEFAULT_TIMEOUT'] ?? 30_000),
    logLevel: process.env['LOG_LEVEL'] ?? 'info',

    // Geofencing engine
    geofenceEngineUrl: process.env['GEOFENCE_ENGINE_URL'] ?? 'http://localhost:8080',
    vehicleSimulatorUrl: process.env['VEHICLE_SIMULATOR_URL'] ?? 'http://localhost:9090',
} as const;

export type EnvConfig = typeof envConfig;
