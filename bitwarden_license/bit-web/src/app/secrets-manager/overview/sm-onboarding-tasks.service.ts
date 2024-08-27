import { Injectable } from "@angular/core";
import { Observable, map, firstValueFrom } from "rxjs";

import {
  ActiveUserState,
  SM_ONBOARDING_DISK,
  StateProvider,
  UserKeyDefinition,
} from "@bitwarden/common/platform/state";

export type SMOnboardingTasks = Record<string, SMOnboardingTasksForOrg>;
export type SMOnboardingTasksForOrg = Record<string, boolean>;

const SM_ONBOARDING_TASKS_KEY = new UserKeyDefinition<SMOnboardingTasks>(
  SM_ONBOARDING_DISK,
  "tasks",
  {
    deserializer: (b) => b,
    clearOn: [], // Used to track tasks completed by a user, we don't want to reshow if they've locked or logged out and came back to the app
  },
);

@Injectable({
  providedIn: "root",
})
export class SMOnboardingTasksService {
  private smOnboardingTasks: ActiveUserState<SMOnboardingTasks>;
  smOnboardingTasks$: Observable<SMOnboardingTasks>;

  constructor(private stateProvider: StateProvider) {
    this.smOnboardingTasks = this.stateProvider.getActive(SM_ONBOARDING_TASKS_KEY);
    this.smOnboardingTasks$ = this.smOnboardingTasks.state$.pipe(map((tasks) => tasks ?? {}));
  }

  async getSmOnboardingTasks(orgId: string): Promise<SMOnboardingTasksForOrg> {
    return firstValueFrom(this.smOnboardingTasks$).then((allOrgTasks) => allOrgTasks[orgId]);
  }

  async setSmOnboardingTasks(newState: SMOnboardingTasks): Promise<void> {
    await this.smOnboardingTasks.update(() => {
      return { ...newState };
    });
  }

  async findFirstFalseTask(userIsAdmin: boolean, orgId: string): Promise<string> {
    if (orgId == undefined) {
      return null;
    }

    const excludeKeys = userIsAdmin ? [] : ["importData", "inviteYourTeam", "setUpIntegrations"];
    const orgTasks = await this.getSmOnboardingTasks(orgId);

    if (!orgTasks) {
      return null;
    }

    for (const [taskKey, taskValue] of Object.entries(orgTasks)) {
      if (!taskValue && !excludeKeys.includes(taskKey)) {
        return taskKey;
      }
    }

    return "";
  }
}
