export const BATTLE_SERVER = Object.freeze({
    TICK_INTERVAL: 50,
    PORT: 3000,
});

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const cacheAddresses = JSON.parse(process.env.CACHE_URL as string || '["redis://localhost:6379"]');
