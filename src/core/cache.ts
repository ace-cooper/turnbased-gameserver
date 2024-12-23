import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import { cacheAddresses } from './config';
import * as genericPool from 'generic-pool';
import { getCtx } from './context';
import Redlock, { Settings, Lock } from 'redlock';
export namespace Cache {
    const hashRing: Map<number, Node> = new Map();
    const poolingNodes: Map<string, genericPool.Pool<Redis>> = new Map();
    const connections: Map<string, Redis> = new Map();
    const redlock: Redlock = new Redlock([cacheAddresses[0]]);
    
    const redisFactory = (host) => ({
        create: async () => {
          return new Redis(host);
        },
        destroy: async (client) => {
         await client.quit();
        }
    } as genericPool.Factory<Redis>);
    
    export interface Node {
        id: string;
        client?: Redis;
    }

    export const KEY_SYMBOL = ":";

    export const normalizeKey = (entityName: string, key: string) =>
    `${entityName.toUpperCase()}${KEY_SYMBOL}${key}`;


    export const hash = (value: string): number => {
        const hash = crypto.createHash('md5').update(value).digest('hex');
        return parseInt(hash.slice(0, 8), 16);
    }
    
    export const addNode = (node: Node): void => {
        const position = hash(node.id);
        hashRing.set(position, node);
    }
    
    export const removeNode = (node: Node): void => {
        const position = hash(node.id);
        hashRing.delete(position);
    }

    export const getNodeForEntityAndKey = async (entityName: string, entityKey: string) => {
        const key = Cache.normalizeKey(entityName, entityKey);
        return Cache.getNodeForKey(key);
    }
    
    export const getNodeForKey = async (key: string): Promise<Node | null> => {
        if (hashRing.size === 0) {
            return null;
        }

        const keyHash = hash(key);
        const positions = Array.from(hashRing.keys());
        positions.sort((a, b) => a - b);
        let node: Node = hashRing.get(positions[0])!;

        for (const position of positions) {
            if (keyHash <= position) {
                node = hashRing.get(position)!
                break;
            }
        }

        node.client = await getSubClient(node.id);
        if (node.client.status !== 'ready') {
            try {
            // await node.client.connect(); ?
            } catch(e) {
                console.log('Error connecting', e);
            }
        }

        return node;
    }

    export const getDefaultHost = () => cacheAddresses[0];
    export const getSubClient = async (host = getDefaultHost()) => {

        const connection = connections.get(host);
        if (connection && ['ready'].includes(connection.status)) {
            return connection;
        } else if (connection) {
     
            // try { await connection.quit(); } catch(e) {  }
        }
        const pool = poolingNodes.get(host)
        const acquired = await pool!.acquire(1);
        connections.set(host, acquired);
        redlock.clients.add(acquired);
        return acquired;

    };

    export const closeAll = async () => {
        for (const node of hashRing.values()) {
            const pnode = await poolingNodes.get(node.id)!;
            redlock.clients.delete(node.client);
            pnode.drain();
        }
    }

    export const release = async (node: Node & { client: Redis }) => {
        try {
            await poolingNodes.get(node.id)!.release(node.client);
            redlock.clients.delete(node.client);
        } catch(e) {
            // console.log('Error releasing', e);
            await node.client?.quit();
        }
    }



    for (const address of cacheAddresses) {

        if (!poolingNodes.has(address)) {
            poolingNodes.set(address, genericPool.createPool(redisFactory(address), { max: 5, min: 1 }));
        }
        Cache.addNode({ id: address });
    }

    export const getCtxClient = (): Redis => {
        const ctx = getCtx();
        return ctx?.get("cacheClient");
    };

    export const withClient = async (block: (client: Redis) => any, key: { id: string; target: string; }) => {
        const ctx = getCtx();
        const client = ctx?.get("cacheClient");
        if (client) {
            return block(client);
        } else {

        
            try {
                const clientKey = Cache.normalizeKey(key.target, key.id);
                const node = await Cache.getNodeForKey(clientKey);
                ctx.set("cacheClient", node.client);
                return await block(ctx.get('cacheClient'));
            } catch (e) {
                console.log(e);
            } 
        }
    };

    export const lock = async (resources: string[], duration: number, settings?: Settings) => await redlock.acquire(resources, duration, settings);

    export const withLock = async (options: {resources: string[], duration: number, settings: Settings}, block: <T = any>(data?: Lock)=>Promise<T>) => {
        const _lock =  await Cache.lock(options.resources, options.duration, options.settings);
        try {
            return await block(_lock);
        } finally {
            await _lock.release();
        }
    }

}

export function UseCacheClient(id: string, target: string) {
    return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return Cache.withClient(() => method(...args), { id, target });
        };
    };
}
