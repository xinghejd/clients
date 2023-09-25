import { BehaviorSubject, Observable, defer, distinctUntilChanged, filter, firstValueFrom, forkJoin, map, merge, share, switchMap, tap } from "rxjs";
import { Jsonify } from "type-fest";

import { ActiveUserStateProviderService } from "../abstractions/active-user-state-provider.service";
import { GlobalStateProviderService } from "../abstractions/global-state-provider.service";
import { StateService } from "../abstractions/state.service";
import { AbstractMemoryStorageService, AbstractStorageService } from "../abstractions/storage.service";
import { State } from "../interfaces/state";

// TODO: Move type
// TODO: How can we protect the creation of these so that platform can maintain the allowed creations?
export class DomainToken<T> {
  constructor(
    public domainName: string,
    public serializer: (jsonData: Jsonify<T>) => T) {

  }
}

// TODO: Move type
export type StorageLocation = "memory" | "disk" | "secure";

class DefaultGlobalState<T> implements State<T> {
  protected stateSubject: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);

  state$: Observable<T>;

  constructor(private storageLocation: AbstractStorageService, private domainToken: DomainToken<T>) {
    this.state$ = this.stateSubject.asObservable();
  }

  async update(configureState: (state: T) => void): Promise<void> {
    // wait for lock
    try {
      const currentState = this.stateSubject.getValue();
      configureState(currentState);
      await this.storageLocation.save(this.domainToken.domainName, currentState);
      this.stateSubject.next(currentState);
    }
    finally {
      // TODO: Free lock
    }
  }
}

export class DefaultGlobalStateProviderService implements GlobalStateProviderService {
  private globalStateCache: Record<string, DefaultGlobalState<unknown>> = {};

  constructor(
    private memoryStorage: AbstractMemoryStorageService,
    private diskStorage: AbstractStorageService,
    private secureStorage: AbstractStorageService) {
  }

  create<T>(location: StorageLocation, domainToken: DomainToken<T>): DefaultGlobalState<T> {
    const locationDomainKey = `${location}_${domainToken.domainName}`;
    const existingGlobalState = this.globalStateCache[locationDomainKey];
    if (existingGlobalState != null) {
      // I have to cast out of the unknown generic but this should be safe if rules
      // around domain token are made
      return existingGlobalState as DefaultGlobalState<T>;
    }


    const newGlobalState = new DefaultGlobalState<T>(this.getLocation(location), domainToken);

    this.globalStateCache[locationDomainKey] = newGlobalState;
    return newGlobalState;
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
