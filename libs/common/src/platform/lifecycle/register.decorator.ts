import { Constructor } from "type-fest";

import { UserId } from "../../types/guid";

import { LifecycleService } from "./lifecycle.service";

const REGISTRATION_TARGETS = Object.freeze(["lock", "logout"] as const);
export type RegistrationTarget = (typeof REGISTRATION_TARGETS)[number];

export type LifecycleInterface<T extends RegistrationTarget> = {
  [K in `on${Capitalize<T>}`]: (userId?: UserId) => void | Promise<void>;
};

export function operationNameFor(target: RegistrationTarget) {
  return `on${target.charAt(0).toUpperCase()}${target.slice(1)}` as `on${Capitalize<RegistrationTarget>}`;
}

export const REGISTERED_TARGETS = Object.freeze(
  REGISTRATION_TARGETS.reduce(
    (acc, target) => {
      return {
        ...acc,
        [target]: [] as LifecycleInterface<RegistrationTarget>[],
      };
    },
    {} as Record<RegistrationTarget, LifecycleInterface<RegistrationTarget>[]>,
  ),
);

/**
 * Class decorator to register a service as a handler for a specific event. All services that are registered for a
 * specific event will be called when that event is triggered.
 *
 * @param target The event to register a service for.
 * @returns
 */
export function register<TRegistrationTarget extends RegistrationTarget>(
  target: TRegistrationTarget,
) {
  return <TCtor extends Constructor<LifecycleInterface<TRegistrationTarget>>>(
    constructor: TCtor,
  ) => {
    // `TRegistrationInterface`, and therefore the constructor's return type, aren't statically known. We need to cast to any.
    // This also necessitates the type checking while pushing to `eventTargets`.
    const anyCtor = constructor as Constructor<any>;
    return class extends anyCtor {
      constructor(...args: any[]) {
        super(...args);
        if (isRegistrationTarget(target, this)) {
          LifecycleService.register(target, this);
        }
      }
    } as TCtor; // This cast is safe because the adhoc constructor inherits from the passed in constructor.
  };
}

function isRegistrationTarget<T extends RegistrationTarget>(
  target: RegistrationTarget,
  instance: any,
): instance is LifecycleInterface<T> {
  return typeof instance[operationNameFor(target)] === "function";
}
