import { UrlTree } from "@angular/router";

import { OrganizationInvite } from "@bitwarden/auth/common";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";

export interface PasswordPolicies {
  policies: Policy[];
  isPolicyAndAutoEnrollEnabled: boolean;
  enforcedPasswordPolicyOptions: MasterPasswordPolicyOptions;
}

export abstract class LoginService {
  // Web specific
  getOrganizationInvite: () => Promise<OrganizationInvite | null>;
  getPasswordPolicies: (invite: OrganizationInvite) => Promise<PasswordPolicies | null>;
  setPreviousUrl: (route: UrlTree) => void | null;
}
