import { BaseResponse } from "../../../../../models/response/base.response";

export class PasswordHistoryResponseV1 extends BaseResponse {
  password: string;
  lastUsedDate: string;

  constructor(response: any) {
    super(response);
    this.password = this.getResponseProperty("Password");
    this.lastUsedDate = this.getResponseProperty("LastUsedDate");
  }
}
