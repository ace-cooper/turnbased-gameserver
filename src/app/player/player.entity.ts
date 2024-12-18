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
    stm?: number;
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
    energy: number = 50;
    mp: number = 4;
    str: number = 6;
    agi: number = 6;
    stm: number = 6;
    mhp: number;
    menergy: number;
    mmp: number;

    isNPC: boolean;

    constructor(public id: string, public token: string) {
        this.mhp = this.str * 20;
        this.menergy = this.stm * 10;
        this.mmp = Math.min(Math.ceil(this.agi / 3), 10);
        this.resetMp();
    }

    public resetMp() {
        this.mp = this.mmp;
    }


    public async attack(): Promise<{ name: string; damage: number; mp: number; energy: number; }> {
        const attacks = [
            { name: 'punch', damage: Math.floor(1 + Math.random() * 4.9), mp: 1, energy: 1 },
            { name: 'kick', damage: Math.floor(4 + Math.random() * 9.9), mp: 2, energy: 2 },
            { name: 'slap', damage: Math.floor(1 + Math.random() * 2.9), mp: 1, energy: 1 },
            { name: 'headbutt', damage: Math.floor(8 + Math.random() * 14.9), mp: 3, energy: 3 },
            { name: 'bite', damage: Math.floor(3 + Math.random() * 7.9), mp: 2, energy: 2 },
            { name: 'scratch', damage: Math.floor(1 + Math.random() * 3.9), mp: 1, energy: 1 },
            { name: 'throw', damage: Math.floor(2+ Math.random() * 5.9), mp: 1, energy: 1 },
            { name: 'spit', damage: Math.floor(Math.random() * 1.9), mp: 1, energy: 1 },
            { name: 'slam', damage: Math.floor(6 + Math.random() * 11.9), mp: 2, energy: 2 },
            { name: 'hug', damage: Math.floor(Math.random() * 1), mp: 1, energy: 1 },
        ].filter(attack => attack.mp <= this.mp && attack.energy <= this.energy);

        if (attacks.length === 0) {
            return null;
        }
        // TODO
        return attacks[Math.floor(Math.random() * attacks.length)];
    }

    public async defend(): Promise<{ 
        name: string; 
        accuracy: number; 
        mp: number;
        energy: number;
        fail: {
            damage_factor: number;
            mp: number;

        }; 
        success: {
            damage_factor: number;
            mp: number;
            energy: number;
            return_damage_factor: number;
            return_mp_damage: number;
        };
    }> {
        const defenses = [
            { name: 'dodge', accuracy: 0.2, mp: 1, energy: 2, fail: { damage_factor: 1.5, mp: 1 }, success: { damage_factor: 0, mp: 1, return_damage_factor: 0, return_mp_damage: 1, energy: 3 } },
            { name: 'block', accuracy: 0.5, mp: 1, energy: 1, fail: { damage_factor: 1.2, mp: 1 }, success: { damage_factor: 0.5, mp: 1, return_damage_factor: 0, return_mp_damage: 0, energy: 2 } },
            { name: 'parry', accuracy: 0.3, mp: 1, energy: 1, fail: { damage_factor: 1.3, mp: 1 }, success: { damage_factor: 0.3, mp: 1, return_damage_factor: 0, return_mp_damage: 0, energy: 2 } },
            { name: 'counter', accuracy: 0.1, mp: 2, energy: 3, fail: { damage_factor: 1.7, mp: 2 }, success: { damage_factor: 0.1, mp: 2, return_damage_factor: 0, return_mp_damage: 0, energy: 4 } },
            { name: 'deflect', accuracy: 0.4, mp: 1, energy: 2, fail: { damage_factor: 1.4, mp: 1 }, success: { damage_factor: 0.4, mp: 1, return_damage_factor: 0, return_mp_damage: 0, energy: 3 } },
            { name: 'absorb', accuracy: 0.2, mp: 2, energy: 3, fail: { damage_factor: 1.6, mp: 2 }, success: { damage_factor: 0.2, mp: 2, return_damage_factor: 0, return_mp_damage: 0, energy: 4 } },
            { name: 'evade', accuracy: 0.6, mp: 1, energy: 1, fail: { damage_factor: 1.1, mp: 1 }, success: { damage_factor: 0.6, mp: 1, return_damage_factor: 0, return_mp_damage: 0, energy: 3 } },
            { name: 'reflect', accuracy: 0.1, mp: 3, energy: 4, fail: { damage_factor: 1.8, mp: 3 }, success: { damage_factor: 0.1, mp: 3, return_damage_factor: 0.1, return_mp_damage: 0, energy: 5 } },
        ].filter(defense => defense.mp <= this.mp && defense.energy <= this.energy);

        if (defenses.length === 0) {
            return null;
        }

        return defenses[Math.floor(Math.random() * defenses.length)];
    }
}
