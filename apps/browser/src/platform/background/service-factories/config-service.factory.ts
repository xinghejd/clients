import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { ConfigService } from "@bitwarden/common/platform/services/config/config.service";

import {
  authServiceFactory,
  AuthServiceInitOptions,
} from "../../../auth/background/service-factories/auth-service.factory";

import { configApiServiceFactory, ConfigApiServiceInitOptions } from "./config-api.service.factory";
import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "./environment-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import { stateProviderFactory, StateProviderInitOptions } from "./state-provider.factory";

type ConfigServiceFactoryOptions = FactoryOptions & {
  configServiceOptions?: {
    subscribe?: boolean;
  };
};

export type ConfigServiceInitOptions = ConfigServiceFactoryOptions &
  StateProviderInitOptions &
  ConfigApiServiceInitOptions &
  AuthServiceInitOptions &
  EnvironmentServiceInitOptions &
  LogServiceInitOptions;

export function configServiceFactory(
  cache: { configService?: ConfigServiceAbstraction } & CachedServices,
  opts: ConfigServiceInitOptions,
): Promise<ConfigServiceAbstraction> {
  return factory(
    cache,
    "configService",
    opts,
    async () =>
      new ConfigService(
        await stateProviderFactory(cache, opts),
        await configApiServiceFactory(cache, opts),
        await authServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        opts.configServiceOptions?.subscribe ?? true,
      ),
  );
}
