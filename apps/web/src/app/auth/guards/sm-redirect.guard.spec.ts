import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter, withDebugTracing } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { MockProxy, mock } from "jest-mock-extended";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { OrganizationBillingServiceAbstraction } from "@bitwarden/common/billing/abstractions/organization-billing.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

import { RouterService } from "../../core/router.service";

import { smRedirectGuard } from "./sm-redirect.guard";

@Component({
  template: "",
})
export class GuardedRouteTestComponent {}

@Component({
  template: "",
})
export class RedirectTestComponent {}

describe("SM Redirect Guard", () => {
  let syncService: MockProxy<SyncService>;
  let organizationService: MockProxy<OrganizationService>;
  let organizationBillingService: MockProxy<OrganizationBillingServiceAbstraction>;
  let stateService: MockProxy<StateService>;
  let routerService: MockProxy<RouterService>;
  let routerHarness: RouterTestingHarness;
  let routerSpy: jest.SpyInstance;

  const smOrg1 = { id: "123", canAccessSecretsManager: true } as Organization;
  const smOrg2 = { id: "456", canAccessSecretsManager: true } as Organization;
  const nonSmOrg1 = { id: "123", canAccessSecretsManager: false } as Organization;

  beforeEach(async () => {
    syncService = mock<SyncService>();
    organizationService = mock<OrganizationService>();
    organizationBillingService = mock<OrganizationBillingServiceAbstraction>();
    stateService = mock<StateService>();
    routerService = mock<RouterService>();

    TestBed.configureTestingModule({
      providers: [
        { provide: SyncService, useValue: syncService },
        { provide: OrganizationService, useValue: organizationService },
        { provide: OrganizationBillingServiceAbstraction, useValue: organizationBillingService },
        { provide: StateService, useValue: stateService },
        { provide: RouterService, useValue: routerService },
        provideRouter(
          [
            {
              path: "guarded-route",
              component: GuardedRouteTestComponent,
              canActivate: [smRedirectGuard()],
            },
            {
              path: "sm",
              component: RedirectTestComponent,
            },
          ],
          withDebugTracing(),
        ),
      ],
    });

    routerHarness = await RouterTestingHarness.create();
  });

  describe("User belongs to an organization that is sm standalone", () => {
    beforeEach(async () => {
      syncService.getLastSync.mockResolvedValue(new Date(new Date().getTime()));
      organizationService.getAll.mockResolvedValue([smOrg1]);
      organizationBillingService.isOnSecretsManagerStandalone.mockResolvedValue(true);
      stateService.getUserId.mockResolvedValue("123");
      const router = TestBed.inject(Router);
      routerSpy = jest.spyOn(router, "createUrlTree");
    });

    it('should call "createUrlTree" with "/sm" with only one organization', async () => {
      // Arrange
      routerService.getPreviousUrl.mockReturnValue(undefined);

      // Act
      await routerHarness.navigateByUrl("guarded-route");

      // Assert
      expect(routerSpy).toHaveBeenCalledWith(["/sm"]);
    });

    it('should not call "createUrlTree" with "/sm" if the user does not have access to sm', async () => {
      // Arrange
      organizationService.getAll.mockResolvedValue([nonSmOrg1]);
      routerService.getPreviousUrl.mockReturnValue(undefined);

      // Act
      await routerHarness.navigateByUrl("guarded-route");

      // Assert
      expect(routerSpy).not.toHaveBeenCalled();
    });

    it('should not call "createUrlTree" with "/sm" with more than 1 organization', async () => {
      // Arrange
      organizationService.getAll.mockResolvedValue([smOrg1, smOrg2]);
      routerService.getPreviousUrl.mockReturnValue(undefined);

      // Act
      await routerHarness.navigateByUrl("guarded-route");

      // Assert
      expect(routerSpy).not.toHaveBeenCalled();
    });

    it('should not call "createUrlTree" with "/sm" if there is a previous url', async () => {
      // Arrange
      routerService.getPreviousUrl.mockReturnValue("reports");

      // Act
      await routerHarness.navigateByUrl("guarded-route");

      // Assert
      expect(routerSpy).not.toHaveBeenCalled();
    });
  });
  describe("User belongs to an organization that is not sm standalone", () => {
    beforeEach(async () => {
      syncService.getLastSync.mockResolvedValue(new Date(new Date().getTime()));
      organizationService.getAll.mockResolvedValue([smOrg1]);
      organizationBillingService.isOnSecretsManagerStandalone.mockResolvedValue(false);
      stateService.getUserId.mockResolvedValue("123");
      const router = TestBed.inject(Router);
      routerSpy = jest.spyOn(router, "createUrlTree");
    });

    it('should not call "createUrlTree" with "/sm" with one organization', async () => {
      // Arrange
      routerService.getPreviousUrl.mockReturnValue(undefined);

      // Act
      await routerHarness.navigateByUrl("guarded-route");

      // Assert
      expect(routerSpy).not.toHaveBeenCalledWith();
    });

    it('should not call "createUrlTree" with "/sm" if there is a previous url', async () => {
      // Arrange
      routerService.getPreviousUrl.mockReturnValue("reports");

      // Act
      await routerHarness.navigateByUrl("guarded-route");

      // Assert
      expect(routerSpy).not.toHaveBeenCalled();
    });
  });
});
