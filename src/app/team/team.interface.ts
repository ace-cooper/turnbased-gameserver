import { BattlePlayerTrait } from "../player/player.interface";

export interface BattleTeamTrait {
    id: string;
    name: string;
    players: BattlePlayerTrait[];
    battleId: string;
}