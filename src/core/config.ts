export const BATTLE_SERVER = Object.freeze({
    TICK_INTERVAL: 50,
});

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};