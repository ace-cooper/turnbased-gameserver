import { Body, Controller, Get, Param, Post } from "../../core/core";
import { playerAccountService } from "../playerAccount/playerAccount.service";
import { playerService } from "./player.service";

@Controller('player')
class PlayerController {

    @Post('v1')
    public async createV1(@Body() data: any) {
        if (!data.accountId) {
            throw new Error('accountId is required');
        }
        const account = await playerAccountService.findById(data.accountId);

        if (!account) {
            throw new Error('account not found');
        }

        const player = await playerService.create({
            name: data.name,
            accountId: data.accountId
        });

        return {
            passed: true,
            data: player // TODO
        }
    }

    @Get('v1/:id')
    public async getV1(@Param('id') id: string) {
        const player = await playerService.findById(id);

        if (!player) {
            throw new Error('player not found');
        }

        return {
            passed: true,
            data: player // TODO
        }
    }
}