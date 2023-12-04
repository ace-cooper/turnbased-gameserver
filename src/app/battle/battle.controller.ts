import { getCtx, withCtx } from "../../core/context";
import { Controller, Get, Param } from "../../core/core";
import { BattleTrait } from "./battle.interface";
import { battleService } from "./battle.service";

@Controller('battle')
class BattleController {

    @Get('log/:uuid')
    public async battleLog(@Param('uuid') battleId: string) {
        console.log('battle.log', battleId);
        let battleData = await battleService.getBattleById(battleId, true);
        let tick = 0;
        const setBattleData = async (data: BattleTrait) => {
            battleData = data;
        };
        
        const getBattleData = async () => {
            return battleData;
        }

        const ctx = getCtx();
        let done = false;

        while (!done && tick < 500000) {
            done = await withCtx({ tick, setBattleData, getBattleData }, async () => battleService.processRound(await getBattleData()));
            tick++;
        }


        return {
            id: battleData.id,
            log: battleData.log
        };
    }
}