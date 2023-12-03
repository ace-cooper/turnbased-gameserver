import { Socket } from "socket.io";

export interface BattlePlayerTrait {
    id: string;
    name: string;
    team: string;
    socket: Socket;
    ready: boolean;
    battleId: string;
    hp: number;
}