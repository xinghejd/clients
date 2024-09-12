import { filter, map, ObservableInput, OperatorFunction, pipe, switchMap } from "rxjs";

/**
 * Indicates that the given set of actions is not supported and there is
 * not anything the user can do to make it supported. The reason property
 * should contain a documented and machine readable string so more in
 * depth details can be shown to the user.
 */
export type NotSupported = { type: "not-supported"; reason: string };

/**
 * Indicates that the given set of actions does not currently work but
 * could be supported if configuration, either inside Bitwarden or outside,
 * is done. The reason property should contain a documented and
 * machine readable string so further instruction can be supplied to the caller.
 */
export type NeedsConfiguration = { type: "needs-configuration"; reason: string };

/**
 * Indicates that the actions in the service property are supported.
 */
export type Supported<T> = { type: "supported"; service: T };

/**
 * A type encapsulating the status of support for a service.
 */
export type SupportStatus<T> = Supported<T> | NeedsConfiguration | NotSupported;

export function filterSupported<T>(): OperatorFunction<SupportStatus<T>, T> {
  return pipe(
    filter<SupportStatus<T>>((supportStatus) => supportStatus.type === "supported"),
    map<Supported<T>, T>((supportStatus) => supportStatus.service),
  );
}

export function supportSwitch<TService, TSupported, TNotSupported>(selectors: {
  supported: (service: TService, index: number) => ObservableInput<TSupported>;
  notSupported: (index: number) => ObservableInput<TNotSupported>;
}): OperatorFunction<SupportStatus<TService>, TSupported | TNotSupported> {
  return switchMap((supportStatus, index) => {
    if (supportStatus.type === "supported") {
      return selectors.supported(supportStatus.service, index);
    }

    return selectors.notSupported(index);
  });
}
