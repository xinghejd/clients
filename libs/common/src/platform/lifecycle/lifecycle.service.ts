import { firstValueFrom } from "rxjs";

import { AccountService } from "../../auth/abstractions/account.service";
import { UserId } from "../../types/guid";

import {
  REGISTERED_TARGETS,
  LifeCycleInterface,
  RegistrationTarget,
  operationNameFor,
} from "./register.decorator";

export abstract class LifeCycleService {
  static register<TTarget extends RegistrationTarget>(
    target: TTarget,
    service: LifeCycleInterface<TTarget>,
  ) {
    REGISTERED_TARGETS[target].push(service as LifeCycleInterface<RegistrationTarget>); // Meaningless cast
  }

  abstract lock(userId?: UserId): Promise<void>;
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

  async performOperation<TTarget extends RegistrationTarget>(
    target: TTarget,
    userId?: UserId,
  ): Promise<void> {
    userId = await this.resolveUserId(userId);
    const operation = operationNameFor(target);
    const operations = REGISTERED_TARGETS[target].map((service) => {
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
