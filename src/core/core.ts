import fs from 'fs';
import path from 'path';
import { getCtx, withCtx } from './context';
import 'reflect-metadata';
import { genId } from '../foundation/utils';
import { Guard, Interceptor, Middleware } from './entity';
import { devMode } from './config';

const tempMethodRegistry = [];
const guardsRegistry = [];
const interceptorsRegistry = [];
const middlewaresRegistry = [];

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

const namespaces = {};

export function Controller(name: string, options?: { guards?: Guard[], middleware?: Middleware[], interceptors?: Interceptor[], namespace?: string }) {
    return function (constructor: any) {
        if (!!options?.namespace) {
            namespaces[options?.namespace] = true;
            name = `${options?.namespace}/${name}`;
        }
        constructor.prototype.registryName = name;
        registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][name] = {
            controller: new constructor(),
            methods: {
                GET: {},
                POST: {},
                PUT: {},
                DELETE: {},
                PATCH: {}
            },
            functions: {},
            guards: async () => {
                for (const guard of options?.guards || []) {
                    const result = await guard.canActivate();
        
                    if (!result) {
                        throw new Error('Unauthorized');
                    }
                }
            },
            middleware: async () => {
                for (const middleware of options?.middleware || []) {
                    await middleware.use();
                }
            },
            interceptors: async (data?: any) => {
                for (const interceptor of options?.interceptors || []) {
                    data = await interceptor.use(data);
                }

                return data;
            }
        };

        tempMethodRegistry.forEach(methodInfo => {
            if (methodInfo.target === constructor.prototype) {
                registerHttpMethod(methodInfo.httpMethod, methodInfo.path, methodInfo.target, methodInfo.propertyKey, methodInfo.descriptor);
            }
        });

        guardsRegistry.forEach(guardInfo => {
            if (guardInfo.target === constructor.prototype) {
                const {httpMethod, path} = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][name].functions[guardInfo.propertyKey];
                addGuardsToMethod(guardInfo.target.registryName, httpMethod, path, guardInfo.guards);
            }
        });

        interceptorsRegistry.forEach(interceptorInfo => {
            if (interceptorInfo.target === constructor.prototype) {
                const {httpMethod, path} = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][name].functions[interceptorInfo.propertyKey];
                addInterceptorsToMethod(interceptorInfo.target.registryName, httpMethod, path, interceptorInfo.interceptors);
            }
        });

        middlewaresRegistry.forEach(middlewareInfo => {
            if (middlewareInfo.target === constructor.prototype) {
                const {httpMethod, path} = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][name].functions[middlewareInfo.propertyKey];
                addMiddlewaresToMethod(middlewareInfo.target.registryName, httpMethod, path, middlewareInfo.interceptors);
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

    registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path] = target[propertyKey].bind(target);
    registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].functions[propertyKey] = {
        httpMethod,
        path
    };

}

async function addMiddlewaresToMethod(controllerName: string, httpMethod: string, path: string, middlewares: Middleware[]) {

    if (!registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName]) {
        throw new Error(`Controller ${controllerName} is not registered.`);
    }

    const method = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path];

    registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path] = async () => {

        await Promise.all(middlewares.map(middleware => middleware.use()));

        return await method();
    }
}

async function addGuardsToMethod(controllerName: string, httpMethod: string, path: string, guards: Guard[]) {

    if (!registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName]) {
        throw new Error(`Controller ${controllerName} is not registered.`);
    }

    const method = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path];

    registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path] = async () => {
        for (const guard of guards) {
            const result = await guard.canActivate();

            if (!result) {
                throw {
                    status: 401,
                    message: 'Unauthorized',
                    passed: false
                };
            }
        }

        return await method();
    }
}

async function addInterceptorsToMethod(controllerName: string, httpMethod: string, path: string, interceptors: Interceptor[]) {

    if (!registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName]) {
        throw new Error(`Controller ${controllerName} is not registered.`);
    }

    const method = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path];

    registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controllerName].methods[httpMethod][path] = async () => {
        let result = await method();
        for (const interceptor of interceptors) {
            result = await interceptor.use(result);
        }

        return result;
    }
}

const injectDescriptorValue = (originalMethod, target, propertyKey, injectData?: { 
    body?: boolean; 
    query?: boolean; 
    tokenData?: boolean;
    user?: boolean;
}) => {
    return async function (...args: any[]) {
        const oldArgs = [...args];
        const ctx = await getCtx();
    
        const routeParams = Reflect.getMetadata('routeParams', target, propertyKey) || {};
        for (const paramName in routeParams) {
            const paramIndex = routeParams[paramName];
            if (paramIndex !== undefined) {
                    const params = ctx.get('params');
            
                    if (params && params.hasOwnProperty(paramName)) {
                        args[paramIndex] = params[paramName];
                    }
            
            }
        }

        if (injectData?.body) {
            const bodyIndex = Reflect.getMetadata('body', target, propertyKey);

            if (typeof bodyIndex === 'number') {
                const metadata = Reflect.getMetadata('body', target, propertyKey);
                if (metadata) {
    
                    let {index: bodyIndex, validator} = metadata;
    
                    if (typeof bodyIndex === 'number') {
                        args[bodyIndex] = ctx.get('body');
    
            
                        if (validator) {
                            validator = new validator();
                    
                            for (const key in args[bodyIndex]) {
                                    validator[key] = args[bodyIndex][key];
                            }
    
                            try {
                                const validate = await validator.validate();
                                
                                if (validate) {                            
                                    const res = ctx.get('res');
                                    res?.status(400)?.json(validate);
                                    throw {...validate, status: 400};
                                }
                            } catch (e) {                        
                            
                                throw { passed: false, errors: e, status: 400 };
                            }
                        }
                    }
                }
            }
        }

        if (injectData?.query) {
            const metadata = Reflect.getMetadata('query', target, propertyKey);

            if (metadata) {
                let {index, validator } = metadata;
                if (typeof index === 'number') {
                    args[index] = ctx.get('query');

                    if (validator) {
                        validator = new validator();
                
                        for (const key in args[index]) {
                            validator[key] = args[index][key];
                        }

                        try {
                            const validate = await validator.validate();
                            
                            if (validate) {                            
                                const res = ctx.get('res');
                                res?.status(400)?.json(validate);
                                throw {...validate, status: 400};
                            }
                        } catch (e) {                        
                        
                            throw { passed: false, errors: e, status: 400 };
                        }
                    }
                }
            }
        }

        const ctxDataIndex = Reflect.getMetadata('ctxData', target, propertyKey);
        if (typeof ctxDataIndex === 'object') {
            const ctx = getCtx();
            for (let key in ctxDataIndex) {
                const data = ctx.get(key);
                args[ctxDataIndex[key]] = data;
            }
        }

        return originalMethod.apply(this, [...args, ...oldArgs]);
    }
}

