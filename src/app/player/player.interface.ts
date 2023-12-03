export interface BattlePlayerTrait {
    id: string;
    name: string;
    team: string;
    socket: string;
    ready: boolean;
    battleId: string;
}