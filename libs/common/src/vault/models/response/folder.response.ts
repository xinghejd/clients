import { BaseResponse } from "../../../models/response/base.response";
import { FolderId } from "../../../types/guid";

export class FolderResponse extends BaseResponse {
  id: FolderId;
  name: string;
  revisionDate: string;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.name = this.getResponseProperty("Name");
    this.revisionDate = this.getResponseProperty("RevisionDate");
  }
}
