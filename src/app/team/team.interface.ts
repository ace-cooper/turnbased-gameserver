import { PlayerBattleEntity } from "../player/player.entity";

export interface BattleTeamTrait {
    id: string;
    name: string;
    players: PlayerBattleEntity[];
    battleId: string;
}