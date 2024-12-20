import { BATTLE_SERVER } from "../../core/config";
import { getCtx } from "../../core/context";
import { PlayerBattleEntity, PlayerSocket } from "../player/player.entity";
import { BattleTeamEntity } from "../team/team.interface";
import { BattleEntity, BattleStatus, BattleTrait } from "./battle.interface";

class BattleService {

  private lastTick: number = 0;
  private roundStartTick: number = 0;
  private round: number = 0;
  private startedTick: number = 0;

  async getBattleById(id: string, ready = false): Promise<BattleEntity> {
    const player1: PlayerBattleEntity = new PlayerBattleEntity('1', '01HGR1MFE9RR47FR8RT27S7J1W');
    player1.name = 'Player 1';
    player1.team = 'Team 1';
    player1.ready = false;
    player1.battleId = id;
    

    const player2: PlayerBattleEntity = new PlayerBattleEntity('2', '01HGR1N6TQWSCSJ6SDAXBZEQDK');
    player2.name = 'Player 2';
    player2.team = 'Team 2';
    player2.ready = false;
    player2.battleId = id;
    player2.isNPC = true;
    

    const battle = new BattleEntity(id, 'test', [
        new BattleTeamEntity('1', 'Team 1', [player1], id), 
        new BattleTeamEntity('2', 'Team 2', [player2], id)
    ], BattleStatus.WAITING, { team: 0 }, []);

    battle.ready = ready;

    return battle;
  }

  async getCurrentBattleData(): Promise<BattleEntity> {
    const ctx = getCtx();
    const battleData = await ctx.get('getBattleData')?.() as BattleEntity;

    return battleData;
  }

  async setCurrentBattleData(data: BattleEntity): Promise<void> {
    const ctx = getCtx();
    await ctx.get('setBattleData')?.(data);
  }

  async updateCurrentBattleStatus(battle: BattleEntity, status: BattleStatus): Promise<void> {
    console.log(`Battle ${battle.id} status from ${battle.status} changed to ${status}`)
    // TODO - verify?
    battle.status = status;

    await this.setCurrentBattleData(battle);

  }


