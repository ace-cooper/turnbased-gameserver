import { Database } from "../../core/database";
import { BattlePlayerTrait } from "./player.interface";
import { Socket } from "socket.io";
import { Prisma } from "@prisma/client";
import { PlayerAccount } from "../playerAccount/playerAccount.entity";

export type PlayerSocket = Socket;

export class Player extends Database.BaseEntity implements Prisma.PlayerUncheckedCreateInput {
    name: string;
    level?: number;
    exp?: number;
    hp?: number;
    rp?: number;
    def?: number;
    atk?: number;
    str?: number;
    agi?: number;
    end?: number;
    luk?: number;
    accountId: string;
    account?: PlayerAccount;
    PlayerWallet?: any;

    public static get repository() {
        return Database.getCurrentDBMX().player;
    }
}

export class PlayerBattleEntity implements BattlePlayerTrait {
    name: string;
    team: string;
    socket: PlayerSocket;
    ready: boolean;
    battleId: string;
    hp: number = 100;

    isNPC: boolean;

    constructor(public id: string, public token: string) {

    }

    public async attack(): Promise<{ name: string; damage: number; }> {
        const attacks = [
            { name: 'punch', damage: Math.floor(1 + Math.random() * 4.9) },
            { name: 'kick', damage: Math.floor(4 + Math.random() * 9.9) },
            { name: 'slap', damage: Math.floor(1 + Math.random() * 2.9) },
            { name: 'headbutt', damage: Math.floor(8 + Math.random() * 14.9) },
            { name: 'bite', damage: Math.floor(3 + Math.random() * 7.9) },
            { name: 'scratch', damage: Math.floor(1 + Math.random() * 3.9) },
            { name: 'throw', damage: Math.floor(2+ Math.random() * 5.9) },
            { name: 'spit', damage: Math.floor(Math.random() * 1.9) },
            { name: 'slam', damage: Math.floor(6 + Math.random() * 11.9) },
            { name: 'hug', damage: Math.floor(Math.random() * 1) }
        ];
        // TODO
        return attacks[Math.floor(Math.random() * attacks.length)];
    }
}
