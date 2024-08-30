import { UrlTree } from "@angular/router";

import { LoginService, PasswordPolicies } from "./login.service";

export class DefaultLoginService implements LoginService {
  getShowPasswordlessFlag(): boolean {
    return null;
  }

  setPreviousUrl(route: UrlTree): void | null {
    return null;
  }

  async getOrgPolicies(): Promise<PasswordPolicies | null> {
    return null;
  }
}
