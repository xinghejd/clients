import { BaseResponse } from "../../../../../models/response/base.response";
import { SecureNoteType } from "../../../../enums";

export class SecureNoteApiV2 extends BaseResponse {
  type: SecureNoteType;

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }
    this.type = this.getResponseProperty("Type");
  }
}
