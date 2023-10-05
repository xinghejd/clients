import { FolderData } from "../../vault/models/data/folder.data";
import { FolderView } from "../../vault/models/view/folder.view";

import { KeyDefinition } from "./key-definition";
import { StateDefinition } from "./state-definition";

// FolderService
const FOLDER_SERVICE_DISK = new StateDefinition("folderService", "disk");
const FOLDER_SERVICE_MEMORY = new StateDefinition("folderService", "memory");
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
