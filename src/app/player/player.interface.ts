import { Socket } from "socket.io";

export interface BattlePlayerTrait {
    id: string;
    token: string;
    name: string;
    team: string;
    socket: Socket;
    ready: boolean;
    battleId: string;
    isNPC: boolean;
    hp: number;
}