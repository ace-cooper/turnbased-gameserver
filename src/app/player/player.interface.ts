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
    mhp: number;
    energy: number;
    menergy: number;
    mp: number;
    mmp: number
    str: number;
    agi: number;
    stm: number;
    active?: boolean;
}