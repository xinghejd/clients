import { Folder } from "../../models/domain/folder";
import { FolderResponse } from "../../models/response/folder.response";

export abstract class FolderApiServiceAbstraction {
  abstract save(folder: Folder): Promise<any>;
  abstract delete(id: string): Promise<any>;
  abstract get(id: string): Promise<FolderResponse>;
}
