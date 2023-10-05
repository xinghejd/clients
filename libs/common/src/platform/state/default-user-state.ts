import {
  Observable,
  BehaviorSubject,
  map,
  shareReplay,
  switchMap,
  tap,
  share,
  defer,
  firstValueFrom,
  combineLatestWith,
  filter,
} from "rxjs";
import { Jsonify } from "type-fest";

import { AccountService } from "../../auth/abstractions/account.service";
import { UserId } from "../../types/guid";
import { EncryptService } from "../abstractions/encrypt.service";
import {
  AbstractStorageService,
  AbstractMemoryStorageService,
} from "../abstractions/storage.service";
import { UserState } from "../interfaces/user-state";
import { userKeyBuilder } from "../misc/key-builders";

import { DerivedStateDefinition } from "./derived-state-definition";
import { DerivedUserState } from "./derived-user-state";
import { KeyDefinition } from "./key-definition";
import { StorageLocation } from "./state-definition";

// TODO: Update storage services to emit when any key is updated
// Then listen to that observable here to emit on `state$` when the `formattedKey$`
// is reported updated by the storage service;
export class DefaultUserState<T> implements UserState<T> {
  private seededInitial = false;

  private formattedKey$: Observable<string>;
  private chosenStorageLocation: AbstractStorageService;

  protected stateSubject: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);
  private stateSubject$ = this.stateSubject.asObservable();

  state$: Observable<T>;

  constructor(
    private keyDefinition: KeyDefinition<T>,
    private accountService: AccountService,
    private encryptService: EncryptService,
    private memoryStorageService: AbstractMemoryStorageService,
    private secureStorageService: AbstractStorageService,
    private diskStorageService: AbstractStorageService
  ) {
    this.chosenStorageLocation = this.chooseStorage(
      this.keyDefinition.stateDefinition.storageLocation
    );
    // startWith?
    this.formattedKey$ = this.accountService.activeAccount$.pipe(
      map((account) =>
        account != null && account.id != null
          ? userKeyBuilder(account.id, this.keyDefinition)
          : null
      ),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    const activeAccountData$ = this.formattedKey$.pipe(
      switchMap(async (key) => {
        if (key == null) {
          return null;
        }
        const jsonData = await this.chosenStorageLocation.get<Jsonify<T>>(key);
        const data = keyDefinition.deserializer(jsonData);
        return data;
      }),
      tap((data) => {
        this.seededInitial = true;
        this.stateSubject.next(data);
      }),
      // Share the execution
      share()
    );

    const storageUpdates$ = this.chosenStorageLocation.updates$.pipe(
      combineLatestWith(this.formattedKey$),
      filter(([update, key]) => update.key === key),
      map(([update]) => {
        return keyDefinition.deserializer(update.value as Jsonify<T>);
      })
    );

    // Whomever subscribes to this data, should be notified of updated data
    // if someone calls my update() method, or the active user changes.
    this.state$ = defer(() => {
      const accountChangeSubscription = activeAccountData$.subscribe();
      const storageUpdateSubscription = storageUpdates$.subscribe((data) => {
        this.stateSubject.next(data);
      });

      return this.stateSubject$.pipe(
        tap({
          complete: () => {
            accountChangeSubscription.unsubscribe();
            storageUpdateSubscription.unsubscribe();
          },
        })
      );
    });
  }

  async update(configureState: (state: T) => T): Promise<T> {
    const key = await this.createKey();
    if (key == null) {
      throw new Error("Attempting to active user state, when no user is active.");
    }
    const currentState = this.seededInitial
      ? this.stateSubject.getValue()
      : await this.seedInitial(key);

    const newState = configureState(currentState);

    await this.chosenStorageLocation.save(await this.createKey(), newState);
    return newState;
  }

  async updateFor(userId: UserId, configureState: (state: T) => T): Promise<T> {
    if (userId == null) {
      throw new Error("Attempting to update user state, but no userId has been supplied.");
    }

    const key = userKeyBuilder(userId, this.keyDefinition);
    const currentStore = await this.chosenStorageLocation.get<Jsonify<T>>(key);
    const currentState = this.keyDefinition.deserializer(currentStore);
    const newState = configureState(currentState);
    await this.chosenStorageLocation.save(key, newState);

    return newState;
  }

  async getFromState(): Promise<T> {
    const activeUser = await firstValueFrom(this.accountService.activeAccount$);
    if (activeUser == null || activeUser.id == null) {
      throw new Error("You cannot get data from state while there is no active user.");
    }
    const key = userKeyBuilder(activeUser.id, this.keyDefinition);
    const data = (await this.chosenStorageLocation.get(key)) as Jsonify<T>;
    return this.keyDefinition.deserializer(data);
  }

  createDerived<TTo>(
    derivedStateDefinition: DerivedStateDefinition<T, TTo>
  ): DerivedUserState<T, TTo> {
    return new DerivedUserState<T, TTo>(derivedStateDefinition, this.encryptService, this);
  }

  private async createKey(): Promise<string> {
    const formattedKey = await firstValueFrom(this.formattedKey$);
    if (formattedKey == null) {
      throw new Error("Cannot create a key while there is no active user.");
    }
    return formattedKey;
  }

  private async seedInitial(key: string): Promise<T> {
    const data = await this.chosenStorageLocation.get<Jsonify<T>>(key);
    this.seededInitial = true;
    return this.keyDefinition.deserializer(data);
  }

  private chooseStorage(storageLocation: StorageLocation): AbstractStorageService {
    switch (storageLocation) {
      case "disk":
        return this.diskStorageService;
      case "secure":
        return this.secureStorageService;
      case "memory":
        return this.memoryStorageService;
    }
  }
}