export function Get(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey, { query: true });
        tempMethodRegistry.push({ httpMethod: 'GET', path, target, propertyKey, descriptor });
    };
}

export function Query<C>(validator?: C) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        Reflect.defineMetadata('query', {
            index: parameterIndex,
            validator
        }, target, propertyKey);
    };
}

export function Post(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey, { body: true, query: true });
        tempMethodRegistry.push({ httpMethod: 'POST', path, target, propertyKey, descriptor });
    };
}

export function Body<C>(validator?: C) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        Reflect.defineMetadata('body', {
            index: parameterIndex,
            validator
        }, target, propertyKey);
    };
}

export function Put(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey, { body: true, query: true });
        tempMethodRegistry.push({ httpMethod: 'PUT', path, target, propertyKey, descriptor });
    };
}

export function Delete(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey, { query: true });
        tempMethodRegistry.push({ httpMethod: 'DELETE', path, target, propertyKey, descriptor });
    };
}

export function Patch(path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = injectDescriptorValue(descriptor.value, target, propertyKey, { body: true, query: true });
        tempMethodRegistry.push({ httpMethod: 'PATCH', path, target, propertyKey, descriptor });
    };
}

export function ContextValue(name: string) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        const ctxData = Reflect.getMetadata('ctxData', target, propertyKey) || {};
        ctxData[name] = parameterIndex;
        Reflect.defineMetadata('ctxData', ctxData, target, propertyKey);
    };
}

export function UseGuards(...guards: Guard[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        guardsRegistry.push({ guards, target, propertyKey, descriptor });
    };
}

export function UseInterceptors(...interceptors: Interceptor[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        interceptorsRegistry.push({ interceptors, target, propertyKey, descriptor });
    };
}

export function UseMiddlewares(...middlewares: Middleware[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        middlewaresRegistry.push({ interceptors: middlewares, target, propertyKey, descriptor });
    };
}

function getPathNS(path: string) {
    for (const ns in namespaces) {
        if (path.startsWith(ns)) {
            return ns;
        }
    }   
}

function normalizePath(path: string) {
   const ns = getPathNS(path);

   if (ns) {
       return {
        ns,
        path: path.substring(ns.length+1)
       }
   }

   return { path, ns };
}

export async function executePath(_path: string, res, req) {
    const {path, ns} = normalizePath(_path);
    const { method, params, middleware, guards, interceptors } = matchPath(path, req.method.toUpperCase() as any, ns);
    const ctx = getCtx();
    ctx.set('params', params);
    ctx.set('_id', genId());
    ctx.set('res', res);
    ctx.set('req', req);
    ctx.set('headers', (typeof req.headers == 'function' ? req.headers() : req.headers) || {} );
    ctx.set('body', req.body || {});
    ctx.set('query', req.query || {});
    
    try {
 
        await middleware();
        await guards();

        let result = await method();

        result = await interceptors(result);

        return result;
    } catch (e) {
        if (devMode) console.log(e);
        return {...e, status: e?.status || 500, passed: false};
    }
}

function matchPath(incomingPath: string, requestMethod: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', namespace?: string): any {

    const incomingSegments = incomingPath.split('/');
    if (incomingSegments[0]?.[0]?.toLowerCase() == "v") {
       const version = incomingSegments.shift();
       
       if (!incomingSegments?.[1]) {
        incomingSegments.push("/");
       }

       incomingSegments[0] = `${version}/${incomingSegments[0]}`;
    } else if (!incomingSegments?.[1]) {
        incomingSegments.push("/");
    }

    if (!!namespace) {
        incomingSegments[0] = `${namespace}/${incomingSegments[0]}`;
    }

    for (const controller in registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER]) {
        
        if (controller != incomingSegments[0]) continue;

        incomingSegments.shift();
        const methods = registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controller].methods;

        for (const method in methods[requestMethod]) {
            const registeredSegments = method == '/' ? [method] : method.split('/');
        
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
                    return { 
                        method: methods[requestMethod][method], 
                        params, 
                        guards: registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controller].guards,
                        middleware: registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controller].middleware,
                        interceptors: registry[INPUT_LAYER_NAME_PATTERNS.CONTROLLER][controller].interceptors,
                    };
                }
            }
        }
    }

    throw { status: 404, message: 'Not found' };
}
