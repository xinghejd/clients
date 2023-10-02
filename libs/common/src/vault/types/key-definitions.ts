import { KeyDefinition } from "../../platform/types/key-definition";
import { FOLDER_SERVICE_DISK } from "../../platform/types/state-definitions";
import { FolderData } from "../models/data/folder.data";

// FolderService Keys
export const FOLDERS = KeyDefinition.record<FolderData>(
  FOLDER_SERVICE_DISK,
  "folders",
  FolderData.fromJSON
);
