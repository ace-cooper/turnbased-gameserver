import fs from 'fs';
import path from 'path';
import { getCtx } from './context';
import 'reflect-metadata';

export enum INPUT_LAYER_NAME_PATTERNS {
    GATEWAY = '.gateway.ts',
    CONTROLLER = '.controller.ts',
}

const registry = {
    [INPUT_LAYER_NAME_PATTERNS.GATEWAY]: {}
};

export function Gateway(name: string) {
    return function (constructor: any) {
        registry[INPUT_LAYER_NAME_PATTERNS.GATEWAY][name] = new constructor();
    };
}

export function Controller(name: string) {
    return function (constructor: any) {
        registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][name] = new constructor();
    };
}

export const loadClasses = (dir: string, pattern: INPUT_LAYER_NAME_PATTERNS): {
    [key: string]: any
} => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadClasses(fullPath, pattern);
        } else if (stat.isFile() && fullPath.endsWith(pattern)) {
            require(fullPath);
        }
    };

    return registry[pattern];
};

export function BattleData() {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        Reflect.defineMetadata('battleData', parameterIndex, target, propertyKey);
    };
}

export function SetBattleData() {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        Reflect.defineMetadata('setBattleData', parameterIndex, target, propertyKey);
    };
}

export function PlayerSocket() {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        Reflect.defineMetadata('playerSocket', parameterIndex, target, propertyKey);
    };
}


export function InjectBattleData(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        const ctx = await getCtx(); 
        const oldArgs = [...args];
        const battleDataIndex = Reflect.getMetadata('battleData', target, propertyKey);
        if (typeof battleDataIndex === 'number') {
            args[battleDataIndex] = await ctx.get('getBattleData')();
        }

        const setBattleDataIndex = Reflect.getMetadata('setBattleData', target, propertyKey);
        if (typeof setBattleDataIndex === 'number') {
            args[setBattleDataIndex] = ctx.get('setBattleData');
        }

        const playerSocketIndex = Reflect.getMetadata('playerSocket', target, propertyKey);
        if (typeof playerSocketIndex === 'number') {
            args[playerSocketIndex] = ctx.get('playerSocket');
        }

        return originalMethod.apply(this, [...args, ...oldArgs]);
    };
}


