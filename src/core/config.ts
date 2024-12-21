export const BATTLE_SERVER = Object.freeze({
    TICK_INTERVAL: 50,
    PORT: 3000,
});

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const cacheAddresses = JSON.parse(process.env.CACHE_URL as string || '["redis://localhost:6379"]');

export enum Environment {
    DEV = 'DEV',
    STAGE = 'STAGE',
    PROD = 'PROD',
    TEST = 'TEST',
}

export const ENV: Environment = process.env.NODE_ENV as Environment || Environment.DEV;
export const ENV_CTX = process.env.ENV_CTX;
export const devMode = process.env.devMode == 'true';
export const throwErrors = process.env.throwErrors == 'true';

export const JWT_SECRET = process.env.JWT_SECRET;

export const DATABASE_URL = process.env.DATABASE_URL;

export const API_PORT = process.env.API_PORT || 30001;

export const CORS_WHITELIST = process.env.CORS_WHITELIST ? JSON.parse(process.env.CORS_WHITELIST) : '*';