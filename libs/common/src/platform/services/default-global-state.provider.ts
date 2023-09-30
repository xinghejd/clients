import { BehaviorSubject, Observable, defer, firstValueFrom } from "rxjs";

import { GlobalStateProvider } from "../abstractions/global-state.provider";
import { AbstractMemoryStorageService, AbstractStorageService } from "../abstractions/storage.service";
import { ActiveUserState } from "../interfaces/active-user-state";
import { KeyDefinition } from "../types/key-definition";
import { Jsonify } from "type-fest";
import { globalKeyBuilder } from "../misc/key-builders";



// TODO: Move type
export type StorageLocation = "memory" | "disk" | "secure";

// class DefaultGlobalState<T> implements ActiveUserState<T> {
//   private storageKey: string;

//   protected stateSubject: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);

//   state$: Observable<T>;

//   constructor(
//     private keyDefinition: KeyDefinition<T>,
//     private chosenLocation: AbstractStorageService
//   ) {
//     this.storageKey = globalKeyBuilder(this.keyDefinition);

//     // TODO: When subsribed to, we need to read data from the chosen storage location
//     // and give it back
//     this.state$ = new Observable<T>()
//   }

//   async update(configureState: (state: T) => void): Promise<void> {
//     const currentState = await firstValueFrom(this.state$);
//     configureState(currentState);
//     await this.chosenLocation.save(this.storageKey, currentState);
//     this.stateSubject.next(currentState);
//   }

//   async getFromState(): Promise<T> {
//     const data = await this.chosenLocation.get<Jsonify<T>>(this.storageKey);
//     return this.keyDefinition.serializer(data);
//   }
// }

// export class DefaultGlobalStateProvider implements GlobalStateProvider {
//   private globalStateCache: Record<string, DefaultGlobalState<unknown>> = {};

//   constructor(
//     private memoryStorage: AbstractMemoryStorageService,
//     private diskStorage: AbstractStorageService,
//     private secureStorage: AbstractStorageService) {
//   }

//   create<T>(keyDefinition: KeyDefinition<T>): DefaultGlobalState<T> {
//     const locationDomainKey = `${keyDefinition.stateDefinition.storageLocation}_${keyDefinition.stateDefinition.name}_${keyDefinition.key}`;
//     const existingGlobalState = this.globalStateCache[locationDomainKey];
//     if (existingGlobalState != null) {
//       // I have to cast out of the unknown generic but this should be safe if rules
//       // around domain token are made
//       return existingGlobalState as DefaultGlobalState<T>;
//     }


//     const newGlobalState = new DefaultGlobalState<T>(
//       keyDefinition,
//       this.getLocation(keyDefinition.stateDefinition.storageLocation)
//     );

//     this.globalStateCache[locationDomainKey] = newGlobalState;
//     return newGlobalState;
//   }

//   private getLocation(location: StorageLocation) {
//     switch (location) {
//       case "disk":
//         return this.diskStorage;
//       case "secure":
//         return this.secureStorage;
//       case "memory":
//         return this.memoryStorage;
//     }
//   }
// }
