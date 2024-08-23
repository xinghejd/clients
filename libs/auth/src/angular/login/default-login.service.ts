import { UrlTree } from "@angular/router";

import { LoginService } from "./login.service";

export class DefaultLoginService implements LoginService {
  setPreviousUrl(route: UrlTree): void | null {
    return null;
  }

  async handleExistingOrgInvite(): Promise<void | null> {
    return null;
  }
}
