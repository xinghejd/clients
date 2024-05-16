import { BulkEncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/bulk-encrypt.service.implementation";

import {
  CryptoFunctionServiceInitOptions,
  cryptoFunctionServiceFactory,
} from "./crypto-function-service.factory";
import { EncryptServiceInitOptions } from "./encrypt-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { LogServiceInitOptions, logServiceFactory } from "./log-service.factory";

type BulkEncryptServiceFactoryOptions = FactoryOptions;

export type BulkEncryptServiceInitOptions = BulkEncryptServiceFactoryOptions &
  CryptoFunctionServiceInitOptions &
  LogServiceInitOptions;

export function bulkEncryptServiceFactory(
  cache: { bulkEncryptService?: BulkEncryptServiceImplementation } & CachedServices,
  opts: EncryptServiceInitOptions,
): Promise<BulkEncryptServiceImplementation> {
  return factory(
    cache,
    "bulkEncryptService",
    opts,
    async () =>
      new BulkEncryptServiceImplementation(
        await cryptoFunctionServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
      ),
  );
}
