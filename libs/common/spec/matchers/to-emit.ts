import { Observable, Subscription } from "rxjs";

/** Asserts that an observable emitted any value */
export const toEmit: jest.CustomMatcher = async function toEmit<T>(
  received: Observable<T>,
  timeoutMs = 100
) {
  return new Promise((resolve) => {
    let subscription: Subscription = undefined;
    const timeout = setTimeout(() => {
      subscription?.unsubscribe();
      resolve({
        pass: false,
        message: () => "expected observable to emit",
      });
    }, timeoutMs);

    subscription = received.subscribe(() => {
      clearTimeout(timeout);
      resolve({
        pass: true,
        message: () => "expected observable not to emit",
      });
    });
  });
};

/** Asserts that the first value emitted from an observable is equal to the expected value.
 * Optionally, a comparer function can be provided to compare the values. By default, a strict equality check is used.
 */
export const toEmitValue: jest.CustomMatcher = async function toEmitValue<T>(
  received: Observable<T>,
  expected: T,
  comparer?: (a: T, b: T) => boolean,
  timeoutMs = 100
) {
  comparer = comparer ?? ((a, b) => a === b);
  let emitted = false;
  const value = await new Promise<T>((resolve) => {
    let subscription: Subscription = undefined;
    const timeout = setTimeout(() => {
      subscription?.unsubscribe();
      resolve(undefined);
    }, timeoutMs);

    subscription = received.subscribe((value) => {
      clearTimeout(timeout);
      emitted = true;
      resolve(value);
    });
  });

  return {
    pass: emitted && comparer(value, expected),
    message: () =>
      comparer(value, expected)
        ? emitted
          ? `expected observable not to emit ${expected}`
          : `expected observable to emit ${expected}, but it did not emit`
        : `expected observable to emit ${expected}, but it emitted `,
  };
};
