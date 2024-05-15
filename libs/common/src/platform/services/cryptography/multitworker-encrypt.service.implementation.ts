import { defaultIfEmpty, filter, firstValueFrom, fromEvent, map, Subject, takeUntil } from "rxjs";
import { Jsonify } from "type-fest";

// eslint-disable-next-line no-restricted-imports
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";

import { Utils } from "../../../platform/misc/utils";
import { ConfigService } from "../../abstractions/config/config.service";
import { CryptoFunctionService } from "../../abstractions/crypto-function.service";
import { LogService } from "../../abstractions/log.service";
import { Decryptable } from "../../interfaces/decryptable.interface";
import { InitializerMetadata } from "../../interfaces/initializer-metadata.interface";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";

import { EncryptServiceImplementation } from "./encrypt.service.implementation";
import { getClassInitializer } from "./get-class-initializer";
import { MultithreadEncryptServiceImplementation } from "./multithread-encrypt.service.implementation";

// TTL (time to live) is not strictly required but avoids tying up memory resources if inactive
const workerTTL = 60000; // 1 minute
const maxWorkers = 8;
const minNumberOfItemsForMultithreading = 500; // arbitrarily chosen, can be optimized further

export class MultiWorkerEncryptServiceImplementation extends EncryptServiceImplementation {
  private multithreadEncryptServiceImplementation: MultithreadEncryptServiceImplementation;
  private workers: Worker[] = [];
  private timeout: any;

  private clear$ = new Subject<void>();

  constructor(
    protected cryptoFunctionService: CryptoFunctionService,
    protected logService: LogService,
    protected configService: ConfigService,
    protected logMacFailures: boolean,
  ) {
    super(cryptoFunctionService, logService, logMacFailures);
    this.multithreadEncryptServiceImplementation = new MultithreadEncryptServiceImplementation(
      cryptoFunctionService,
      logService,
      logMacFailures,
    );
  }

  /**
   * Decrypts items using a web worker if the environment supports it.
   * Will fall back to the main thread if the window object is not available.
   */
  async decryptItems<T extends InitializerMetadata>(
    items: Decryptable<T>[],
    key: SymmetricCryptoKey,
  ): Promise<T[]> {
    if (items == null || items.length < 1) {
      return [];
    }

    // fall back to "old" single-worker background thread decryption when the featureflag is disabled
    if (
      !(await this.configService.getFeatureFlag(FeatureFlag.EnableMultiWorkerEncryptionService))
    ) {
      this.logService.info(
        "Multiworker decryption disabled, falling back to background thread decryption",
      );
      return this.multithreadEncryptServiceImplementation.decryptItems(items, key);
    }

    if (typeof window === "undefined") {
      return super.decryptItems(items, key);
    }

    const decryptedItems = await this.getDecryptedItemsFromWorkers(items, key);
    return decryptedItems;
  }

  /**
   * Sends items to a set of web workers to decrypt them. This utilizes multiple workers to decrypt items
   * faster without interrupting other operations (e.g. updating UI).
   */
  async getDecryptedItemsFromWorkers<T extends InitializerMetadata>(
    items: Decryptable<T>[],
    key: SymmetricCryptoKey,
  ): Promise<T[]> {
    if (items == null || items.length < 1) {
      return [];
    }

    this.clearTimeout();

    let numberOfWorkers = Math.min(navigator.hardwareConcurrency, maxWorkers);
    if (items.length < minNumberOfItemsForMultithreading) {
      numberOfWorkers = 1;
    }

    this.logService.info(
      "Starting decryption using multithreading with " +
        numberOfWorkers +
        " workers for " +
        items.length +
        " items",
    );

    if (this.workers.length == 0) {
      for (let i = 0; i < numberOfWorkers; i++) {
        this.workers.push(
          new Worker(
            new URL(
              /* webpackChunkName: 'encrypt-worker' */
              "@bitwarden/common/platform/services/cryptography/encrypt.worker.ts",
              import.meta.url,
            ),
          ),
        );
      }
    }

    const itemsPerWorker = Math.floor(items.length / this.workers.length);
    const results = [];

    for (const [i, worker] of this.workers.entries()) {
      const start = i * itemsPerWorker;
      const end = start + itemsPerWorker;
      const itemsForWorker = items.slice(start, end);

      // push the remaining items to the last worker
      if (i == this.workers.length - 1) {
        itemsForWorker.push(...items.slice(end));
      }

      const request = {
        id: Utils.newGuid(),
        items: itemsForWorker,
        key: key,
      };

      worker.postMessage(JSON.stringify(request));
      results.push(
        firstValueFrom(
          fromEvent(worker, "message").pipe(
            filter((response: MessageEvent) => response.data?.id === request.id),
            map((response) => JSON.parse(response.data.items)),
            map((items) =>
              items.map((jsonItem: Jsonify<T>) => {
                const initializer = getClassInitializer<T>(jsonItem.initializerKey);
                return initializer(jsonItem);
              }),
            ),
            takeUntil(this.clear$),
            defaultIfEmpty([]),
          ),
        ),
      );
    }

    const decryptedItems = (await Promise.all(results)).flat();
    this.logService.info(
      "Finished decrypting " +
        decryptedItems.length +
        " items using " +
        numberOfWorkers +
        " workers",
    );

    this.restartTimeout();

    return decryptedItems;
  }

  private clear() {
    this.clear$.next();
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.clearTimeout();
  }

  private restartTimeout() {
    this.clearTimeout();
    this.timeout = setTimeout(() => this.clear(), workerTTL);
  }

  private clearTimeout() {
    if (this.timeout != null) {
      clearTimeout(this.timeout);
    }
  }
}