  async processRound(battle: BattleEntity): Promise<boolean> {
    const ctx = getCtx();
    const tick = ctx.get('tick') || 0;
    // TODO
    switch (battle.status) {
        case BattleStatus.WAITING:
            if (battle.ready) {
                await this.updateCurrentBattleStatus(battle, BattleStatus.READY);
                this.lastTick = tick;
                this.sendAllPlayers(battle, 'status', { message: `All players connected. Battle is ready to start!`});
            } else if (tick >= this.lastTick + 40000 / BATTLE_SERVER.TICK_INTERVAL) {
                await this.updateCurrentBattleStatus(battle, BattleStatus.TERMINATED);
                this.lastTick = tick;
                this.sendAllPlayers(battle, 'status', { message: `Battle finished. No players connected.`});
                return true;
            }
            break;
        case BattleStatus.READY:
            if (tick >= this.lastTick + 5000 / BATTLE_SERVER.TICK_INTERVAL) {
                battle.log.push({
                    action: 'status',
                    data: { status: BattleStatus.RUNNING},
                    tick: 0
                });
                await this.updateCurrentBattleStatus(battle, BattleStatus.RUNNING);
                this.lastTick = tick;
                this.roundStartTick = tick;
                this.round++;
                this.sendAllPlayers(battle, 'status', { message: `Round ${this.round}, FIGHT!`});
                this.startedTick = tick;
            }
            break;
        case BattleStatus.RUNNING:
            if (this.roundStartTick + 30000 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                battle.log.push({
                    action: 'status',
                    data: {
                        status: BattleStatus.BREAK,
                        teams: battle.teams.map((team) => {
                            return {
                                name: team.name,
                                players: team.players.map((player) => {
                                    return {
                                        name: player.name,
                                        id: player.id,
                                        hp: player.hp,
                                        mp: player.mp,
                                        energy: player.energy
                                    }
                                })
                            }
                        })
                    },
                    tick: tick - this.startedTick
                });
                await this.updateCurrentBattleStatus(battle, BattleStatus.BREAK);
                this.lastTick = tick;
                this.roundStartTick = tick;
                this.showBattleInfo(battle);
            } else if (this.lastTick + 3500 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                const attackerTeam = battle.attackerTeam;
                const defenderTeam = battle.defenderTeam;
                // TODO - process round
                const attack = await attackerTeam.players[0].attack();
                const defense = await defenderTeam.players[0].defend();
                let attackerDamage = 0;
                let defenderDamage = 0;
                let attackerMpCost = 1;
                let defenderMpCost = 1;
                let attackerEnergyCost = 0;
                let defenderEnergyCost = 0;
                let defended = false;
                let defenderKnockout = false;

                if (attack) {
                    attackerDamage = attack.damage;
                    attackerMpCost = attack.mp;
                    attackerEnergyCost = attack.energy;
                }

                if (defense && attackerDamage > 0) {
                    defenderMpCost = defense.mp;
                    defenderEnergyCost = defense.energy;
                    if (defense.accuracy >= Math.random()) {
                        attackerDamage = Math.min(Math.round(attackerDamage * defense.success.damage_factor), defenderTeam.players[0].hp);
                        defenderDamage = Math.min(Math.round(attackerDamage * defense.success.return_damage_factor), attackerTeam.players[0].hp);
                        attackerMpCost += defense.success.return_mp_damage;
                        defenderMpCost = defense.success.mp;
                        defenderEnergyCost = defense.success.energy;
                        defended = true;
                    } else {
                        attackerDamage = Math.min(Math.round(attackerDamage * defense.fail.damage_factor), defenderTeam.players[0].hp);
                    }

                    if (attackerDamage > 0 && defenderTeam.players[0].energy - defenderEnergyCost <= 0) {
                        attackerDamage = Math.min(Math.round(attackerDamage * (Math.random() * 5 + 2)), defenderTeam.players[0].hp);
                        defenderKnockout = true;
                    }
                }

                attackerTeam.players[0].mp = Math.max(0, attackerTeam.players[0].mp - attackerMpCost);
                attackerTeam.players[0].energy = Math.max(0, attackerTeam.players[0].energy - attackerEnergyCost);
                attackerTeam.players[0].hp = Math.max(0, attackerTeam.players[0].hp - defenderDamage);

                defenderTeam.players[0].mp = Math.max(0, defenderTeam.players[0].mp - defenderMpCost);
                defenderTeam.players[0].energy = Math.max(0, defenderTeam.players[0].energy - defenderEnergyCost);
                defenderTeam.players[0].hp = Math.max(0, defenderTeam.players[0].hp - attackerDamage);

                console.log(`** Round ${this.round} **`);
                if (attack) {
                    this.sendAllPlayers(battle, 'attack', { message: `${attackerTeam.players[0].name} attacks ${defenderTeam.players[0].name} with ${attack?.name}`});
                    this.sendAllPlayers(battle, 'defend', { message: `${defenderTeam.players[0].name} ${defended ? ( ["dodge", "evade"].includes(defense.name) ? "" : `defends with ${defense.name}`) : (defense? `fail to defend with ${defense.name}` : `don't do anything`)}. Damage Received: ${attackerDamage}`});
                    if (defenderDamage > 0) {
                        this.sendAllPlayers(battle, 'defend', { message: `${attackerTeam.players[0].name} receives ${defenderDamage} damage from ${defenderTeam.players[0].name}'s ${defense.name}`});
                    }

                    if (defenderKnockout) {
                        this.sendAllPlayers(battle, 'status', { message: `${defenderTeam.players[0].name} is knocked out!`});
                    }
                } else {
                    console.log(`${attackerTeam.players[0].name} idle`);
                }

                battle.teams[0] = battle.turn.team === 0 ? attackerTeam : defenderTeam;
                battle.teams[1] = battle.turn.team === 1 ? attackerTeam : defenderTeam;
                
                
                battle.log.push({
                    action: 'attack',
                    data: {
                        attacker: attackerTeam.players[0].name,
                        defender: defenderTeam.players[0].name,
                        attack: attack?.name,
                        damage: attackerDamage,
                        defended,
                        defense: defense?.name,
                        defenseDamage: defenderDamage,
                        attackerMpCost,
                        defenderMpCost,
                        attackerEnergyCost,
                        defenderEnergyCost
                    },
                    tick: tick - this.startedTick
                });

                this.showBattleInfo(battle);

                battle.log.push({
                    action: 'status',
                    data: {
                        status: BattleStatus.RUNNING,
                        teams: battle.teams.map((team) => {
                            return {
                                name: team.name,
                                players: team.players.map((player) => {
                                    return {
                                        name: player.name,
                                        id: player.id,
                                        hp: player.hp,
                                        mp: player.mp,
                                        energy: player.energy
                                    }
                                })
                            }
                        })
                    },
                    tick: tick - this.startedTick
                });

                if (battle.teams[0].alivePlayers.length === 0) {
          
                    await this.updateCurrentBattleStatus(battle, BattleStatus.FINISHED);
                    this.sendAllPlayers(battle, 'status', { message: `Player 2 wins!`});
    
                } else if (battle.teams[1].alivePlayers.length === 0) {
                 
                    await this.updateCurrentBattleStatus(battle, BattleStatus.FINISHED);
                    this.sendAllPlayers(battle, 'status', { message: `Player 1 wins!`});
                } else {
                    if (attackerTeam.players[0].mp == 0) {
                        attackerTeam.resetTeamMP();
                        battle.turn.team = (battle.turn.team + 1) % battle.teams.length;
                    }
                    await this.setCurrentBattleData(battle);
                }
                this.lastTick = tick;
            }
            break;
        case BattleStatus.BREAK:
            if (this.roundStartTick + 5000 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                // const player1Recover = Math.floor((1 + Math.random() * 10) / 100 * battle.teams[0].players[0].hp);
                // const player2Recover = Math.floor((1 + Math.random() * 10) / 100 * battle.teams[1].players[0].hp);
                // battle.teams[0].players[0].hp += player1Recover;
                // battle.teams[1].players[0].hp += player2Recover;
                // console.log(`Player 1 recovers ${player1Recover} HP`);
                // console.log(`Player 2 recovers ${player2Recover} HP`);
                // console.log('Round break over.');
                battle.teams[0].players[0].energy += 5;
                battle.teams[1].players[0].energy += 5;
                this.showBattleInfo(battle);
                await this.updateCurrentBattleStatus(battle, BattleStatus.RUNNING);
                this.lastTick = tick;
                this.round++;
                this.sendAllPlayers(battle, 'status', { message: `Round break over.`});
                this.sendAllPlayers(battle, 'status', { message: `Round ${this.round}, FIGHT!`});
            } 
            break;
        case BattleStatus.FINISHED:
            if (this.lastTick + 3000 / BATTLE_SERVER.TICK_INTERVAL <= tick) {
                battle.log.push({
                    action: 'status',
                    data: {
                        status: BattleStatus.FINISHED,
                        teams: battle.teams.map((team) => {
                            return {
                                name: team.name,
                                players: team.players.map((player) => {
                                    return {
                                        name: player.name,
                                        id: player.id,
                                        hp: player.hp,
                                        mp: player.mp,
                                        energy: player.energy
                                    }
                                })
                            }
                        })
                    },
                    tick: tick - this.startedTick
                });

                await this.setCurrentBattleData(battle);
                await this.sendAllPlayers(battle, 'status', { message: `Battle finished.`, log: battle.log});
                return true;
            }
            break;
        default:
            break;
    }

    return false;
  }

  public async joinBattle(playerToken: string, socket: PlayerSocket): Promise<boolean> {
    const battle = await this.getCurrentBattleData();

    let playerFound: PlayerBattleEntity;
    let ready = true;
    for (const i in battle.teams) {
        for (const j in battle.teams[i].players) {
            if (battle.teams[i].players[j].isNPC) battle.teams[i].players[j].ready = true;

            if (battle.teams[i].players[j].token === playerToken && !battle.teams[i].players[j].ready) {
                battle.teams[i].players[j].socket = socket;
                battle.teams[i].players[j].ready = true;
                playerFound = battle.teams[i].players[j];
            } else if (!battle.teams[i].players[j].ready) {
                ready = false;
            }
        }
    }

    if (!playerFound) {
        return false;
    } else {
        this.sendAllPlayers(battle, 'join', { message: `Player ${playerFound.name} joined the battle`});
    }

    battle.ready = ready;
    await this.setCurrentBattleData(battle);
    return true;
  }

  private showBattleInfo(battle: BattleTrait): void {
    this.sendAllPlayers(battle, 'status', { message: `${battle.teams[0].players[0].name} HP: ${battle.teams[0].players[0].hp} | EP: ${battle.teams[0].players[0].energy} | ${battle.teams[1].players[0].name} HP: ${battle.teams[1].players[0].hp} | EP: ${battle.teams[1].players[0].energy} `});
  }

  private async sendAllPlayers(battle: BattleTrait, event: string, data: any): Promise<void> {
    console.log(data.message);
    for (const team of battle.teams) {
        for (const player of team.players) {
            if (player.socket) {
                this.send(player.socket, event, data);
            }
        }
    }
  }

  private async send(socket: PlayerSocket, event: string, data: any): Promise<void> {
    socket.emit(event, data);
  }
}

export const battleService = new BattleService();