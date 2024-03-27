import { SendStateService } from "@bitwarden/common/tools/send/services/send-state.service";
import { SendStateService as SendStateServiceAbstraction } from "@bitwarden/common/tools/send/services/send-state.service.abstraction";

import {
  AccountServiceInitOptions,
  accountServiceFactory,
} from "../../auth/background/service-factories/account-service.factory";
import {
  CryptoServiceInitOptions,
  cryptoServiceFactory,
} from "../../platform/background/service-factories/crypto-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../platform/background/service-factories/factory-options";
import {
  i18nServiceFactory,
  I18nServiceInitOptions,
} from "../../platform/background/service-factories/i18n-service.factory";
import { StateProviderInitOptions } from "../../platform/background/service-factories/state-provider.factory";

import { sendStateProviderFactory } from "./send-state-provider.factory";

type SendStateServiceFactoryOptions = FactoryOptions;

export type SendStateServiceInitOptions = SendStateServiceFactoryOptions &
  CryptoServiceInitOptions &
  I18nServiceInitOptions &
  StateProviderInitOptions &
  AccountServiceInitOptions;

export function sendStateServiceFactory(
  cache: { sendStateService?: SendStateServiceAbstraction } & CachedServices,
  opts: SendStateServiceInitOptions,
): Promise<SendStateServiceAbstraction> {
  return factory(
    cache,
    "sendStateService",
    opts,
    async () =>
      new SendStateService(
        {
          cache_ms: 1000,
        },
        await cryptoServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await sendStateProviderFactory(cache, opts),
        await accountServiceFactory(cache, opts),
      ),
  );
}
