import { GlobalStateProvider } from "../abstractions/global-state.provider";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "../abstractions/storage.service";
import { GlobalState } from "../interfaces/global-state";

import { DefaultGlobalState } from "./default-global-state";
import { KeyDefinition } from "./key-definition";
import { StorageLocation } from "./state-definition";

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
      return existingGlobalState as DefaultGlobalState<T>;
    }

    const newGlobalState = new DefaultGlobalState<T>(
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
