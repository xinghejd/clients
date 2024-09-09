import { Jsonify } from "type-fest";

import { View } from "../../../models/view/view";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { FolderId } from "../../../types/guid";
import { UserKey } from "../../../types/key";
import { Folder } from "../domain/folder";
import { ITreeNodeObject } from "../domain/tree-node";

export class FolderView implements View, ITreeNodeObject {
  id: FolderId = null;
  name: string = null;
  revisionDate: Date = null;

  constructor(f?: Folder) {
    if (!f) {
      return;
    }

    this.id = f.id;
    this.revisionDate = f.revisionDate;
  }

  static fromJSON(obj: Jsonify<FolderView>) {
    const revisionDate = obj.revisionDate == null ? null : new Date(obj.revisionDate);
    return Object.assign(new FolderView(), obj, { revisionDate });
  }

  async encrypt(key: UserKey, encryptService: EncryptService): Promise<Folder> {
    const folder = new Folder();
    folder.id = this.id;
    folder.name = await encryptService.encrypt(this.name, key);
    folder.revisionDate = this.revisionDate;
    return folder;
  }
}
