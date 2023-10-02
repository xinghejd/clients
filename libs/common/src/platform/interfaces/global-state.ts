import { Observable } from "rxjs";

export interface GlobalState<T> {
  update: (configureState: (state: T) => void) => Promise<void>;
  state$: Observable<T>;
}
