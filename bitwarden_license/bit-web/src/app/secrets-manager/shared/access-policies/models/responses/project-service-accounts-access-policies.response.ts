import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import { ProjectServiceAccountsAccessPolicyResponse } from "./access-policy.response";

export class ProjectServiceAccountsAccessPoliciesResponse extends BaseResponse {
  serviceAccountAccessPolicies: ProjectServiceAccountsAccessPolicyResponse[];

  constructor(response: any) {
    super(response);

    const serviceAccountsAccessPolicies = this.getResponseProperty("ServiceAccountsAccessPolicies");
    this.serviceAccountAccessPolicies = serviceAccountsAccessPolicies.map(
      (k: any) => new ProjectServiceAccountsAccessPolicyResponse(k),
    );
  }
}
