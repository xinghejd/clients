import { UrlTree } from "@angular/router";

import { LoginService, PasswordPolicies } from "./login.service";

export class DefaultLoginService implements LoginService {
  async launchSsoBrowserWindow(email: string): Promise<void | null> {
    return null;
  }

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
