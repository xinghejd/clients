import { Observable } from "rxjs";

import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

export abstract class FolderService {
  abstract folders$: Observable<Folder[]>;
  abstract folderViews$: Observable<FolderView[]>;

  abstract clearCache(): Promise<void>;
  abstract encrypt(model: FolderView, key?: SymmetricCryptoKey): Promise<Folder>;
  abstract get(id: string): Promise<Folder>;
  abstract getAllFromState(): Promise<Folder[]>;
  /**
   * @deprecated Only use in CLI!
   */
  abstract getFromState(id: string): Promise<Folder>;
  /**
   * @deprecated Only use in CLI!
   */
  abstract getAllDecryptedFromState(): Promise<FolderView[]>;
  abstract decryptFolders(folders: Folder[]): Promise<FolderView[]>;
}

export abstract class InternalFolderService extends FolderService {
  abstract upsert(folder: FolderData | FolderData[]): Promise<void>;
  abstract replace(folders: { [id: string]: FolderData }): Promise<void>;
  abstract clear(userId: string): Promise<any>;
  abstract delete(id: string | string[]): Promise<any>;
}
