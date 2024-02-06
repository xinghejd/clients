export type CachedServices = Record<string, unknown>;

export type FactoryOptions = {
  alwaysInitializeNewService?: boolean;
  doNotStoreInitializedService?: boolean;
  [optionsKey: string]: unknown;
};

// CG - This forces a cache to be globally referenced before all factory methods
const cachedServices: CachedServices = {};

export async function factory<
  TCache extends CachedServices,
  TName extends keyof CachedServices,
  TOpts extends FactoryOptions,
>(
  UNUSED_cachedServices: TCache,
  name: TName,
  opts: TOpts,
  factory: () => TCache[TName] | Promise<TCache[TName]>,
): Promise<TCache[TName]> {
  let instance = cachedServices[name];
  const instancedExists = Boolean(instance);
  if (opts.alwaysInitializeNewService || !instance) {
    const instanceOrPromise = factory();
    instance = instanceOrPromise instanceof Promise ? await instanceOrPromise : instanceOrPromise;
  }

  if (!opts.doNotStoreInitializedService && !instancedExists) {
    cachedServices[name] = instance;
  }

  return instance as TCache[TName];
}
