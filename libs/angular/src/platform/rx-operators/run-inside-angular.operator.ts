import { NgZone } from "@angular/core";
import { MonoTypeOperatorFunction, Observable } from "rxjs";

/**
 * Runs the observable in the specified zone.
 * @param zone NgZone to run in
 * @returns
 */
export function runInsideAngular<T>(ngZone: NgZone): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(value) {
          ngZone.run(() => subscriber.next(value));
        },
        error(error: unknown) {
          ngZone.run(() => subscriber.error(error));
        },
        complete() {
          ngZone.run(() => subscriber.complete());
        },
      });

      return () => subscription.unsubscribe();
    });
}
