import { FolderData } from "../../vault/models/data/folder.data";

import { KeyDefinition } from "./key-definition";
import { FOLDER_SERVICE_DISK } from "./state-definitions";

// FolderService Keys
export const FOLDERS = KeyDefinition.record<FolderData>(
  FOLDER_SERVICE_DISK,
  "folders",
  FolderData.fromJSON
);
