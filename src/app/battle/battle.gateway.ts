// someFile.gateway.ts
import { Gateway } from '../../core/core';

@Gateway('battle')
class BattleGatewayClass {
    public async test(data: any) {
        console.log('battle.test', data);
        return 'test';
    }
}
