import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, createUrlTreeFromSnapshot } from "@angular/router";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { RouterService } from "@bitwarden/web-vault/app/core";

import { SMOnboardingTasksService } from "../overview/sm-onboarding-tasks.service";

export const organizationOnboardingGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const syncService = inject(SyncService);
  const orgService = inject(OrganizationService);
  const smOnboardingTasksService = inject(SMOnboardingTasksService);
  const routerService = inject(RouterService);

  // Workaround to avoid service initialization race condition.
  if ((await syncService.getLastSync()) == null) {
    await syncService.fullSync(false);
  }

  const org = await orgService.get(route.params.organizationId);
  const showOnboarding =
    (await smOnboardingTasksService.findFirstFalseTask(org.isAdmin, org.id)) != "";
  const prevUrl = routerService.getPreviousUrl();
  let ignoreRedirect = true;
  if (prevUrl != null || prevUrl != undefined) {
    ignoreRedirect = prevUrl.includes("sm");
  }

  if (showOnboarding && !ignoreRedirect) {
    return createUrlTreeFromSnapshot(route, ["/sm", org.id, "sm-onboarding"]);
  }

  return true;
};
