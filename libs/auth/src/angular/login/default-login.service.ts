import { UrlTree } from "@angular/router";

import { AuthResult } from "@bitwarden/common/auth/models/domain/auth-result";
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

  // Legacy accounts used the master key to encrypt data. Migration is required but only performed on web
  async handleMigrateEncryptionKey(result: AuthResult): Promise<boolean> {
    if (!result.requiresEncryptionKeyMigration) {
      return false;
    }

    this.toastService.showToast({
      variant: "error",
      title: this.i18nService.t("errorOccured"),
      message: this.i18nService.t("encryptionKeyMigrationRequired"),
    });
    return true;
  }
}
