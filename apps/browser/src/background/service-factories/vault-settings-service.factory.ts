import { VaultSettingsService as AbstractVaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { VaultSettingsService } from "@bitwarden/common/vault/services/vault-settings/vault-settings.service";

import {
  CachedServices,
  FactoryOptions,
  factory,
} from "../../platform/background/service-factories/factory-options";
import {
  stateProviderFactory,
  StateProviderInitOptions,
} from "../../platform/background/service-factories/state-provider.factory";

export type VaultSettingsServiceInitOptions = FactoryOptions & StateProviderInitOptions;

export function vaultSettingsServiceFactory(
  cache: { vaultSettingsService?: VaultSettingsService } & CachedServices,
  opts: VaultSettingsServiceInitOptions,
): Promise<AbstractVaultSettingsService> {
  return factory(
    cache,
    "vaultSettingsService",
    opts,
    async () => new VaultSettingsService(await stateProviderFactory(cache, opts)),
  );
}
