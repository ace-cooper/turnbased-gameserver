import { getCtx } from "../../core/context";
import { Body, Controller, Param, Post } from "../../core/core";
import { playerAccountService } from "./playerAccount.service";

@Controller('account')
class AccountController {

    @Post('v1')
    public async createAccountV1(@Body() data: any) {
        const account = await playerAccountService.create({
            name: data.name
        });

        return {
            passed: true,
            data: account // TODO
        }
        
    }
}