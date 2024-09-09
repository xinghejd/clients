import { switchMap } from "rxjs";

import { ApiService } from "../../../abstractions/api.service";
import { FolderId } from "../../../types/guid";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderRequest } from "../../models/request/folder.request";
import { FolderResponse } from "../../models/response/folder.response";

export class NewFolderApiService {
  constructor(private readonly apiService: ApiService) {}

  updateFolderWithServer(folderId: FolderId) {
    return switchMap(async (folder: Folder) => {
      if (folder == null) {
        await this.deleteFolder(folderId);
        return null;
      }

      if (folder.id != folderId) {
        throw new Error(`trying to update a folder's id. expected ${folderId}, got ${folder.id}`);
      }

      const request = new FolderRequest(folder);

      let response: FolderResponse;
      if (folderId == null) {
        response = await this.postFolder(request);
        folder.id = response.id;
      } else {
        response = await this.putFolder(folderId, request);
      }

      return new FolderData(response);
    });
  }

  private async postFolder(request: FolderRequest): Promise<FolderResponse> {
    const r = await this.apiService.send("POST", "/folders", request, true, true);
    return new FolderResponse(r);
  }

  private async putFolder(id: string, request: FolderRequest): Promise<FolderResponse> {
    const r = await this.apiService.send("PUT", "/folders/" + id, request, true, true);
    return new FolderResponse(r);
  }

  private async deleteFolder(id: string): Promise<any> {
    return await this.apiService.send("DELETE", "/folders/" + id, null, true, false);
  }
}
