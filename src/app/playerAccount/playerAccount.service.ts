import { PlayerAccount } from "./playerAccount.entity";
import { Database } from "../../core/database";

class PlayerAccountService extends Database.BaseService<PlayerAccount> {
    public normalizeToCreate(user: any): Pick<PlayerAccount, 'id' | 'name' | 'version'> {
        return {
            id: Database.genId(),
            name: user.name,
            version: Database.genVr()
        };
    }

    public async create(user: any) {
        // console.log(await PlayerAccount.repository)
        const normalizedUser = this.normalizeToCreate(user);
        return await super.create(normalizedUser);
    }
}

export const playerAccountService = new PlayerAccountService(PlayerAccount as any);