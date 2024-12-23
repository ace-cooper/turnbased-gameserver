import { Prisma as ORM, PrismaClient } from '@prisma/client';
import { getCtx } from './context';
import { ulid } from 'ulid';
import { Cache } from './cache';
import { devMode } from './config';


export { Prisma as ORM, PrismaClient as ORMClient }from '@prisma/client';

interface SetOptions {
  EX?: number;
  EXAT?: number;
}

let client: PrismaClient;

export namespace Database {

    export const genId = (seedTime?: number) => ulid(seedTime);
    export const genVr = (seedTime?: number) => ulid(seedTime);

    export const createDBM = async () => {
      if (!client) {
        client = new PrismaClient(devMode ?{
            log: [
                {
                    emit: 'stdout',
                    level: 'query',
                    
                },
            ],
        } : null)
       await client.$connect();

      }
      return client;
  }

    export const getDBM: () => PrismaClient = () => getCtx()?.get("dbm") as PrismaClient;
    export const getCM: () => Cache.Node = () => getCtx()?.get("sub") as Cache.Node;

    export const withDBM = async (block: (dbm: PrismaClient) => any, options?: { cacheDisabled?: boolean }) => {
      const ctx = getCtx();
      const dbm = ctx?.get("dbm");
      if (dbm) {
      return block(dbm);
      } else {
        const dbm = await createDBM();

        if (!options?.cacheDisabled) {
          const sub = getCM() || {
            id: Cache.getDefaultHost(),
            client: await Cache.getSubClient()
          };
          ctx.set("sub", sub);
        }

        ctx.set("dbm", dbm);
        
        try {
            return await block(ctx.get('dbm'));
        } catch (e) {
            console.log(e);
            throw e;
        } finally {
            // await dbm.$disconnect();
            // await Cache.release(sub as any);
        }
     }
  };

