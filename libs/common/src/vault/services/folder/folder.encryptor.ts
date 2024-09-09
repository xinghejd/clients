import { combineLatestWith, concatMap, Observable, pipe, UnaryFunction } from "rxjs";

import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { UserKey } from "../../../types/key";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

export class FolderEncryptor {
  constructor(private readonly encryptService: EncryptService) {}

  encryptFolder(userKey$: Observable<UserKey>) {
    return pipe(
      combineLatestWith<FolderView, [UserKey]>(userKey$),
      concatMap(async ([folder, userKey]) => {
        return await folder.encrypt(userKey, this.encryptService);
      }),
    );
  }

  decryptFolder(
    userKey$: Observable<UserKey>,
  ): UnaryFunction<Observable<FolderData>, Observable<FolderView>> {
    return pipe(
      combineLatestWith(userKey$),
      concatMap(async ([folder, userKey]) => {
        if (!folder) {
          return null;
        }
        return await new Folder(folder).decryptWithKey(userKey, this.encryptService);
      }),
    );
  }
}
