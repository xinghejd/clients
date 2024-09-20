import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { SdkService } from "@bitwarden/common/platform/abstractions/sdk/sdk.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { engine, services, strategies } from "@bitwarden/generator-core";
import { LocalGeneratorHistoryService } from "@bitwarden/generator-history";
import { DefaultGeneratorNavigationService } from "@bitwarden/generator-navigation";

import { LegacyPasswordGenerationService } from "./legacy-password-generation.service";
import { PasswordGenerationServiceAbstraction } from "./password-generation.service.abstraction";

const { PassphraseGeneratorStrategy, PasswordGeneratorStrategy } = strategies;
const { CryptoServiceRandomizer, PasswordRandomizer } = engine;

const DefaultGeneratorService = services.DefaultGeneratorService;

export function legacyPasswordGenerationServiceFactory(
  encryptService: EncryptService,
  cryptoService: CryptoService,
  policyService: PolicyService,
  accountService: AccountService,
  stateProvider: StateProvider,
  configService: ConfigService,
  sdkService: SdkService,
): PasswordGenerationServiceAbstraction {
  const randomizer = new CryptoServiceRandomizer(cryptoService);
  const passwordRandomizer = new PasswordRandomizer(randomizer);

  const passwords = new DefaultGeneratorService(
    new PasswordGeneratorStrategy(passwordRandomizer, stateProvider, configService, sdkService),
    policyService,
  );

  const passphrases = new DefaultGeneratorService(
    new PassphraseGeneratorStrategy(passwordRandomizer, stateProvider),
    policyService,
  );

  const navigation = new DefaultGeneratorNavigationService(stateProvider, policyService);

  const history = new LocalGeneratorHistoryService(encryptService, cryptoService, stateProvider);

  return new LegacyPasswordGenerationService(
    accountService,
    navigation,
    passwords,
    passphrases,
    history,
  );
}