  export async function withTransaction<T>(block: (transaction) => Promise<T>, options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: ORM.TransactionIsolationLevel;
  }): Promise<T> {
      const ctx = getCtx();
      const dbm = ctx?.get("dbm") as PrismaClient;
      if (!dbm) {
          throw new Error("Transaction Error: The context must has a db manager");
      }

      const transaction = ctx.get("transaction");

      if (transaction) {
      return await block(transaction);
      } else {
      return await dbm.$transaction<T>(async (transaction) => {

          ctx.set("transaction", transaction);
          try {
            return await block(transaction);
          } catch(e) {
            if (devMode) console.log(e)
            throw e;
          } finally {
          ctx.set("transaction", null);
          }
      }, options)
      }
  }

  export const getCurrentTransaction = () => getCtx()?.get("transaction");

  export const getCurrentDBMX = () => (getCurrentTransaction() || getDBM())  as PrismaClient;
  
  export const getCtxModels = () => getCtx()?.get('dbm')?.models;

    export abstract class BaseEntity {
        protected static _repo;
        public static get repo(): any { throw new Error(`${this.name} must override repo getter`); }
        public get cacheExport(): any { return this }
        public static get canonical(): any { throw new Error(`${this.name} must override canonical getter`); }

        id: string;
        created_at: string | Date | number;
        updated_at: string | Date | number;
        active: boolean;
        deleted: boolean;
        version: string;
    }

    interface BaseEntityConstructor<T extends BaseEntity> {
      new (): T;
      repo: any;
    }
    export class BaseService<T extends BaseEntity> {
        protected cacheEnabled: boolean = false;
        protected cacheEx: number = 600;

        protected get cacheOptions(): SetOptions {
          return this.cacheEx ? {
            EX: this.cacheEx,
          } : null
        }

        constructor(public readonly target: BaseEntityConstructor<T>) {}
      
        public get repository() {
          return this.target.repo;
        }

        public get dbm() {
          return getCurrentDBMX();
        }

        public cacheKey(id: string, targetName: string = this.target['name']) {
          return Cache.normalizeKey(targetName, id);
        }

        public factory(attributes: Partial<T> | T): T {
          const instance = new this.target();
          Object.assign(instance, attributes);
          return instance;
        }

        public async getCacheClient(key: string) {
          return await Cache.getNodeForKey(key);
        }

        public async getCacheClientByKey(id: string, targetName: string = this.target['name']) {
          return await this.getCacheClient(this.cacheKey(id, targetName));
        }
      
        public async findById(id: string, bypassCache?: boolean): Promise<T> {
          try {
            if (!bypassCache && this.cacheEnabled) {
                const cache = await this.getCache(id);
                if (cache) {
                    return this.factory(cache);
                }
            }
          } catch (e) {
            console.log(e);
          }

          return this.repository.findUnique({
            where: {
              id,
            },
          });
        }

        public async create(data: Partial<T>): Promise<T> {
            data.id = data.id || genId();
            data.version = data.version || genVr();
            data.active = data.active ?? true;
            data.deleted = data.deleted ?? false;
  
            const entity = await this.repository.create({ data });
            try {
                if (this.cacheEnabled) {
                    const instantiated = this.factory(entity)
                    const key = Cache.normalizeKey(this.target['name'], entity.id);
                    const cache = await Cache.getNodeForKey(key);
                    await cache?.client.setex(key, this.cacheOptions.EX, JSON.stringify(instantiated.cacheExport));
                }
            } catch (e) {
                console.log(e);
            }
            return !!entity ? this.factory(entity) : null;
        }

        public async delete(id: string) {
          return this.repository.update({
            where: {
              id,
            },
            data: {
              deleted: true,
              active: false,
              updated_at: new Date(),
            },
          });
        }
      
      
        public async optimisticUpdate<U extends Partial<T | any>>(
          entity: T,
          data: ORM.XOR<T, U>
        ): Promise<ORM.BatchPayload> {
          const updated_at = new Date();
          const queryData = {
            version: {
              increment: 1
            },
            updated_at,
            ...data,
          };

          const result: ORM.BatchPayload = await this.repository.updateMany({
            where: {
              id: entity.id,
              version: entity.version,
            },
            data: queryData,
          });

          if (result.count > 0) {
            try {
                if (this.cacheEnabled) {
                  const instantiated = this.factory({
                    ...entity,
                    updated_at,
                    ...data,
                    version: genVr()
                  })
                  const key = Cache.normalizeKey(this.target['name'], entity.id);
                  const cache = await Cache.getNodeForKey(key);
                  const cacheEntity = JSON.parse(await cache?.client.get(key) || '{}');
                  await cache?.client.setex(key, this.cacheOptions.EX, JSON.stringify({
                      ...cacheEntity,
                      ...instantiated.cacheExport
                  }));
                }
            } catch (e) {
                console.log(e);
            }
          }

          return result;
        }

        protected async updateEntityCache(entity: T) {
          try {
              if (this.cacheEnabled) {
                await this.updateCache(this.target['name'], entity.id, entity)
              }
          } catch (e) {
              console.log(e);
          }
        }


        protected async setEntityCache(entity: T) {
          try {
              if (this.cacheEnabled) {
                await this.setCache(this.target['name'], entity.id, entity)
              }
          } catch (e) {
              console.log(e);
          }
        }

        protected async updateCache(entityName: string, entityKey: string, data: any, cacheOptions?: SetOptions) {
          const key = Cache.normalizeKey(entityName, entityKey);
          const cache = await Cache.getNodeForKey(key);
          const cacheEntity = JSON.parse(await cache?.client.get(key) || '{}');
          await cache?.client.setex(key, cacheOptions?.EX || this.cacheOptions?.EX, JSON.stringify({
              ...cacheEntity,
              ...data
          }));
        }
        protected async setCache(entityName: string, entityKey: string, data: any, cacheOptions?: SetOptions) {
          const key = Cache.normalizeKey(entityName, entityKey);
          
          const cache = await Cache.getNodeForKey(key);
          try {
          if (cacheOptions?.EXAT) {
            
            await cache?.client.set(key, JSON.stringify({
              ...data
            }));
           
            await cache?.client.expireat(key, cacheOptions?.EXAT);
          } else {
            await cache?.client.setex(key, cacheOptions?.EX || this.cacheOptions?.EX, JSON.stringify({
                ...data
            }));
          }
          } catch(e) {
            // console.log(e); 
            throw e;
          } 
        }

        protected async getCache(id: string, targetName: string = this.target['name']) {
          const key = Cache.normalizeKey(targetName, id);
          const cache = await Cache.getNodeForKey(key);

          if (cache) {
              const data = await cache.client.get(key);
              if (data) {
                  return JSON.parse(data);
              }
          }
        }

        protected async releaseCache(id: string, targetName: string = this.target['name']) {
          const key = Cache.normalizeKey(targetName, id);
          const cache = await Cache.getNodeForKey(key);
          await cache.client.del(key);
        }

        protected async upsert(data: Partial<T>): Promise<T> {
          data.id = data.id || genId();
          data.version = data.version || genVr();
          data.active = data.active ?? true;
          data.deleted = data.deleted ?? false;
          const entity = await this.repository.upsert({
            where: {
              id: data.id,
              version: {
                lte: data.version
              }
            },
            update: {
              ...data,
              version: {
                increment: 1
              },
              updated_at: new Date(),
            },
            create: data,
          });

          try {
              if (this.cacheEnabled) {
                  const instantiated = this.factory(entity)
                  const key = Cache.normalizeKey(this.target['name'], entity.id);
                  const cache = await Cache.getNodeForKey(key);
                  await cache?.client.setex(key, this.cacheOptions.EX, JSON.stringify(instantiated.cacheExport));
              }
          } catch (e) {
              console.log(e);
          }
          return !!entity ? this.factory(entity) : null;
        }
      }

}