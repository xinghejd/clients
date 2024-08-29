import {
  OrganizationUserStatusType,
  OrganizationUserType,
} from "@bitwarden/common/admin-console/enums";
import { BaseResponse } from "@bitwarden/common/models/response/base.response";

export class OrganizationUserUserBasicResponse extends BaseResponse {
  id: string;
  email: string;
  name: string;
  type: OrganizationUserType;
  status: OrganizationUserStatusType;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.email = this.getResponseProperty("Email");
    this.name = this.getResponseProperty("Name");
    this.type = this.getResponseProperty("Type");
    this.status = this.getResponseProperty("Status");
  }
}
