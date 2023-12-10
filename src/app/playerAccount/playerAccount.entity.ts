import { Database } from '../../core/database';
import { Prisma } from '@prisma/client';

export class PlayerAccount extends Database.BaseEntity implements Prisma.PlayerAccountCreateInput {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    version: string;

    public static get repository() {
        console.log("chamou aqui")
        return Database.getCurrentDBMX().playerAccount;
    }
}