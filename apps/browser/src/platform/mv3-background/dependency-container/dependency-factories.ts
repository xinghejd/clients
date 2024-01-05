import { AbstractStorageService } from "@bitwarden/common/platform/abstractions/storage.service";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { MultithreadEncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/multithread-encrypt.service.implementation";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";
// eslint-disable-next-line import/no-restricted-paths -- We need the implementation to inject, but generally this should not be accessed
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";

import BrowserLocalStorageService from "../../services/browser-local-storage.service";
import BrowserMessagingService from "../../services/browser-messaging.service";
import { KeyGenerationService } from "../../services/key-generation.service";
import { LocalBackedSessionStorageService } from "../../services/local-backed-session-storage.service";

import DependencyContainer from "./dependency-container";

export const browserMessagingServiceFactory = () => new BrowserMessagingService();

export const consoleLogServiceFactory = (isDev: boolean) => () => new ConsoleLogService(isDev);

export const webCryptoFunctionServiceFactory = () => new WebCryptoFunctionService(globalThis);

export const localBackedSessionStorageServiceFactory = () => {
  const webCryptoFunctionService = DependencyContainer.resolve(WebCryptoFunctionService);
  const consoleLogService = DependencyContainer.resolve(ConsoleLogService);
  const encryptService = new EncryptServiceImplementation(
    webCryptoFunctionService,
    consoleLogService,
    false,
  );
  const keyGenerationService = new KeyGenerationService(webCryptoFunctionService);

  return new LocalBackedSessionStorageService(encryptService, keyGenerationService);
};

export const defaultGlobalStateProviderFactory = (storageService: AbstractStorageService) => {
  const localBackedSessionStorageService = DependencyContainer.resolve(
    LocalBackedSessionStorageService,
  );

  return () =>
    new DefaultGlobalStateProvider(
      localBackedSessionStorageService,
      storageService as BrowserLocalStorageService,
    );
};

export const multithreadEncryptServiceImplementationFactory = () => {
  const webCryptoFunctionService = DependencyContainer.resolve(WebCryptoFunctionService);
  const consoleLogService = DependencyContainer.resolve(ConsoleLogService);

  return () =>
    new MultithreadEncryptServiceImplementation(webCryptoFunctionService, consoleLogService, false);
};

export const encryptServiceImplementationFactory = () => {
  const webCryptoFunctionService = DependencyContainer.resolve(WebCryptoFunctionService);
  const consoleLogService = DependencyContainer.resolve(ConsoleLogService);

  return () => new EncryptServiceImplementation(webCryptoFunctionService, consoleLogService, true);
};
