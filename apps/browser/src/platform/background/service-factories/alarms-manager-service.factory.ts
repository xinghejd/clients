import { AlarmsManagerService } from "../../browser/alarms-manager.service";

import { CachedServices, FactoryOptions, factory } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import { stateProviderFactory, StateProviderInitOptions } from "./state-provider.factory";

type AlarmsManagerServiceFactoryOptions = FactoryOptions;

export type AlarmsManagerServiceInitOptions = AlarmsManagerServiceFactoryOptions &
  LogServiceInitOptions &
  StateProviderInitOptions;

export function alarmsManagerServiceFactory(
  cache: { alarmsManagerService?: AlarmsManagerService } & CachedServices,
  opts: AlarmsManagerServiceInitOptions,
): Promise<AlarmsManagerService> {
  return factory(
    cache,
    "alarmsManagerService",
    opts,
    async () =>
      new AlarmsManagerService(
        await logServiceFactory(cache, opts),
        await stateProviderFactory(cache, opts),
      ),
  );
}
