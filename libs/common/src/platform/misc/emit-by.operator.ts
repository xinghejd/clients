import { MonoTypeOperatorFunction, Observable } from "rxjs";

/**
 * Transparently passes through the source observable, but calls a callback if the source does not emit between each
 * emit of the trigger or beginning of the subscription.
 *
 * # Example
 * ```
 * timer(2, 1).pipe(emitBy(timer(1, 2), () => console.log('source did not emit')
 * ```
 * will log 'source did not emit' after 1ms, but will not log after that since the source emits every 1ms and we trigger
 * every 2ms.
 *
 * @param trigger Observable defining when to validate the source has emitted.
 * @param sourceDidNotEmitCallback Callback to call when the source did not emit since the last trigger.
 * @returns
 */
export function emitBy<T>(
  trigger: Observable<unknown>,
  sourceDidNotEmitCallback: () => void,
): MonoTypeOperatorFunction<T> {
  let sourceEmittedSinceTrigger = false;
  const innerSubscription = trigger.subscribe({
    next() {
      if (!sourceEmittedSinceTrigger) {
        sourceDidNotEmitCallback();
      }
      sourceEmittedSinceTrigger = false;
    },
    error(error: unknown) {
      sourceEmittedSinceTrigger = true;
      innerSubscription.unsubscribe();
    },
    complete() {
      sourceEmittedSinceTrigger = true;
      innerSubscription.unsubscribe();
    },
  });

  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(value) {
          sourceEmittedSinceTrigger = true;
          subscriber.next(value);
        },
        error(error: unknown) {
          innerSubscription.unsubscribe();
          subscriber.error(error);
        },
        complete() {
          innerSubscription.unsubscribe();
          subscriber.complete();
        },
      });

      return () => {
        innerSubscription.unsubscribe();
        subscription.unsubscribe();
      };
    });
  };
}
