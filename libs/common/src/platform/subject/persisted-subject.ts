import { ReplaySubject, firstValueFrom } from "rxjs";

import { LogService } from "../abstractions/log.service";
import { NamespacedStateService } from "../services/state/namespaced-state-service";
import { StorageLocation, StorageScope } from "../services/state/state-service-factory";

export class PersistedSubject<T = never> {
  private _subject = new ReplaySubject<T>(1);
  private _value: T;
  protected _initialized = false;

  constructor(
    private key: string,
    private location: StorageLocation,
    private stateService: NamespacedStateService,
    private logService: LogService
  ) {}

  // TODO MDG: it would be great to figure out if we can make this not async
  next(scope: StorageScope, value: T): Promise<void> {
    this._initialized = true;

    this.logService.info(`PersistedSubject: ${this.key} = ${value}`);
    return this.stateService.save(scope, this.key, value, this.location).then(() => {
      this.logService.debug(`PersistedSubject: ${this.key} saved, notifying subscribers`);
      this._value = value;
      this._subject.next(value);
    });
  }

  get value(): T {
    if (!this._initialized) {
      throw new Error("Cannot call getValue on an uninitialized BitSubject");
    }

    return this._value;
  }

  asObservable() {
    return this._subject.asObservable();
  }

  static initWith<T>(
    scope: StorageScope,
    value: T,
    key: string,
    location: StorageLocation,
    stateService: NamespacedStateService,
    logService: LogService
  ) {
    const subject = new PersistedSubject<T>(key, location, stateService, logService);
    subject.next(scope, value);
    return subject;
  }

  letInitialize(waitInMs = 100) {
    return Promise.race([
      firstValueFrom(this.asObservable()).then((v) => true),

      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), waitInMs);
      }),
    ]);
  }
}
