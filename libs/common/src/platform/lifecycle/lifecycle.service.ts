import { firstValueFrom } from "rxjs";

import { AccountService } from "../../auth/abstractions/account.service";
import { UserId } from "../../types/guid";

import {
  REGISTERED_EVENT_HANDLERS,
  LifeCycleInterface,
  LifeCycleEvent,
  operationNameFor,
} from "./responds-to.decorator";

export abstract class LifeCycleService {
  /**
   * Register a service as a handler for a specific event. All services that are registered for a specific event will be
   * called when that event is triggered.
   *
   * @remarks Event handling interfaces should be idempotent, such that they are callable multiple times without throwing
   * or performing unintended side effects.
   *
   * @remarks No guarantees are made about the order in which event handlers are called.
   *
   * @param target the event to register a service for. @see {@link LIFE_CYCLE_EVENTS} for valid events and descriptions.
   * @param service the service to register as a handler for the event.
   */
  static register<TTarget extends LifeCycleEvent>(
    target: TTarget,
    service: LifeCycleInterface<TTarget>,
  ) {
    REGISTERED_EVENT_HANDLERS[target].push(service as LifeCycleInterface<LifeCycleEvent>); // Meaningless cast
  }

  /**
   * Perform a lock operation on all registered services.
   * @param userId The user id to lock. If not provided, the active user id will be used.
   */
  abstract lock(userId?: UserId): Promise<void>;
  /**
   * Perform a logout operation on all registered services.
   * @param userId The user id to logout. If not provided, the active user id will be used.
   */
  abstract logout(userId?: UserId): Promise<void>;
}

export class DefaultLifeCycleService {
  constructor(private accountService: AccountService) {}

  async lock(userId?: UserId) {
    await this.performOperation("lock", userId);
  }

  async logout(userId?: UserId): Promise<void> {
    await this.performOperation("logout", userId);
  }

  private async performOperation<TTarget extends LifeCycleEvent>(
    target: TTarget,
    userId?: UserId,
  ): Promise<void> {
    userId = await this.resolveUserId(userId);
    const operation = operationNameFor(target);
    const operations = REGISTERED_EVENT_HANDLERS[target].map((service) => {
      const resultOrPromise = service[operation](userId);
      if (resultOrPromise instanceof Promise) {
        return resultOrPromise;
      }
      return Promise.resolve();
    });

    // Serialize await to avoid races during IO
    for (const operation of operations) {
      await operation;
    }
  }

  private async resolveUserId(userId?: UserId): Promise<UserId> {
    userId ??= (await firstValueFrom(this.accountService.activeAccount$))?.id;
    if (!userId) {
      throw new Error(
        "Cannot resolve user id: No user id provided and unable to resolve an active account.",
      );
    }
    return userId;
  }
}
