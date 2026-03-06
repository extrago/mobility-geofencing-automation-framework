import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return stack
        ? `[${ts}] ${level}: ${message}\n${stack}`
        : `[${ts}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: combine(timestamp(), winston.format.json()),
        }),
    ],
});
