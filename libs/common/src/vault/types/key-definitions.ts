import { KeyDefinition } from "../../platform/types/key-definition";
import { FOLDER_SERVICE_DISK } from "../../platform/types/state-definitions";
import { Folder } from "../models/domain/folder";

// FolderService Keys
export const FOLDERS = KeyDefinition.record<Folder>(FOLDER_SERVICE_DISK, "folders", Folder.fromJSON);
