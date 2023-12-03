import { withCtx } from "../../src/core/context";
import { BATTLE_SERVER } from "../../src/core/config";

let interval: NodeJS.Timeout;

let tick = BigInt(0);
export const handler = async () => { 
    const done = await withCtx<boolean>({ tick }, async (ctx) => {
        
        return tick >= BigInt(100);
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

    // get battle data

    // start socket server

    // start event loop
    interval = setInterval(handler, BATTLE_SERVER.TICK_INTERVAL);
};

export const stop = async () => {
    clearInterval(interval);
};

start();