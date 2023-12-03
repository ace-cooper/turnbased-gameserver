import { BattleData, Gateway, InjectBattleData, PlayerSocket, SetBattleData } from '../../core/core';
import { BattleTrait } from './battle.interface';

@Gateway('battle')
class BattleGatewayClass {

    @InjectBattleData
    public async test(
        @BattleData() battle: BattleTrait, 
        @SetBattleData() setBattleData: (data: BattleTrait) => void, 
        @PlayerSocket() playerSocket: any,
        data: any) {

        console.log('battle.test', data, battle, playerSocket.handshake.headers.token);

        battle.name = "Foi";
        setBattleData(battle)

        return 'test';
    }
}
