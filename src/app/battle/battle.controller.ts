import { getCtx } from "../../core/context";
import { Controller, Get, Param } from "../../core/core";
import { battleService } from "./battle.service";

@Controller('battle')
class BattleController {

    @Get('log/:uuid')
    public async battleLog(@Param('uuid') battleId: string) {
        console.log('battle.log', battleId);
        const battleData = await battleService.getBattleById(battleId);
        const ctx = getCtx();

        return {
            main: ctx.get('main'),
            test: ctx.get('test'),
            battleData
        };
    }
}