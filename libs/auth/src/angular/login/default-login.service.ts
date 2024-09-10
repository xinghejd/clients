import { UrlTree } from "@angular/router";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ToastService } from "@bitwarden/components";

import { LoginService, PasswordPolicies } from "./login.service";

export class DefaultLoginService implements LoginService {
  constructor(
    protected i18nService: I18nService,
    protected toastService: ToastService,
  ) {}

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
