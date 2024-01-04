export type CachedServices = Record<string, unknown>;

export type FactoryOptions = {
  alwaysInitializeNewService?: boolean;
  doNotStoreInitializedService?: boolean;
  [optionsKey: string]: unknown;
};

const cachedServices: CachedServices = {};

export async function factory<
  TCache extends CachedServices,
  TName extends keyof CachedServices,
  TOpts extends FactoryOptions,
>(
  UNUSED_cachedServices: TCache, // TODO: CG - This needs to be removed and updated within all calls to the factory method
  name: TName,
  opts: TOpts,
  factory: () => CachedServices[TName] | Promise<CachedServices[TName]>,
): Promise<CachedServices[TName]> {
  let instance = cachedServices[name];
  const instancePreviouslyInitialized = !!instance;
  if (opts.alwaysInitializeNewService || !instance) {
    const instanceOrPromise = factory();
    instance = instanceOrPromise instanceof Promise ? await instanceOrPromise : instanceOrPromise;
  }

  if (!opts.doNotStoreInitializedService && !instancePreviouslyInitialized) {
    cachedServices[name] = instance;
  }

  return instance as TCache[TName];
}
