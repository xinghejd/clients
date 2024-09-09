import { filter, map, Observable, of, OperatorFunction, switchMap, take } from "rxjs";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { buildSingleValueObservable } from "../../../platform/misc/dependencies";
import { SingleUserState } from "../../../platform/state";
import { FolderId } from "../../../types/guid";
import { FolderData } from "../../models/data/folder.data";
import { FolderView } from "../../models/view/folder.view";

import { FolderEncryptor } from "./folder.encryptor";
import { NewFolderApiService } from "./new-folder-api.service";

export class FolderState {
  state$: Observable<FolderView | null>;
  constructor(
    private readonly folderId: FolderId,
    private readonly singleUserState: SingleUserState<FolderData[]>,
    private readonly cryptoService: CryptoService,
    private readonly folderApiService: NewFolderApiService,
    private readonly folderEncryptor: FolderEncryptor,
    private readonly destroy$: Observable<any>,
  ) {
    this.state$ = this.singleUserState.state$.pipe(
      switchMap((folders) => {
        if (this.folderId == null) {
          return of(null);
        } else {
          return of(folders.find((f) => f.id === this.folderId));
        }
      }),
      this.folderEncryptor.decryptFolder(this.userKey$),
    );
  }

  userId = this.singleUserState.userId;
  private readonly userKey$ = buildSingleValueObservable(
    this.cryptoService.userKey$(this.userId),
    this.destroy$,
    {
      errorOnChange: false,
    },
  );

  update(
    transform: OperatorFunction<FolderView, FolderView>,
    shouldUpdate: (folder: FolderView) => boolean = () => true,
  ): Observable<FolderView> {
    return this.state$.pipe(
      take(1),
      transform,
      filter(shouldUpdate),
      this.validateTransformedFolder,
      this.folderEncryptor.encryptFolder(this.userKey$),
      this.folderApiService.updateFolderWithServer(this.folderId),
      this.updateDiskState,
      this.folderEncryptor.decryptFolder(this.userKey$),
    );
  }

  private validateTransformedFolder = map((folder: FolderView) => {
    // throw if folder is deleted or if the id does not match the class's id
    if (folder == null) {
      throw new Error("Folder deleted in update method, use the delete method instead");
    } else if (folder.id !== this.folderId) {
      throw new Error(
        `trying to update a folder's id. expected ${this.folderId}, got ${folder.id}`,
      );
    }
    return folder;
  });

  private updateDiskState = switchMap(async (folder: FolderData) => {
    const newFolders = await this.singleUserState.update((folders) => {
      if (!folders) {
        return [folder];
      } else if (folders.some((f) => f.id === folder.id)) {
        return folders.map((f) => (f.id === folder.id ? folder : f));
      } else {
        return [...folders, folder];
      }
    });

    return newFolders.find((f) => f.id === folder.id);
  });
}
