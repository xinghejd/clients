import { inject } from "@angular/core";

import { initializeArray, assignPrototype } from "@bitwarden/common/platform/misc/initializers";
import { Folder } from "@bitwarden/common/vault/models/domain/folder";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";

import { BitSubjectFactoryServiceAbstraction } from "../../platform/services/abstractions/bit-subject-factory.service";

export class SyncedFolderService extends FolderService {
  protected _folders = inject(BitSubjectFactoryServiceAbstraction).create<Folder[]>(
    "folderService_folders",
    initializeArray<Folder>(Folder.fromJSON)
  );

  protected _foldersViews = inject(BitSubjectFactoryServiceAbstraction).create<FolderView[]>(
    "folderService_folderViews",
    initializeArray<FolderView>(assignPrototype(FolderView))
  );
}
