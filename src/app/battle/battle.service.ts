import { BATTLE_SERVER } from "../../core/config";
import { getCtx } from "../../core/context";
import { PlayerBattleEntity } from "../player/player.entity";
import { BattleStatus, BattleTrait } from "./battle.interface";

class BattleService {

  private lastTick: number = 0;
  private roundStartTick: number = 0;
  private round: number = 0;

  async getBattleById(id: string): Promise<BattleTrait> {
    const player1: PlayerBattleEntity = new PlayerBattleEntity('1');
    player1.name = 'player1';
    player1.team = '1';
    player1.socket = '1';
    player1.ready = false;
    player1.battleId = id;

    const player2: PlayerBattleEntity = new PlayerBattleEntity('2');
    player2.name = 'player2';
    player2.team = '2';
    player2.socket = '2';
    player2.ready = false;
    player2.battleId = id;

    return {
        id,
        name: 'test',
        teams: [{
            id: '1',
            name: 'team1',
            players: [player1],
            battleId: id
        }, {
            id: '2',
            name: 'team2',
            players: [player2],
            battleId: id
        }],
        status: BattleStatus.WAITING
    }
  }

  async getCurrentBattleData(): Promise<BattleTrait> {
    const ctx = getCtx();
    const battleData = await ctx.get('getBattleData')?.() as BattleTrait;

    return battleData;
  }

  async setCurrentBattleData(data: BattleTrait): Promise<void> {
    const ctx = getCtx();
    await ctx.get('setBattleData')?.(data);
  }

  async updateCurrentBattleStatus(battle: BattleTrait, status: BattleStatus): Promise<void> {
    console.log(`Battle ${battle.id} status from ${battle.status} changed to ${status}`)
    // TODO - verify?
    battle.status = status;

    await this.setCurrentBattleData(battle);

  }

  async processRound(battle: BattleTrait): Promise<boolean> {
    const ctx = getCtx();
    const tick = ctx.get('tick') || 0;
    // TODO
    switch (battle.status) {
        case BattleStatus.WAITING:
            if (tick >= this.lastTick + 30000 / BATTLE_SERVER.TICK_INTERVAL) {
                await this.updateCurrentBattleStatus(battle, BattleStatus.READY);
                this.lastTick = tick;
            }
            break;
        case BattleStatus.READY:
            if (tick >= this.lastTick + 5000 / BATTLE_SERVER.TICK_INTERVAL) {
                await this.updateCurrentBattleStatus(battle, BattleStatus.RUNNING);
                this.lastTick = tick;
                this.roundStartTick = tick;
                this.round++;
            }
            break;
        case BattleStatus.RUNNING:
            if (this.roundStartTick + 30000 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                await this.updateCurrentBattleStatus(battle, BattleStatus.BREAK);
                this.lastTick = tick;
                this.roundStartTick = tick;
                this.showBattleInfo(battle);
            } else if (this.lastTick + 3500 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                // TODO - process round
                const attack1 = await battle.teams[0].players[0].attack();
                const attack2 = await battle.teams[1].players[0].attack();

                console.log(`** Round ${this.round} **`);
                console.log(`Player 1 attacks Player 2 with ${attack1.name} and deals ${attack1.damage} damage`);
                battle.teams[1].players[0].hp = Math.max(0, battle.teams[1].players[0].hp - attack1.damage);
                console.log(`Player 2 attacks Player 1 with ${attack2.name} and deals ${attack2.damage} damage`);
                battle.teams[0].players[0].hp = Math.max(0, battle.teams[0].players[0].hp - attack2.damage);
                this.showBattleInfo(battle);

                if (battle.teams[0].players[0].hp === 0) {
                    console.log('Player 2 wins!');
                    await this.updateCurrentBattleStatus(battle, BattleStatus.FINISHED);
    
                } else if (battle.teams[1].players[0].hp === 0) {
                    console.log('Player 1 wins!');
                    await this.updateCurrentBattleStatus(battle, BattleStatus.FINISHED);
                }
                this.lastTick = tick;
            }
            break;
        case BattleStatus.BREAK:
            if (this.roundStartTick + 5000 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                const player1Recover = Math.floor((1 + Math.random() * 10) / 100 * battle.teams[0].players[0].hp);
                const player2Recover = Math.floor((1 + Math.random() * 10) / 100 * battle.teams[1].players[0].hp);
                battle.teams[0].players[0].hp += player1Recover;
                battle.teams[1].players[0].hp += player2Recover;
                console.log(`Player 1 recovers ${player1Recover} HP`);
                console.log(`Player 2 recovers ${player2Recover} HP`);
                console.log('Round break over.');
                this.showBattleInfo(battle);
                await this.updateCurrentBattleStatus(battle, BattleStatus.RUNNING);
                this.lastTick = tick;
                this.round++;
            } 
            break;
        case BattleStatus.FINISHED:
            if (this.lastTick + 3000 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                return true;
            }
            break;
        default:
            break;
    }

    return false;
  }

  private showBattleInfo(battle: BattleTrait): void {
    console.log(`Player 1 HP: ${battle.teams[0].players[0].hp}`);
    console.log(`Player 2 HP: ${battle.teams[1].players[0].hp}`);
  }

  private async sendAllPlayers(battle: BattleTrait, event: string, data: any): Promise<void> {

  }
}

export const battleService = new BattleService();