import { BattleStatus, BattleTrait } from "./battle.interface";

class BattleService {


  async getBattle(id: string): Promise<BattleTrait> {
    return {
        id,
        name: 'test',
        teams: [{
            id: '1',
            name: 'team1',
            players: [{
                id: '1',
                name: 'player1',
                team: '1',
                socket: '1',
                ready: false,
                battleId: id
            }],
            battleId: id
        }, {
            id: '2',
            name: 'team2',
            players: [{
                id: '2',
                name: 'player2',
                team: '2',
                socket: '2',
                ready: false,
                battleId: id
            }],
            battleId: id
        }],
        status: BattleStatus.WAITING
    }
  }
}

export const battleService = new BattleService();