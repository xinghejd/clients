import { Observable } from "rxjs"

export interface State<T> {
  update: (configureState: (state: T) => void) => Promise<void>
  state$: Observable<T>
}
