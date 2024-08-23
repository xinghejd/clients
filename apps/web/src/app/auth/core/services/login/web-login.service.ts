import { inject } from "@angular/core";
import { UrlTree } from "@angular/router";

import { DefaultLoginService, LoginService } from "@bitwarden/auth/angular";

import { RouterService } from "../../../../core/router.service";

export class WebLoginService extends DefaultLoginService implements LoginService {
  routerService = inject(RouterService);

  setPreviousUrl(route: UrlTree): void | null {
    this.routerService.setPreviousUrl(route.toString());
  }

  async handleExistingOrgInvite(): Promise<void | null> {
    const orgInvite = await this.acceptOrganizationInviteService.getOrganizationInvite();
    if (orgInvite != null) {
      await this.initPasswordPolicies(orgInvite);
    }
  }
}
