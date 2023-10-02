import { Observable } from "rxjs";

import { DerivedActiveUserState } from "../services/default-active-user-state.provider";
import { DerivedStateDefinition } from "../types/derived-state-definition";

export interface ActiveUserState<T> {
  readonly state$: Observable<T>;
  readonly getFromState: () => Promise<T>;
  readonly update: (configureState: (state: T) => void) => Promise<void>;
  createDerived: <TTo>(
    derivedStateDefinition: DerivedStateDefinition<T, TTo>
  ) => DerivedActiveUserState<T, TTo>;
}
