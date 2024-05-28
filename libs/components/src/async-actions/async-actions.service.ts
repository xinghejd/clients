import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

import { FunctionReturningAwaitable } from "../utils/function-to-observable";

export type ContextState = { status: "inactive" } | { status: "active"; origin: unknown };
export type Status = ContextState["status"];

@Injectable({
  providedIn: "root",
})
export class AsyncActionsService {
  state$(context: string): Observable<ContextState> {
    return of({ status: "inactive" });
  }

  /**
   * Takes a function that returns a promise or an observable and executes it, handling the loading state and errors.
   * - If the function returns a promise, the loading state will be set to true until the promise is resolved or rejected.
   * - If the function returns an observable, the loading state will be set to true until the observable emits, completes or errors.
   *   - The observable will be unsubscribed if the service is destroyed.
   * - Regular functions are also supported, but the loading state will not be set. This is useful for functions that might
   *   need to return early.
   *
   * @param context A string that will be used to group the loading state of multiple async actions.
   * @param origin The object that the action originated from.
   * @param handler The function to execute.
   */
  execute(
    context: string,
    origin: unknown,
    handler: FunctionReturningAwaitable,
  ): Observable<unknown> {
    throw new Error("Method not implemented.");
  }
}
