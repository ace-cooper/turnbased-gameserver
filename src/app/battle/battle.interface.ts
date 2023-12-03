import { BattleTeamTrait } from "../team/team.interface";

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
    ready?: boolean;
}