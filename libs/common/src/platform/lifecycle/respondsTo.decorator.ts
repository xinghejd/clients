import { Constructor } from "type-fest";

import { UserId } from "../../types/guid";

import { LifeCycleService } from "./lifecycle.service";

/**
 * The events that a service can register to respond to.
 *
 * - `lock` - The user's account has been locked. Triggered on every lock of every user.
 * - `logout` - The user has been logged out. Triggered on every logout of every user.
 *
 * @readonly
 */
const LIFE_CYCLE_EVENTS = Object.freeze(["lock", "logout"] as const);
export type LifeCycleEvent = (typeof LIFE_CYCLE_EVENTS)[number];

export type LifeCycleInterface<T extends LifeCycleEvent> = {
  [K in `on${Capitalize<T>}`]: (userId: UserId) => void | Promise<void>;
};

export function operationNameFor(target: LifeCycleEvent) {
  return `on${target.charAt(0).toUpperCase()}${target.slice(1)}` as `on${Capitalize<LifeCycleEvent>}`;
}

export const REGISTERED_EVENT_HANDLERS = Object.freeze(
  LIFE_CYCLE_EVENTS.reduce(
    (acc, target) => {
      return {
        ...acc,
        [target]: [] as LifeCycleInterface<LifeCycleEvent>[],
      };
    },
    {} as Record<LifeCycleEvent, LifeCycleInterface<LifeCycleEvent>[]>,
  ),
);

/**
 * Class decorator to register a service as a handler for a specific event. All services that are registered for a
 * specific event will be called when that event is triggered.
 *
 * @param target The event to register a service for. @see {@link LIFE_CYCLE_EVENTS} for valid events and descriptions.
 */
export function respondsTo<TEvent extends LifeCycleEvent>(target: TEvent) {
  return <TCtor extends Constructor<LifeCycleInterface<TEvent>>>(constructor: TCtor) => {
    // `TEvent`, and therefore the constructor's return type, aren't statically known. We need to cast to any.
    // This also necessitates the type checking while pushing to `eventTargets` and returning the new constructor.
    const anyCtor = constructor as Constructor<any>;
    return class extends anyCtor {
      constructor(...args: any[]) {
        super(...args);
        if (isLifeCycleEventHandler(target, this)) {
          LifeCycleService.register(target, this);
        }
      }
    } as TCtor; // This cast is safe because the adhoc constructor inherits from the passed in constructor.
  };
}

function isLifeCycleEventHandler<T extends LifeCycleEvent>(
  target: LifeCycleEvent,
  instance: any,
): instance is LifeCycleInterface<T> {
  return typeof instance[operationNameFor(target)] === "function";
}
