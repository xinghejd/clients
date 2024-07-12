import {
  OrganizationUserStatusType,
  OrganizationUserType,
} from "@bitwarden/common/admin-console/enums";

import { BaseResponse } from "../../../models/response/base.response.js";

export class OrganizationUserResponse implements BaseResponse {
  object: string;
  id: string;
  email: string;
  name: string;
  status: OrganizationUserStatusType;
  type: OrganizationUserType;
  twoFactorEnabled: boolean;

  constructor() {
    this.object = "org-member";
  }
}
