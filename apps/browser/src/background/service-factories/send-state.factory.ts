import { AsymmetricalSendState } from "@bitwarden/common/tools/send/services/asymmetrical-send-state.abstraction";
import { LegacySendStateService } from "@bitwarden/common/tools/send/services/legacy-send-state.service";

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
import { KeyGenerationServiceInitOptions } from "../../platform/background/service-factories/key-generation-service.factory";
import {
  stateServiceFactory,
  StateServiceInitOptions,
} from "../../platform/background/service-factories/state-service.factory";

type SendStateFactoryOptions = FactoryOptions;

export type SendStateInitOptions = SendStateFactoryOptions &
  CryptoServiceInitOptions &
  I18nServiceInitOptions &
  KeyGenerationServiceInitOptions &
  StateServiceInitOptions;

export function legacySendStateFactory(
  cache: { asymmetricalSendState?: AsymmetricalSendState } & CachedServices,
  opts: SendStateInitOptions,
): Promise<AsymmetricalSendState> {
  return factory(
    cache,
    "asymmetricalSendState",
    opts,
    async () =>
      new LegacySendStateService(
        {
          cache_ms: 1000,
        },
        await cryptoServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts),
      ),
  );
}
