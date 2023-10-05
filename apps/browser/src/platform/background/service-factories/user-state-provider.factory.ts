import { UserStateProvider } from "@bitwarden/common/platform/abstractions/user-state.provider";

import {
  AccountServiceInitOptions,
  accountServiceFactory,
} from "../../../auth/background/service-factories/account-service.factory";
import { BackgroundUserStateProvider } from "../../state";

import { EncryptServiceInitOptions, encryptServiceFactory } from "./encrypt-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import {
  DiskStorageServiceInitOptions,
  MemoryStorageServiceInitOptions,
  SecureStorageServiceInitOptions,
  diskStorageServiceFactory,
  memoryStorageServiceFactory,
  secureStorageServiceFactory,
} from "./storage-service.factory";

type UserStateProviderFactoryOptions = FactoryOptions;

export type UserStateProviderInitOptions = UserStateProviderFactoryOptions &
  AccountServiceInitOptions &
  EncryptServiceInitOptions &
  MemoryStorageServiceInitOptions &
  DiskStorageServiceInitOptions &
  SecureStorageServiceInitOptions;

export function userStateProviderFactory(
  cache: { userStateProvider?: UserStateProvider } & CachedServices,
  opts: UserStateProviderInitOptions
): Promise<UserStateProvider> {
  return factory(
    cache,
    "userStateProvider",
    opts,
    async () =>
      new BackgroundUserStateProvider(
        await accountServiceFactory(cache, opts),
        await encryptServiceFactory(cache, opts),
        await memoryStorageServiceFactory(cache, opts),
        await diskStorageServiceFactory(cache, opts),
        await secureStorageServiceFactory(cache, opts)
      )
  );
}
