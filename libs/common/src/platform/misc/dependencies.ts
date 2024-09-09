import {
  catchError,
  EMPTY,
  filter,
  from,
  map,
  merge,
  NEVER,
  Observable,
  pairwise,
  shareReplay,
  startWith,
  Subject,
  SubscriptionLike,
  switchMap,
  takeUntil,
} from "rxjs";

import { AccountService } from "../../auth/abstractions/account.service";
import { AuthService } from "../../auth/abstractions/auth.service";
import { AuthenticationStatus } from "../../auth/enums/authentication-status";
import { FromDependency, SingleUserDependency, UserChangedError } from "../../tools/dependencies";
import { UserId } from "../../types/guid";
// eslint-disable-next-line import/no-restricted-paths -- playing around
import { CLEAR_EVENT_TO_AUTH_STATUS, ClearEvent } from "../state/user-key-definition";

/**
 * Builds a function which will return an observable that will complete when the specified user events are triggered.
 * @param authService auth service dependency. This is used to get the current user's authentication status
 * @param options options for the complete event trigger
 * @param options.completeOn The user events to trigger the completion
 * @param options.cascade Whether or not to complete on all events greater than the specified event.
 * For example, if cascade is true and the "lock" event is specified. If a user "logout" event is
 * triggered, the completion will triggered.
 * @returns
 */
function buildUserComplete(
  authService: AuthService,
  { completeOn, cascade }: { completeOn: ClearEvent[]; cascade: boolean },
) {
  const completeStatuses = completeOn.map(
    (event) => CLEAR_EVENT_TO_AUTH_STATUS[event],
  ) as AuthenticationStatus[];
  return (userId: UserId) => {
    return completeStatuses.length > 0
      ? authService.authStatusFor$(userId).pipe(
          filter((status) => {
            if (cascade) {
              return completeStatuses.find((s) => s >= status) != null;
            } else {
              completeStatuses.includes(status);
            }
          }),
        )
      : NEVER;
  };
}

export function currentActiveUser(
  accountService: AccountService,
  authService: AuthService,
  { completeOn }: { completeOn?: ClearEvent[] } = { completeOn: [] },
): SingleUserDependency {
  const completeFor$ = buildUserComplete(authService, {
    completeOn: completeOn ?? [],
    cascade: true,
  });
  const completeSubject = new Subject<void>();
  let completeSubscription: SubscriptionLike;
  const dependency$ = accountService.activeAccount$.pipe(
    map((a) => a.id),
    startWith(null),
    pairwise(),
    switchMap(([prev, next]) => {
      prev ??= next;
      if (prev !== next) {
        return EMPTY;
      }
      if (!completeSubscription) {
        completeSubscription = completeFor$(next).subscribe({
          next: () => {
            completeSubject.next();
            completeSubscription.unsubscribe();
            completeSubscription = undefined;
          },
        });
      }
      return from([next]);
    }),
  );
  return buildSingleUserDependency(dependency$, completeSubject);
}

/**
 * Generic helper function that builds a SingleUserDependency from an Observable<UserId>.
 *
 * @param dependency$ The observable that emits the user id. @see {@link SingleUserDependency} for more information on
 * @param destroy$ the observable that will trigger the completion of the returned observable
 * requirements on the dependency observable
 */
export function buildSingleUserDependency(
  dependency$: Observable<UserId>,
  destroy$: Observable<unknown>,
): SingleUserDependency {
  const validated$ = buildSingleValueObservable(dependency$, destroy$).pipe(
    catchError((err: unknown) => {
      const singleValueError = err as ValueChangedError<UserId>;
      throw {
        expectedUserId: singleValueError.expectedValue,
        actualUserId: singleValueError.actualValue,
      } as UserChangedError;
    }),
  );
  return {
    singleUserId$: validated$,
  };
}

/** error emitted when the `SingleUserDependency` changes Ids */
export type ValueChangedError<T> = {
  /** the value pinned by the single user dependency */
  expectedValue: T;
  /** the value received in error */
  actualValue: T;
};

const DEFAULT_SINGLE_VALUE_DEPENDENCY_OPTIONS = Object.freeze({
  errorOnChange: true,
  comparer: (prev: unknown, next: unknown) => prev === next,
} as const);

/**
 *
 * @param dependency$ The observable that emits the value.
 * @param destroy$ the observable that will trigger the completion of the returned observable
 * @param options.errorOnChange Whether or not to throw an error when the value changes. Defaults to true
 * @param options.comparer A function that compares the previous and next values. Defaults to a strict equality check
 * @returns
 */
export function buildSingleValueObservable<T>(
  dependency$: Observable<T>,
  destroy$: Observable<unknown>,
  options: {
    errorOnChange?: boolean;
    comparer?: (prev: T, next: T) => boolean;
  } = DEFAULT_SINGLE_VALUE_DEPENDENCY_OPTIONS,
): Observable<T> {
  options = { ...DEFAULT_SINGLE_VALUE_DEPENDENCY_OPTIONS, ...options };

  const onNewValue = (prev: T, next: T) => {
    if (options.errorOnChange) {
      throw { expectedValue: prev, actualValue: next } as ValueChangedError<T>;
    } else {
      return EMPTY;
    }
  };

  const internalDestroy$ = new Subject<void>();
  let destroyed = false;
  const destroySubscription = merge(destroy$, internalDestroy$).subscribe({
    next: () => {
      if (!destroyed) {
        destroyed = true;
        destroySubscription.unsubscribe();
      }
    },
  });

  const cleaned$ = dependency$.pipe(
    startWith(null),
    pairwise(),
    switchMap(([prev, next]) => {
      prev ??= next;
      if (!options.comparer(prev, next)) {
        return onNewValue(prev, next);
      }

      return from([next]);
    }),
    shareReplay({
      bufferSize: 1,
      refCount: false,
    }),
    takeUntil(destroy$),
  );

  return new Observable<T>((observer) => {
    // Ensure that late subscribers cannot access the stream
    // TODO: Is this a good idea? it might cause things to fail in unexpected ways.
    // For example, logging out right after api key update would cause the userID stream to error, meaning that the local storage of data would fail.
    //    I think it's probably a good idea. this blocks late subscribers, but as long as all operations are piped into a single observable,
    //    all subscriptions occur when that observable is subscribed to.
    if (destroyed) {
      throw new Error("Stream has been destroyed");
    }

    const subscription = cleaned$.subscribe({
      next: (value) => {
        observer.next(value);
      },
      error: (err: unknown) => {
        observer.error(err);
        internalDestroy$.next();
      },
      complete: () => {
        observer.complete();
        internalDestroy$.next();
      },
    });

    return () => {
      subscription.unsubscribe();
      internalDestroy$.next();
    };
  });
}

export function buildFromDependency<TPrecursor>(
  dependency$: Observable<TPrecursor>,
): FromDependency<TPrecursor> {
  return {
    from$: dependency$,
  };
}
