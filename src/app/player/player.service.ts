import { Database } from "../../core/database";
import { Player } from "./player.entity";

class PlayerService extends Database.BaseService<Player> {
    // TODO
    public normalizeToCreate(name: string, accountId: string): Partial<Player> {
        return {
            name,
            level: 1,
            exp: 0,
            hp: 100,
            rp: 10,
            def: 1,
            atk: 1,
            str: 1,
            agi: 1,
            end: 1,
            luk: 1,
            accountId
        }
    }

    public async create(player: { name: string, accountId: string }) {
        const normalizedUser = this.normalizeToCreate(player.name, player.accountId); // TODO
        return await super.create(normalizedUser);
    }

}

export const playerService = new PlayerService(Player as any);