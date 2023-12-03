import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { BattleTrait } from "../../src/app/battle/battle.interface";
import { BattlePlayerTrait } from "../../src/app/player/player.interface";
import { getCtx, getCtxData, withCtx } from "../../src/core/context";
import { loadClasses, INPUT_LAYER_NAME_PATTERNS } from "../../src/core/core";
import path from "path";

const gateways = loadClasses(path.resolve(__dirname, '../../src/app'), INPUT_LAYER_NAME_PATTERNS.GATEWAY);

export const start = async (httpServer: HttpServer) => {
    const io = new SocketIOServer(httpServer);
    const ctx = getCtx();
  
    const getBattleData = await ctx.get('getBattleData');
    const battleData = await getBattleData();

    const setBattleData = await ctx.get('setBattleData');
    io.use(async (socket, next) => {
        try {
            const authToken = socket.handshake.headers.token as string; 
            
            if (isValidPlayer(authToken, battleData)) {
                setupPlayer(socket, battleData, setBattleData);
                return next();
            }

            return next(new Error("Invalid player"));
        } catch (error) {
            console.log(error);
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket: Socket) => {
        console.log("A player connected", socket.id);

        socket.on("action", (actionData) => {
            try {   
                withCtx({ getBattleData, setBattleData, playerSocket: socket }, () => handlePlayerAction(socket, typeof actionData == 'object' ? actionData : JSON.parse(actionData)));
            } catch(e) {
                console.log(e);
            }
        });

        socket.on("disconnect", () => {
            console.log("A player disconnected", socket.id);
        });
    });
};

const isValidPlayer = (playerId: string, battleData: BattleTrait): boolean => {
    for (const team of battleData.teams) {
        const player = team.players.find((p: BattlePlayerTrait) => p.id === playerId);
        if (player) {
            return true;
        }
    }
    return false;
};

const setupPlayer = async (socket: Socket, battleData: BattleTrait, setBattleData: (data) => Promise<void>) => {
    const authToken = socket.handshake.headers.token as string; 

    for (const i in battleData.teams) {
        if (battleData.teams[i].players[0].id === authToken && !battleData.teams[i].players[0].ready) {
            battleData.teams[i].players[0].socket = socket;
            battleData.teams[i].players[0].ready = true;
            await setBattleData(battleData);
            return;
        }
    }
}

const handlePlayerAction = async (socket: Socket, actionData: any) => {
    console.log(`Action received from ${socket.id}:`, actionData);

    const gatewayName = Object.keys(actionData)[0];

    if (gatewayName && gateways[gatewayName]) {
        try {
            const actionName = Object.keys(actionData[gatewayName])[0];

            if (actionName && gateways[gatewayName][actionName]) {

                gateways[gatewayName][actionName](actionData[gatewayName][actionName]);

            }
        } catch(e) {
            console.log(e);
        }
    }
};
