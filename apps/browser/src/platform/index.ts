import type { Container } from "inversify";
import { merge, Subject } from "rxjs";

import { ClientType } from "@bitwarden/common/enums";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { KeyGenerationService } from "@bitwarden/common/platform/abstractions/key-generation.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AbstractStorageService,
  ObservableStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { Message, MessageListener, MessageSender } from "@bitwarden/common/platform/messaging";
import { SubjectMessageSender } from "@bitwarden/common/platform/messaging/subject-message.sender";
import { Lazy } from "@bitwarden/common/platform/misc/lazy";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { MultithreadEncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/multithread-encrypt.service.implementation";
import { StorageServiceProvider } from "@bitwarden/common/platform/services/storage-service.provider";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";

import { BrowserApi } from "./browser/browser-api";
import { ChromeMessageSender } from "./messaging/chrome-message.sender";
import { OffscreenDocumentService } from "./offscreen-document/abstractions/offscreen-document";
import BrowserLocalStorageService from "./services/browser-local-storage.service";
import BrowserMemoryStorageService from "./services/browser-memory-storage.service";
import { BackgroundPlatformUtilsService } from "./services/platform-utils/background-platform-utils.service";
import { BackgroundMemoryStorageService } from "./storage/background-memory-storage.service";
import { BrowserStorageServiceProvider } from "./storage/browser-storage-service.provider";
import { ForegroundMemoryStorageService } from "./storage/foreground-memory-storage.service";
import { fromChromeRuntimeMessaging } from "./utils/from-chrome-runtime-messaging";

export function addBrowserPlatformServices(container: Container, popupOnlyContext: boolean) {
  container.bind<boolean>("POPUP_ONLY_CONTEXT").toConstantValue(popupOnlyContext);
  container.bind<ClientType>("CLIENT_TYPE").toConstantValue(ClientType.Browser);

  container.bind<2 | 3>("MANIFEST_VERSION").toConstantValue(BrowserApi.manifestVersion);

  container.bind<boolean>("IS_DEV").toConstantValue(process.env.ENV === "development");

  container
    .bind<AbstractStorageService & ObservableStorageService>("DISK_STORAGE")
    .toConstructor(BrowserLocalStorageService);

  container
    .bind<BrowserMemoryStorageService>("BROWSER_SESSION_STORAGE")
    .toConstructor(BrowserMemoryStorageService);

  container.bind("MEMORY_STORAGE_FOR_STATE_PROVIDERS").toDynamicValue((context) => {
    const manifestVersion = context.container.get<2 | 3>("MANIFEST_VERSION");
    if (manifestVersion === 3) {
      return context.container.get("BROWSER_SESSION_STORAGE");
    } else if (context.container.get("POPUP_ONLY_CONTEXT") === true) {
      return new ForegroundMemoryStorageService();
    } else {
      return new BackgroundMemoryStorageService();
    }
  });

  container.bind("MEMORY_STORAGE").toDynamicValue((context) => {
    const manifestVersion = context.container.get("MANIFEST_VERSION");
    if (manifestVersion === 3) {
      return context.container.get("MEMORY_STORAGE_FOR_STATE_PROVIDERS");
    }
  });

  container.bind("SECURE_STORAGE").toService("DISK_STORAGE");

  container
    .bind(StorageServiceProvider)
    .toDynamicValue(
      (context) =>
        new BrowserStorageServiceProvider(
          context.container.get("DISK_STORAGE"),
          context.container.get("MEMORY_STORAGE"),
          context.container.get("LARGE_OBJECT_MEMORY_STORAGE"),
        ),
    )
    .inSingletonScope();

  container
    .bind(CryptoFunctionService)
    .toDynamicValue(() => new WebCryptoFunctionService(self))
    .inSingletonScope();

  container
    .bind(MessageSender)
    .toDynamicValue((context) =>
      MessageSender.combine(
        new SubjectMessageSender(context.container.get("INTRAPROCESS_MESSAGING_SUBJECT")),
        new ChromeMessageSender(context.container.get(LogService)),
      ),
    )
    .inSingletonScope();

  container
    .bind(MessageListener)
    .toDynamicValue(
      (context) =>
        new MessageListener(
          merge(
            context.container.get<Subject<Message<Record<string, unknown>>>>(
              "INTRAPROCESS_MESSAGING_SUBJECT",
            ),
            fromChromeRuntimeMessaging(),
          ),
        ),
    )
    .inSingletonScope();

  container
    .bind(PlatformUtilsService)
    .toDynamicValue(
      (context) =>
        new BackgroundPlatformUtilsService(
          context.container.get(MessageSender),
          context.container.get("CLIPBOARD_WRITE_CALLBACK"),
          context.container.get("BIOMETRIC_CALLBACK"),
          self,
          context.container.get(OffscreenDocumentService),
        ),
    )
    .inSingletonScope();

  container
    .bind<Lazy<Promise<SymmetricCryptoKey>>>("LAZY_SESSION_KEY")
    .toDynamicValue(
      (context) =>
        new Lazy(async () => {
          const sessionStorage =
            context.container.get<BrowserMemoryStorageService>("BROWSER_SESSION_STORAGE");

          const existingKey = await sessionStorage.get<SymmetricCryptoKey>("session-key");
          if (existingKey) {
            if (sessionStorage.valuesRequireDeserialization) {
              return SymmetricCryptoKey.fromJSON(existingKey);
            }
            return existingKey;
          }

          const keyGenerationService = context.container.get(KeyGenerationService);
          // New key
          const { derivedKey } = await keyGenerationService.createKeyWithPurpose(
            128,
            "ephemeral",
            "bitwarden-ephemeral",
          );
          await sessionStorage.save("session-key", derivedKey);
          return derivedKey;
        }),
    )
    .inSingletonScope();

  container
    .bind(EncryptService)
    .toDynamicValue((context) => {
      const manifestVersion = context.container.get<2 | 3>("MANIFEST_VERSION");
      if (manifestVersion === 2) {
        return new MultithreadEncryptServiceImplementation(
          context.container.get(CryptoFunctionService),
          context.container.get(LogService),
          true,
        );
      } else {
        return new EncryptServiceImplementation(
          context.container.get(CryptoFunctionService),
          context.container.get(LogService),
          true,
        );
      }
    })
    .inSingletonScope();
}
