import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";

import BrowserLocalStorageService from "../../services/browser-local-storage.service";
import BrowserMessagingPrivateModeBackgroundService from "../../services/browser-messaging-private-mode-background.service";
import BrowserMessagingService from "../../services/browser-messaging.service";
import { KeyGenerationService } from "../../services/key-generation.service";
import { LocalBackedSessionStorageService } from "../../services/local-backed-session-storage.service";

import { DependencyProviderData } from "./dependency-injection.abstractions";
// import { DependencyLifecycle } from "./dependency-lifecycle.enum";

class DependencyProvider {
  private providers: DependencyProviderData<any>[] = [
    {
      provide: BrowserMessagingService,
      useFactory: () => new BrowserMessagingService(),
    },
    {
      provide: BrowserMessagingPrivateModeBackgroundService,
      useFactory: () => new BrowserMessagingPrivateModeBackgroundService(),
    },
    {
      provide: ConsoleLogService,
      useFactory: () => new ConsoleLogService(false),
    },
    {
      provide: WebCryptoFunctionService,
      useFactory: () => new WebCryptoFunctionService(globalThis),
    },
    {
      provide: BrowserLocalStorageService,
      useFactory: () => new BrowserLocalStorageService(),
    },
    {
      provide: EncryptServiceImplementation,
      deps: [WebCryptoFunctionService, ConsoleLogService],
      useFactory: (
        webCryptoFunctionService: WebCryptoFunctionService,
        consoleLogService: ConsoleLogService,
      ) => new EncryptServiceImplementation(webCryptoFunctionService, consoleLogService, false),
    },
    {
      provide: KeyGenerationService,
      deps: [WebCryptoFunctionService],
      useFactory: (webCryptoFunctionService: WebCryptoFunctionService) =>
        new KeyGenerationService(webCryptoFunctionService),
    },
    {
      provide: LocalBackedSessionStorageService,
      deps: [EncryptServiceImplementation, KeyGenerationService],
      useFactory: (
        encryptServiceImplementation: EncryptServiceImplementation,
        keyGenerationService: KeyGenerationService,
      ) => new LocalBackedSessionStorageService(encryptServiceImplementation, keyGenerationService),
    },
  ];
}

export default DependencyProvider;
