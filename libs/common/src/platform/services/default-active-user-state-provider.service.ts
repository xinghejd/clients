import { BehaviorSubject, Observable, defer, distinctUntilChanged, filter, firstValueFrom, map, share, switchMap, tap } from "rxjs";
import { Jsonify } from "type-fest";

import { ActiveUserStateProviderService } from "../abstractions/active-user-state-provider.service";
import { StateService } from "../abstractions/state.service";
import { AbstractMemoryStorageService, AbstractStorageService } from "../abstractions/storage.service";
import { State } from "../interfaces/state";

import { DomainToken, StorageLocation } from "./default-global-state-provider.service";

class DefaultActiveUserState<T> implements State<T> {
  private formattedKey$: Observable<string>;

  // TODO: Use BitSubject
  protected stateSubject: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);
  private stateSubject$ = this.stateSubject.asObservable();

  state$: Observable<T>;

  // Global:
  // FolderService = <data>

  // User (super flat)
  // FolderService_{userId}_someData = <data>
  // FolderService_{userId}_moreData = <data>
  // -- or --
  // User (not as flat)
  // FolderService_{userId} = <data>

  constructor(
    private stateService: StateService,
    private storageLocation: AbstractStorageService,
    domainToken: DomainToken<T>) {

    const unformattedKey = `${domainToken.domainName}_{userId}`;

    // startWith?
    this.formattedKey$ = this.stateService.activeAccount$
      .pipe(
        distinctUntilChanged(),
        filter(account => account != null),
        map(accountId => unformattedKey.replace("{userId}", accountId))
      );

    // TODO: Don't use async if possible
    const activeAccountData$ = this.formattedKey$
      .pipe(switchMap(async key => {
          // TODO: Force this in the storages so I don't have to `as`
          const jsonData = await this.storageLocation.get<T>(key) as Jsonify<T>;
          const data = domainToken.serializer(jsonData);
          return data;
        }),
        tap(data => this.stateSubject.next(data)),
        // Share the execution
        share()
      );

    // Whomever subscribes to this data, should be notified of updated data
    // if someone calls my update() method, or the active user changes.
    this.state$ = defer(() => {
      const subscription = activeAccountData$.subscribe();
      return this.stateSubject$
        .pipe(tap({
          complete: () => subscription.unsubscribe(),
        }));
    });
  }

  async update(configureState: (state: T) => void): Promise<void> {
    // wait for lock
    try {
      const currentState = this.stateSubject.getValue();
      configureState(currentState);
      await this.storageLocation.save(await this.createKey(), currentState);
      this.stateSubject.next(currentState);
    }
    finally {
      // TODO: Free lock
    }
  }

  private async createKey(): Promise<string> {
    return await firstValueFrom(this.formattedKey$);
  }
}


export class DefaultActiveUserStateProviderService implements ActiveUserStateProviderService {
  private userStateCache: Record<string, DefaultActiveUserState<unknown>> = {};

  constructor(
    private stateService: StateService, // Inject the lightest weight service that provides accountUserId$
    private memoryStorage: AbstractMemoryStorageService,
    private diskStorage: AbstractStorageService,
    private secureStorage: AbstractStorageService) {
  }

  create<T>(location: StorageLocation, domainToken: DomainToken<T>): DefaultActiveUserState<T> {
    const locationDomainKey = `${location}_${domainToken.domainName}`;
    const existingActiveUserState = this.userStateCache[locationDomainKey];
    if (existingActiveUserState != null) {
      // I have to cast out of the unknown generic but this should be safe if rules
      // around domain token are made
      return existingActiveUserState as DefaultActiveUserState<T>;
    }

    const newActiveUserState = new DefaultActiveUserState<T>(
      this.stateService,
      this.getLocation(location),
      domainToken);
    this.userStateCache[locationDomainKey] = newActiveUserState;
    return newActiveUserState;
  }

  private getLocation(location: StorageLocation) {
    switch (location) {
      case "disk":
        return this.diskStorage;
      case "secure":
        return this.secureStorage;
      case "memory":
        return this.memoryStorage;
    }
  }
}
