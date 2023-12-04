import fs from 'fs';
import path from 'path';
import { getCtx, withCtx } from './context';
import 'reflect-metadata';
import { genId } from '../foundation/utils';

const tempMethodRegistry = [];

export enum INPUT_LAYER_NAME_PATTERNS {
    GATEWAY = '.gateway.ts',
    CONTROLLER = '.controller.ts',
}

const registry = {
    [INPUT_LAYER_NAME_PATTERNS.GATEWAY]: {},
    [INPUT_LAYER_NAME_PATTERNS.CONTROLLER]: {}
};

export function Gateway(name: string) {
    return function (constructor: any) {
        registry[INPUT_LAYER_NAME_PATTERNS.GATEWAY][name] = new constructor();
    };
}

export function Controller(name: string) {
    return function (constructor: any) {
        constructor.prototype.registryName = name;
        registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][name] = {
            controller: new constructor(),
            methods: {
                GET: {},
                POST: {},
                PUT: {},
                DELETE: {},
                PATCH: {}
            }
        };

        tempMethodRegistry.forEach(methodInfo => {
            if (methodInfo.target === constructor.prototype) {
                registerHttpMethod(methodInfo.httpMethod, methodInfo.path, methodInfo.target, methodInfo.propertyKey, methodInfo.descriptor);
            }
        });
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


export function Param(name: string) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        const existingParams = Reflect.getMetadata('routeParams', target, propertyKey) || {};
        existingParams[name] = parameterIndex;
        Reflect.defineMetadata('routeParams', existingParams, target, propertyKey);
    };
}

async function registerHttpMethod(httpMethod: string, path: string, target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const controllerName = target.registryName;

    if (!registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName]) {
        throw new Error(`Controller ${controllerName} is not registered.`);
    }

    registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path] = target[propertyKey];

}

const injectDescriptorValue = (originalMethod, target, propertyKey) => {
    const routeParams = Reflect.getMetadata('routeParams', target, propertyKey) || {};
    for (const paramName in routeParams) {
        const paramIndex = routeParams[paramName];
        if (paramIndex !== undefined) {
            return async function (...args: any[]) {
                const oldArgs = [...args];
                const ctx = await getCtx();
                const params = ctx.get('params');
        
                if (params && params.hasOwnProperty(paramName)) {
                    args[paramIndex] = params[paramName];
                }
        
                return originalMethod.apply(this, [...args, ...oldArgs]);
            }
        }
    }

    return originalMethod;
}

export function Get(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey);
        tempMethodRegistry.push({ httpMethod: 'GET', path, target, propertyKey, descriptor });
    };
}

export function Post(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey);
        tempMethodRegistry.push({ httpMethod: 'POST', path, target, propertyKey, descriptor });
    };
}

export function Put(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey);
        tempMethodRegistry.push({ httpMethod: 'PUT', path, target, propertyKey, descriptor });
    };
}

export function Delete(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey);
        tempMethodRegistry.push({ httpMethod: 'DELETE', path, target, propertyKey, descriptor });
    };
}

export function Patch(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey);
        tempMethodRegistry.push({ httpMethod: 'PATCH', path, target, propertyKey, descriptor });
    };
}

export async function executePath(path: string, res, req) {
    const { method, params } = matchPath(path);
    return withCtx({ params, res, req, _id: genId() }, () => method());
}

function matchPath(incomingPath: string): any {

    const incomingSegments = incomingPath.split('/');
 
    for (const controller in registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER]) {
        
        if (controller != incomingSegments[0]) continue;

        incomingSegments.shift();
        const methods = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controller].methods;

        for (const method in methods.GET) {
            const registeredSegments = method.split('/');
        
            if (registeredSegments.length === incomingSegments.length) {
                let isMatch = true;
                let params = {};

                for (let i = 0; i < registeredSegments.length; i++) {
                    if (registeredSegments[i].startsWith(':')) {
                        
                        const paramName = registeredSegments[i].substring(1);
                        params[paramName] = incomingSegments[i];
                    } else if (registeredSegments[i] !== incomingSegments[i]) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    return { method: methods.GET[method], params };
                }
            }
        }
    }

    throw new Error('No matching path found');
}
