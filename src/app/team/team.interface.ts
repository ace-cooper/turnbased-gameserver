import { PlayerBattleEntity } from "../player/player.entity";

export interface BattleTeamTrait {
    id: string;
    name: string;
    players: PlayerBattleEntity[];
    battleId: string;
}

export class BattleTeamEntity implements BattleTeamTrait {
    id: string;
    name: string;
    players: PlayerBattleEntity[];
    battleId: string;

    constructor(id: string, name: string, players: PlayerBattleEntity[], battleId: string) {
        this.id = id;
        this.name = name;
        this.players = players;
        this.battleId = battleId;
    }

    public get alivePlayers() {
        return this.players.filter(player => player.hp > 0);
    }

    public resetTeamMP() {
        this.players.forEach(player => player.resetMp());
    }
}