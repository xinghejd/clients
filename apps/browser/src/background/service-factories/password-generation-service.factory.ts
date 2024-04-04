import { legacyPasswordGenerationServiceFactory } from "@bitwarden/common/tools/generator";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

import {
  policyServiceFactory,
  PolicyServiceInitOptions,
} from "../../admin-console/background/service-factories/policy-service.factory";
import {
  accountServiceFactory,
  AccountServiceInitOptions,
} from "../../auth/background/service-factories/account-service.factory";
import {
  CryptoServiceInitOptions,
  cryptoServiceFactory,
} from "../../platform/background/service-factories/crypto-service.factory";
import {
  encryptServiceFactory,
  EncryptServiceInitOptions,
} from "../../platform/background/service-factories/encrypt-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../platform/background/service-factories/factory-options";
import {
  stateProviderFactory,
  StateProviderInitOptions,
} from "../../platform/background/service-factories/state-provider.factory";

type PasswordGenerationServiceFactoryOptions = FactoryOptions;

export type PasswordGenerationServiceInitOptions = PasswordGenerationServiceFactoryOptions &
  CryptoServiceInitOptions &
  EncryptServiceInitOptions &
  PolicyServiceInitOptions &
  AccountServiceInitOptions &
  StateProviderInitOptions;

export function passwordGenerationServiceFactory(
  cache: { passwordGenerationService?: PasswordGenerationServiceAbstraction } & CachedServices,
  opts: PasswordGenerationServiceInitOptions,
): Promise<PasswordGenerationServiceAbstraction> {
  return factory(cache, "passwordGenerationService", opts, async () =>
    legacyPasswordGenerationServiceFactory(
      await encryptServiceFactory(cache, opts),
      await cryptoServiceFactory(cache, opts),
      await policyServiceFactory(cache, opts),
      await accountServiceFactory(cache, opts),
      await stateProviderFactory(cache, opts),
    ),
  );
}
