import { BehaviorSubject, Observable, defer, firstValueFrom, map, share, switchMap, tap } from "rxjs";
import { Jsonify } from "type-fest";

import { ActiveUserStateProvider } from "../abstractions/active-user-state.provider";
import { EncryptService } from "../abstractions/encrypt.service";
import { StateService } from "../abstractions/state.service";
import { AbstractMemoryStorageService, AbstractStorageService } from "../abstractions/storage.service";
import { ActiveUserState } from "../interfaces/active-user-state";
import { userKeyBuilder } from "../misc/key-builders";
import { UserKey } from "../models/domain/symmetric-crypto-key";
import { KeyDefinition } from "../types/key-definition";

import { StorageLocation } from "./default-global-state.provider";

class ConverterContext {
  constructor(
    readonly activeUserKey: UserKey,
    readonly encryptService: EncryptService
  ) { }
}

class DerivedStateDefinition<TFrom, TTo> {
  constructor(
    readonly converter: (data: TFrom, context: ConverterContext) => Promise<TTo>
  ) { }
}

export class DerivedActiveUserState<TFrom, TTo> {
  state$: Observable<TTo>

  // TODO: Probably needs to take state service
  /**
   *
   */
  constructor(
    private derivedStateDefinition: DerivedStateDefinition<TFrom, TTo>,
    private encryptService: EncryptService,
    private activeUserState: ActiveUserState<TFrom>
  ) {
    this.state$ = activeUserState.state$
      .pipe(switchMap(async from => {
        // TODO: How do I get the key?
        const convertedData = await derivedStateDefinition.converter(from, new ConverterContext(null, encryptService));
        return convertedData;
      }));
  }

  async getFromState(): Promise<TTo> {
    const encryptedFromState = await this.activeUserState.getFromState();

    const context = new ConverterContext(null, this.encryptService);

    const decryptedData = await this.derivedStateDefinition.converter(encryptedFromState, context);
    return decryptedData;
  }
}

class DefaultActiveUserState<T> implements ActiveUserState<T> {
  private seededInitial = false;

  private formattedKey$: Observable<string>;
  private chosenStorageLocation: AbstractStorageService;

  // TODO: Use BitSubject
  protected stateSubject: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);
  private stateSubject$ = this.stateSubject.asObservable();

  state$: Observable<T>;

  constructor(
    private keyDefinition: KeyDefinition<T>,
    private stateService: StateService,
    private encryptService: EncryptService,
    private memoryStorageService: AbstractMemoryStorageService,
    private secureStorageService: AbstractStorageService,
    private diskStorageService: AbstractStorageService
  ) {
    this.chosenStorageLocation = this.chooseStorage(
      this.keyDefinition.stateDefinition.storageLocation
    );

    const unformattedKey = `${this.keyDefinition.stateDefinition.name}_{userId}_${this.keyDefinition.key}`;

    // startWith?
    this.formattedKey$ = this.stateService.activeAccount$
      .pipe(
        map(accountId => accountId != null
          ? unformattedKey.replace("{userId}", accountId)
          : null)
      );

    const activeAccountData$ = this.formattedKey$
      .pipe(switchMap(async key => {
        console.log("user emitted", key);
        if (key == null) {
          return null;
        }
        const jsonData = await this.chosenStorageLocation.get<Jsonify<T>>(key);
        const data = keyDefinition.serializer(jsonData);
        return data;
      }),
        tap(data => {
          console.log("data:", data);
          this.stateSubject.next(data);
        }),
        // Share the execution
        share()
      );

    // Whomever subscribes to this data, should be notified of updated data
    // if someone calls my update() method, or the active user changes.
    this.state$ = defer(() => {
      console.log("starting subscription.");
      const subscription = activeAccountData$.subscribe();
      return this.stateSubject$
        .pipe(tap({
          complete: () => subscription.unsubscribe(),
        }));
    });
  }

  async update(configureState: (state: T) => void): Promise<void> {
    const currentState = await firstValueFrom(this.state$);
    console.log("data to update:", currentState);
    configureState(currentState);
    const key = await this.createKey();
    if (key == null) {
      throw new Error("Attempting to active user state, when no user is active.");
    }
    console.log(`updating ${key} to ${currentState}`);
    await this.chosenStorageLocation.save(await this.createKey(), currentState);
    this.stateSubject.next(currentState);
  }

  async getFromState(): Promise<T> {
    const activeUserId = await this.stateService.getUserId();
    const key = userKeyBuilder(activeUserId, this.keyDefinition);
    const data = await this.chosenStorageLocation.get(key) as Jsonify<T>;
    return this.keyDefinition.serializer(data);
  }

  createDerived<TTo>(derivedStateDefinition: DerivedStateDefinition<T, TTo>): DerivedActiveUserState<T, TTo> {
    return new DerivedActiveUserState<T, TTo>(
      derivedStateDefinition,
      this.encryptService,
      this
    );
  }

  private async createKey(): Promise<string> {
    return `${(await firstValueFrom(this.formattedKey$))}`;
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


export class DefaultActiveUserStateProvider implements ActiveUserStateProvider {
  private userStateCache: Record<string, DefaultActiveUserState<unknown>> = {};

  constructor(
    private stateService: StateService, // Inject the lightest weight service that provides accountUserId$
    private encryptService: EncryptService,
    private memoryStorage: AbstractMemoryStorageService,
    private diskStorage: AbstractStorageService,
    private secureStorage: AbstractStorageService) {
  }

  create<T>(keyDefinition: KeyDefinition<T>): DefaultActiveUserState<T> {
    const locationDomainKey =
      `${keyDefinition.stateDefinition.storageLocation}_${keyDefinition.stateDefinition.name}_${keyDefinition.key}`;
    const existingActiveUserState = this.userStateCache[locationDomainKey];
    if (existingActiveUserState != null) {
      // I have to cast out of the unknown generic but this should be safe if rules
      // around domain token are made
      return existingActiveUserState as DefaultActiveUserState<T>;
    }

    const newActiveUserState = new DefaultActiveUserState<T>(
      keyDefinition,
      this.stateService,
      this.encryptService,
      this.memoryStorage,
      this.secureStorage,
      this.diskStorage
    );
    this.userStateCache[locationDomainKey] = newActiveUserState;
    return newActiveUserState;
  }
}
