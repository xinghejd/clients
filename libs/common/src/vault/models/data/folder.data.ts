import { Jsonify } from "type-fest";

import { FolderResponse } from "../response/folder.response";

export class FolderData {
  id: string;
  name: string;
  revisionDate: string;

  constructor(response: Partial<FolderResponse>) {
    this.name = response.name;
    this.id = response.id;
    this.revisionDate = response.revisionDate;
  }

  static fromJSON(jsonObj: Jsonify<FolderData>) {
    return new FolderData({
      id: jsonObj.id,
      name: jsonObj.name,
      revisionDate: jsonObj.revisionDate,
    });
  }
}
