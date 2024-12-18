import { BattleTeamEntity, BattleTeamTrait } from "../team/team.interface";

export enum BattleStatus {
    WAITING = 'waiting',
    READY = 'ready',
    RUNNING = 'running',
    BREAK = 'break',
    FINISHED = 'finished',
    TERMINATED = 'terminated'
}

export interface BattleTrait {
    id: string;
    name: string;
    teams: BattleTeamTrait[];
    status: BattleStatus;
    turn: {
        team: number;
    };
    ready?: boolean;
    log: {
        action: string;
        data: any;
        tick: number;
    }[];
}

export class BattleEntity implements BattleTrait {
    id: string;
    name: string;
    teams: BattleTeamEntity[];
    status: BattleStatus;
    turn: {
        team: number;
    };
    ready?: boolean;
    log: {
        action: string;
        data: any;
        tick: number;
    }[];

    get attackerTeam() {
        return this.teams[this.turn.team];
    }

    get defenderTeam() {
        return this.teams[(this.turn.team + 1) % this.teams.length];
    }

    constructor(id: string, name: string, teams: BattleTeamEntity[], status: BattleStatus, turn: { team: number; }, log: { action: string; data: any; tick: number; }[]) {
        this.id = id;
        this.name = name;
        this.teams = teams;
        this.status = status;
        this.turn = turn;
        this.log = log;
    }
}

export abstract class BattleLogicBase {
    
}