import { BehaviorSubject, firstValueFrom } from "rxjs";

import { UserState } from "../src/platform/interfaces/user-state";

export class TestUserState<T> implements UserState<T> {
  private _state$: BehaviorSubject<T>;
  get state$() {
    return this._state$.asObservable();
  }

  constructor(initialValue: T) {
    this._state$ = new BehaviorSubject(initialValue);
  }

  getFromState = jest.fn();
  update = jest.fn().mockImplementation(this.minimalUpdate);
  createDerived = jest.fn();

  next(next: T) {
    this._state$.next(next);
  }

  complete() {
    this._state$.complete();
  }

  private async minimalUpdate(configureState: (state: T) => T) {
    const currentState = await firstValueFrom(this.state$);
    const newState = configureState(currentState);
    this._state$.next(newState);
    return newState;
  }
}
