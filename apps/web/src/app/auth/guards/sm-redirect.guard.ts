import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationBillingServiceAbstraction } from "@bitwarden/common/billing/abstractions/organization-billing.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

import { RouterService } from "../../core/router.service";

/**
 * Guard that redirects sm standalone users to sm on login.
 */
export function smRedirectGuard(): CanActivateFn {
  return async () => {
    const syncService = inject(SyncService);
    const organizationService = inject(OrganizationService);
    const organizationBillingService = inject(OrganizationBillingServiceAbstraction);
    const routerService = inject(RouterService);
    const stateService = inject(StateService);
    const router = inject(Router);

    const previousUrl = routerService.getPreviousUrl();

    // Only redirect to sm if the user isn't routing from somewhere else in the app
    if (!previousUrl) {
      // Workaround to avoid service initialization race condition.
      if ((await syncService.getLastSync()) == null) {
        await syncService.fullSync(false);
      }

      const organizations = await organizationService.getAll(await stateService.getUserId());
      // Only route to sm if the user is a member of a single organization that signed up specifically for secrets manager
      if (organizations.length === 1) {
        if (
          organizations[0].canAccessSecretsManager &&
          (await organizationBillingService.isOnSecretsManagerStandalone(organizations[0].id))
        ) {
          return router.createUrlTree(["/sm"]);
        }
      }
    }
    return true;
  };
}
