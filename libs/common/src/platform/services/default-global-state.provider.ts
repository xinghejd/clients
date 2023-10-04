import { BehaviorSubject, Observable } from "rxjs";
import { Jsonify } from "type-fest";

import { GlobalStateProvider } from "../abstractions/global-state.provider";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "../abstractions/storage.service";
import { GlobalState } from "../interfaces/global-state";
import { globalKeyBuilder } from "../misc/key-builders";
import { KeyDefinition } from "../types/key-definition";

// TODO: Move type
export type StorageLocation = "memory" | "disk" | "secure";

class GlobalStateImplementation<T> implements GlobalState<T> {
  private storageKey: string;
  private seededPromise: Promise<void>;

  protected stateSubject: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);

  state$: Observable<T>;

  constructor(
    private keyDefinition: KeyDefinition<T>,
    private chosenLocation: AbstractStorageService
  ) {
    this.storageKey = globalKeyBuilder(this.keyDefinition);

    this.seededPromise = this.chosenLocation.get<Jsonify<T>>(this.storageKey).then((data) => {
      const serializedData = this.keyDefinition.deserializer(data);
      this.stateSubject.next(serializedData);
    });

    this.state$ = this.stateSubject.asObservable();
  }

  async update(configureState: (state: T) => void): Promise<void> {
    await this.seededPromise;
    const currentState = this.stateSubject.getValue();
    configureState(currentState);
    await this.chosenLocation.save(this.storageKey, currentState);
    this.stateSubject.next(currentState);
  }

  async getFromState(): Promise<T> {
    const data = await this.chosenLocation.get<Jsonify<T>>(this.storageKey);
    return this.keyDefinition.deserializer(data);
  }
}

export class DefaultGlobalStateProvider implements GlobalStateProvider {
  private globalStateCache: Record<string, GlobalState<unknown>> = {};

  constructor(
    private memoryStorage: AbstractMemoryStorageService,
    private diskStorage: AbstractStorageService,
    private secureStorage: AbstractStorageService
  ) {}

  create<T>(keyDefinition: KeyDefinition<T>): GlobalState<T> {
    const locationDomainKey = `${keyDefinition.stateDefinition.storageLocation}_${keyDefinition.stateDefinition.name}_${keyDefinition.key}`;
    const existingGlobalState = this.globalStateCache[locationDomainKey];
    if (existingGlobalState != null) {
      // I have to cast out of the unknown generic but this should be safe if rules
      // around domain token are made
      return existingGlobalState as GlobalStateImplementation<T>;
    }

    const newGlobalState = new GlobalStateImplementation<T>(
      keyDefinition,
      this.getLocation(keyDefinition.stateDefinition.storageLocation)
    );

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
