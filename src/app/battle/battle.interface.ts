import { BattleTeamTrait } from "../team/team.interface";

export enum BattleStatus {
    WAITING = 'waiting',
    READY = 'ready',
    RUNNING = 'running',
    FINISHED = 'finished'
}

export interface BattleTrait {
    id: string;
    name: string;
    teams: BattleTeamTrait[];
    status: BattleStatus;
}