import {createNamespace, getNamespace} from 'cls-hooked';
const callContextLocalStorage = createNamespace('main');

export type Ctx = Map<string, any>;

export const withCtx = async <R>(
    ctx: any,
    block: (ctx: Ctx) => Promise<R>
  ): Promise<R> => {
  const localCtx = { ...ctx };

  return new Promise(async resolve => callContextLocalStorage.run(async (data: Map<string, any>) => {
    data = getCtx();
    for (const key in localCtx) {
      if (key == 'data') {
        console.warn('Cannot set data key in context');
        continue;
      }
        data.set(key, localCtx[key]);
    }
    resolve(await block(data));
  }));
};

export const getCtx = (name = 'main') => getNamespace(name);
export const getCtxData = (name = 'main') => ({
  get: <T = any>(key: string) => getCtx(name)?.get('data')?.get(key) as T,
  set: (key: string, value: any) => {
    const ctx = getCtx(name)
    if (ctx) {
      const data = ctx.get('data');
      if (!data) {
        ctx.set('data', new Map<string, any>());
      }
      ctx.get('data').set(key, value);
    }
  },
});
