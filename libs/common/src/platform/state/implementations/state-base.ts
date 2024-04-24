import {
  Observable,
  ReplaySubject,
  defer,
  filter,
  firstValueFrom,
  merge,
  share,
  switchMap,
  timeout,
  timer,
} from "rxjs";
import { Jsonify } from "type-fest";

import { StorageKey } from "../../../types/state";
import { LogService } from "../../abstractions/log.service";
import {
  AbstractStorageService,
  ObservableStorageService,
} from "../../abstractions/storage.service";
import { StateUpdateOptions, populateOptionsWithDefault } from "../state-update-options";

import { getStoredValue } from "./util";

// The parts of a KeyDefinition this class cares about to make it work
type KeyDefinitionRequirements<T> = {
  deserializer: (jsonState: Jsonify<T>) => T;
  cleanupDelayMs: number;
};

export abstract class StateBase<T, KeyDef extends KeyDefinitionRequirements<T>> {
  private updatePromise: Promise<T>;

  readonly state$: Observable<T>;

  constructor(
    protected readonly key: StorageKey,
    protected readonly storageService: AbstractStorageService & ObservableStorageService,
    protected readonly keyDefinition: KeyDef,
    private readonly isDev: boolean,
    private readonly logService: LogService,
  ) {
    const storageUpdate$ = storageService.updates$.pipe(
      filter((storageUpdate) => storageUpdate.key === key),
      switchMap(async (storageUpdate) => {
        if (storageUpdate.updateType === "remove") {
          return null;
        }

        return await getStoredValue(key, storageService, keyDefinition.deserializer);
      }),
    );

    this.state$ = merge(
      defer(() => getStoredValue(key, storageService, keyDefinition.deserializer)),
      storageUpdate$,
    ).pipe(
      share({
        connector: () => new ReplaySubject(1),
        resetOnRefCountZero: () => timer(keyDefinition.cleanupDelayMs),
      }),
    );
  }

  async update<TCombine>(
    configureState: (state: T, dependency: TCombine) => T,
    options: StateUpdateOptions<T, TCombine> = {},
  ): Promise<T> {
    options = populateOptionsWithDefault(options);
    if (this.updatePromise != null) {
      await this.updatePromise;
    }

    try {
      this.updatePromise = this.internalUpdate(configureState, options);
      const newState = await this.updatePromise;
      return newState;
    } finally {
      this.updatePromise = null;
    }
  }

  private async internalUpdate<TCombine>(
    configureState: (state: T, dependency: TCombine) => T,
    options: StateUpdateOptions<T, TCombine>,
  ): Promise<T> {
    const currentState = await this.getStateForUpdate();
    const combinedDependencies =
      options.combineLatestWith != null
        ? await firstValueFrom(options.combineLatestWith.pipe(timeout(options.msTimeout)))
        : null;

    if (!options.shouldUpdate(currentState, combinedDependencies)) {
      return currentState;
    }

    const newState = configureState(currentState, combinedDependencies);
    if (this.isDev && valuesEquivalent(currentState, newState)) {
      this.logService.warning(
        `State update for ${this.key} was likely unnecessary.
        Please add a shouldUpdate check to avoid unnecessary work.
        ${currentState}
        ${newState}`,
      );
    }

    await this.doStorageSave(newState, currentState);
    return newState;
  }

  protected async doStorageSave(newState: T, oldState: T) {
    await this.storageService.save(this.key, newState);
  }

  /** For use in update methods, does not wait for update to complete before yielding state.
   * The expectation is that that await is already done
   */
  private async getStateForUpdate() {
    return await getStoredValue(this.key, this.storageService, this.keyDefinition.deserializer);
  }
}

function valuesEquivalent<T>(value1: T, value2: T): boolean {
  if (value1 == null && value2 == null) {
    return true;
  }

  if (value1 && value2 == null) {
    return false;
  }

  if (value1 == null && value2) {
    return false;
  }

  if (typeof value1 !== "object" || typeof value2 !== "object") {
    return value1 === value2;
  }

  return JSON.stringify(value1) === JSON.stringify(value2);
}
