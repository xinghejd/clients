import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import {
  GroupProjectAccessPolicyResponse,
  ProjectServiceAccountsAccessPolicyResponse,
  UserProjectAccessPolicyResponse,
} from "./access-policy.response";

export class ProjectAccessPoliciesResponse extends BaseResponse {
  userAccessPolicies: UserProjectAccessPolicyResponse[];
  groupAccessPolicies: GroupProjectAccessPolicyResponse[];
  serviceAccountAccessPolicies: ProjectServiceAccountsAccessPolicyResponse[];

  constructor(response: any) {
    super(response);
    const userAccessPolicies = this.getResponseProperty("UserAccessPolicies");
    this.userAccessPolicies = userAccessPolicies.map(
      (k: any) => new UserProjectAccessPolicyResponse(k),
    );
    const groupAccessPolicies = this.getResponseProperty("GroupAccessPolicies");
    this.groupAccessPolicies = groupAccessPolicies.map(
      (k: any) => new GroupProjectAccessPolicyResponse(k),
    );
    const serviceAccountAccessPolicies = this.getResponseProperty("ServiceAccountAccessPolicies");
    this.serviceAccountAccessPolicies = serviceAccountAccessPolicies.map(
      (k: any) => new ProjectServiceAccountsAccessPolicyResponse(k),
    );
  }
}
