import { FolderData } from "../../vault/models/data/folder.data";
import { FolderView } from "../../vault/models/view/folder.view";

import { KeyDefinition } from "./key-definition";
import { FOLDER_SERVICE_DISK, FOLDER_SERVICE_MEMORY } from "./state-definitions";

// FolderService Keys
export const FOLDERS = KeyDefinition.record<FolderData>(
  FOLDER_SERVICE_DISK,
  "folders",
  FolderData.fromJSON
);
export const FOLDER_VIEWS = KeyDefinition.array<FolderView>(
  FOLDER_SERVICE_MEMORY,
  "folderViews",
  FolderView.fromJSON
);
