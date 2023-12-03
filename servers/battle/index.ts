import { withCtx } from "../../src/core/context";
import { BATTLE_SERVER } from "../../src/core/config";
import { BattleTrait } from "../../src/app/battle/battle.interface";
import { battleService } from "../../src/app/battle/battle.service";
import { start as socketServerStart } from "./socket-gateway";
import { createServer } from "http";

let interval: NodeJS.Timeout;
let battleData: BattleTrait;
let tick = BigInt(0);

const setBattleData = async (data: BattleTrait) => {
    battleData = data;
};

const getBattleData = async () => {
    return battleData;
}

export const handler = async () => { 
    const done = await withCtx<boolean>({ tick }, async (ctx) => {
        if (tick%BigInt(300) === BigInt(0)) { 
            // log
            console.log('Battle server tick', tick.toString(), await getBattleData());
        }
        return false;
    });

    if (done) {
        clearInterval(interval);

        try {
            // log
            console.log('Battle server stopped after 100 ticks');
        } finally {
            return;
        }
    }

    // increment tick
    tick += BigInt(1);
};

export const start = async () => {
    // get battle ID
    const battleId = process.argv[2];
    try {
        if (!battleId) {
            throw new Error('Battle ID not provided');
        }
        console.log('Battle server started with ID', battleId);
        // get battle data
        battleData = await battleService.getBattle(battleId);
        const httpServer = createServer();
        // start socket server
        await withCtx({ battleId, tick, setBattleData, getBattleData }, async () => socketServerStart(httpServer));
        httpServer.listen(BATTLE_SERVER.PORT);
        console.log('Battle server listening on port', BATTLE_SERVER.PORT);
        // start event loop
        interval = setInterval(handler, BATTLE_SERVER.TICK_INTERVAL);
    } catch(e) {
        console.error('Battle server failed to start', e);
        // log
    }
};

export const stop = async () => {
    clearInterval(interval);
};

start();