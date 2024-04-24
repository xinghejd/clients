import { GlobalStateProvider } from "@bitwarden/common/platform/state";
// eslint-disable-next-line import/no-restricted-paths -- We need the implementation to inject, but generally this should not be accessed
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";

import { CachedServices, FactoryOptions, factory } from "./factory-options";
import { LogServiceInitOptions, logServiceFactory } from "./log-service.factory";
import {
  PlatformUtilsServiceInitOptions,
  platformUtilsServiceFactory,
} from "./platform-utils-service.factory";
import {
  StorageServiceProviderInitOptions,
  storageServiceProviderFactory,
} from "./storage-service-provider.factory";

type GlobalStateProviderFactoryOptions = FactoryOptions;

export type GlobalStateProviderInitOptions = GlobalStateProviderFactoryOptions &
  StorageServiceProviderInitOptions &
  PlatformUtilsServiceInitOptions &
  LogServiceInitOptions;

export async function globalStateProviderFactory(
  cache: { globalStateProvider?: GlobalStateProvider } & CachedServices,
  opts: GlobalStateProviderInitOptions,
): Promise<GlobalStateProvider> {
  return factory(
    cache,
    "globalStateProvider",
    opts,
    async () =>
      new DefaultGlobalStateProvider(
        await storageServiceProviderFactory(cache, opts),
        await platformUtilsServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
      ),
  );
}
