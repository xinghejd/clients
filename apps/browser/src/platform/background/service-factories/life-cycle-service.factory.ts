import { LifeCycleService } from "@bitwarden/common/platform/lifecycle";
import { DefaultLifeCycleService } from "@bitwarden/common/platform/lifecycle/lifecycle.service";

import {
  AccountServiceInitOptions,
  accountServiceFactory,
} from "../../../auth/background/service-factories/account-service.factory";

import { CachedServices, FactoryOptions, factory } from "./factory-options";

type LifeCycleServiceFactoryOptions = FactoryOptions;

export type LifeCycleServiceInitOptions = LifeCycleServiceFactoryOptions &
  AccountServiceInitOptions;

export function lifeCycleServiceFactory(
  cache: { lifeCycleService?: LifeCycleService } & CachedServices,
  opts: LifeCycleServiceInitOptions,
): Promise<LifeCycleService> {
  return factory(
    cache,
    "lifeCycleService",
    opts,
    async () => new DefaultLifeCycleService(await accountServiceFactory(cache, opts)),
  );
}
