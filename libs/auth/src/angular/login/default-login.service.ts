import { UrlTree } from "@angular/router";

import { OrganizationInvite } from "@bitwarden/auth/common";

import { LoginService, PasswordPolicies } from "./login.service";

export class DefaultLoginService implements LoginService {
  setPreviousUrl(route: UrlTree): void | null {
    return null;
  }

  async getOrganizationInvite(): Promise<OrganizationInvite | null> {
    return null;
  }

  async getPasswordPolicies(invite: OrganizationInvite): Promise<PasswordPolicies | null> {
    return null;
  }
}
