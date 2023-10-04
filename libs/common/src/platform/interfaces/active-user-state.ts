import { Observable } from "rxjs";

import { DerivedActiveUserState } from "../services/default-active-user-state.provider";
import { DerivedStateDefinition } from "../types/derived-state-definition";

export interface ActiveUserState<T> {
  readonly state$: Observable<T>;
  readonly getFromState: () => Promise<T>;
  /**
   *
   * @param configureState function that takes the current state and returns the new state
   * @returns The new state
   */
  readonly update: (configureState: (state: T) => T) => Promise<T>;
  createDerived: <TTo>(
    derivedStateDefinition: DerivedStateDefinition<T, TTo>
  ) => DerivedActiveUserState<T, TTo>;
}
