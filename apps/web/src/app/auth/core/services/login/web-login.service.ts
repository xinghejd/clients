import { inject } from "@angular/core";
import { UrlTree } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { DefaultLoginService, LoginService, PasswordPolicies } from "@bitwarden/auth/angular";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { InternalPolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";

import { OrganizationInvite } from "../../../../../../../../libs/auth/src/common/models/domain/organization-invite";
import { RouterService } from "../../../../core/router.service";
import { AcceptOrganizationInviteService } from "../../../organization-invite/accept-organization.service";

export class WebLoginService extends DefaultLoginService implements LoginService {
  acceptOrganizationInviteService = inject(AcceptOrganizationInviteService);
  logService = inject(LogService);
  policyApiService = inject(PolicyApiServiceAbstraction);
  policyService = inject(InternalPolicyService);
  routerService = inject(RouterService);

  setPreviousUrl(route: UrlTree): void | null {
    this.routerService.setPreviousUrl(route.toString());
  }

  async getOrganizationInvite(): Promise<OrganizationInvite | null> {
    return await this.acceptOrganizationInviteService.getOrganizationInvite();
  }

  async getPasswordPolicies(invite: OrganizationInvite): Promise<PasswordPolicies> {
    let policies: Policy[];

    try {
      policies = await this.policyApiService.getPoliciesByToken(
        invite.organizationId,
        invite.token,
        invite.email,
        invite.organizationUserId,
      );
    } catch (e) {
      this.logService.error(e);
    }

    if (policies == null) {
      return;
    }

    const resetPasswordPolicy = this.policyService.getResetPasswordPolicyOptions(
      policies,
      invite.organizationId,
    );

    const isPolicyAndAutoEnrollEnabled =
      resetPasswordPolicy[1] && resetPasswordPolicy[0].autoEnrollEnabled;

    const enforcedPasswordPolicyOptions = await firstValueFrom(
      this.policyService.masterPasswordPolicyOptions$(policies),
    );

    return {
      policies,
      isPolicyAndAutoEnrollEnabled,
      enforcedPasswordPolicyOptions,
    };
  }
}
