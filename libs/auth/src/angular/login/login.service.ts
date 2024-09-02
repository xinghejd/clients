import { UrlTree } from "@angular/router";

import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { AuthResult } from "@bitwarden/common/auth/models/domain/auth-result";

export interface PasswordPolicies {
  policies: Policy[];
  isPolicyAndAutoEnrollEnabled: boolean;
  enforcedPasswordPolicyOptions: MasterPasswordPolicyOptions;
}

export abstract class LoginService {
  handleMigrateEncryptionKey: (result: AuthResult) => Promise<boolean>;

  // Web specific
  getShowPasswordlessFlag: () => boolean;
  getOrgPolicies: () => Promise<PasswordPolicies | null>;
  setPreviousUrl: (route: UrlTree) => void | null;
}
