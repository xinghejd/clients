import { Observable, ReplaySubject, Subject, concatMap, merge, share, timer } from "rxjs";

import { DerivedStateDependencies } from "../../../types/state";
import {
  AbstractStorageService,
  ObservableStorageService,
} from "../../abstractions/storage.service";
import { DeriveDefinition } from "../derive-definition";
import { DerivedState } from "../derived-state";

type MemoryStoreType<T> = { derived: true; value: T };

/**
 * Default derived state
 */
export class DefaultDerivedState<TFrom, TTo, TDeps extends DerivedStateDependencies<TTo>>
  implements DerivedState<TTo>
{
  private readonly storageKey: string;
  private forcedValueSubject = new Subject<TTo>();

  state$: Observable<TTo>;

  constructor(
    private parentState$: Observable<TFrom>,
    protected deriveDefinition: DeriveDefinition<TFrom, TTo, TDeps>,
    private memoryStorage: AbstractStorageService & ObservableStorageService,
    dependencies: Omit<TDeps, "previousState">,
  ) {
    this.storageKey = deriveDefinition.storageKey;

    const derivedState$ = this.parentState$.pipe(
      concatMap(async (state) => {
        // Must force types here since `Omit` doesn't know we `previousState` is constrained to `TTo | undefined`
        const deps = { ...dependencies, previousState: undefined } as TDeps;
        if (deriveDefinition.includePreviousDerivedState) {
          deps.previousState = await this.retrieveValue();
        }
        let derivedStateOrPromise = this.deriveDefinition.derive(state, deps);
        if (derivedStateOrPromise instanceof Promise) {
          derivedStateOrPromise = await derivedStateOrPromise;
        }
        const derivedState = derivedStateOrPromise;
        await this.storeValue(derivedState);
        return derivedState;
      }),
    );

    this.state$ = merge(this.forcedValueSubject, derivedState$).pipe(
      share({
        connector: () => {
          return new ReplaySubject<TTo>(1);
        },
        resetOnRefCountZero: () =>
          timer(this.deriveDefinition.cleanupDelayMs).pipe(
            concatMap(async () => {
              if (this.deriveDefinition.clearOnCleanup) {
                await this.memoryStorage.remove(this.storageKey);
              }
              return true;
            }),
          ),
      }),
    );
  }

  async forceValue(value: TTo) {
    await this.storeValue(value);
    this.forcedValueSubject.next(value);
    return value;
  }

  private storeValue(value: TTo) {
    return this.memoryStorage.save(this.storageKey, { derived: true, value });
  }

  private retrieveValue() {
    return this.memoryStorage.get<MemoryStoreType<TTo>>(this.storageKey).then((v) => v?.value);
  }
}
