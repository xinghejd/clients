import { BehaviorSubject, Observable } from "rxjs";
import { Jsonify } from "type-fest";

import { AbstractStorageService } from "../abstractions/storage.service";
import { GlobalState } from "../interfaces/global-state";
import { globalKeyBuilder } from "../misc/key-builders";

import { KeyDefinition } from "./key-definition";

export class DefaultGlobalState<T> implements GlobalState<T> {
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
