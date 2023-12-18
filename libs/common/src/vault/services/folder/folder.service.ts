import { BehaviorSubject, firstValueFrom, map, shareReplay, switchMap } from "rxjs";
import { Jsonify } from "type-fest";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { Utils } from "../../../platform/misc/utils";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import {
  FOLDER_MEMORY,
  FOLDER_DISK,
  KeyDefinition,
  ActiveUserState,
  StateProvider,
} from "../../../platform/state";
import { UserId } from "../../../types/guid";
import { CipherService } from "../../../vault/abstractions/cipher.service";
import { InternalFolderService as InternalFolderServiceAbstraction } from "../../../vault/abstractions/folder/folder.service.abstraction";
import { CipherData } from "../../../vault/models/data/cipher.data";
import { FolderData } from "../../../vault/models/data/folder.data";
import { Folder } from "../../../vault/models/domain/folder";
import { FolderView } from "../../../vault/models/view/folder.view";

export const FOLDER_ENCRYPTED_FOLDERS = KeyDefinition.record<FolderData>(
  FOLDER_DISK,
  "encryptedFolders",
  {
    deserializer: (obj: Jsonify<FolderData>) => FolderData.fromJSON(obj),
  },
);

export const FOLDER_DECRYPTED_FOLDERS = KeyDefinition.array<FolderView>(
  FOLDER_MEMORY,
  "decryptedFolders",
  {
    deserializer: (obj: Jsonify<FolderView>) => FolderView.fromJSON(obj),
  },
);

// export const FOLDER_DECYRPTED_FOLDERS = new KeyDefinition(FOLDER_MEMORY);

// export const ACCOUNT_ACCOUNTS = KeyDefinition.record<AccountInfo, UserId>(
//   ACCOUNT_MEMORY,
//   "accounts",
//   {
//     deserializer: (accountInfo) => accountInfo,
//   },
// );

export class FolderService implements InternalFolderServiceAbstraction {
  protected _folderViews: BehaviorSubject<FolderView[]> = new BehaviorSubject([]);
  private encryptedFoldersState: ActiveUserState<Record<string, FolderData>>;
  private decryptedFoldersState: ActiveUserState<FolderView[]>;

  folders$;
  folderViews$;

  constructor(
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private cipherService: CipherService,
    private stateService: StateService,
    private stateProvider: StateProvider,
  ) {
    (window as any).folderService = this;
    this.encryptedFoldersState = this.stateProvider.getActive(FOLDER_ENCRYPTED_FOLDERS);
    this.decryptedFoldersState = this.stateProvider.getActive(FOLDER_DECRYPTED_FOLDERS);

    this.folders$ = this.encryptedFoldersState.state$.pipe(
      map((data) => Object.values(data).map((f) => new Folder(f))),
    );
    this.folderViews$ = this.folders$.pipe(
      switchMap(async (folders) => await this.decryptFolders(folders)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    // this.folderViews$ = this.decryptedFoldersState.state$;

    // this.folders$
    //   .pipe(
    //     switchMap(async (folders) => {
    //       const decrypted = await this.decryptFolders(folders);
    //       await this.decryptedFoldersState.update(() => decrypted);
    //     }),
    //   )
    //   .subscribe();
  }

  async clearCache(): Promise<void> {
    await this.decryptedFoldersState.update(() => []);
  }

  // TODO: This should be moved to EncryptService or something
  async encrypt(model: FolderView, key?: SymmetricCryptoKey): Promise<Folder> {
    const folder = new Folder();
    folder.id = model.id;
    folder.name = await this.cryptoService.encrypt(model.name, key);
    return folder;
  }

  async get(id: string): Promise<Folder> {
    const folders = await firstValueFrom(this.folders$);
    return folders.find((f) => f.id === id);
  }

  async getAllFromState(): Promise<Folder[]> {
    const folders = await this.stateService.getEncryptedFolders();
    const response: Folder[] = [];
    for (const id in folders) {
      // eslint-disable-next-line
      if (folders.hasOwnProperty(id)) {
        response.push(new Folder(folders[id]));
      }
    }
    return response;
  }

  /**
   * @deprecated For the CLI only
   * @param id id of the folder
   */
  async getFromState(id: string): Promise<Folder> {
    const foldersMap = await this.stateService.getEncryptedFolders();
    const folder = foldersMap[id];
    if (folder == null) {
      return null;
    }

    return new Folder(folder);
  }

  /**
   * @deprecated Only use in CLI!
   */
  async getAllDecryptedFromState(): Promise<FolderView[]> {
    const data = await this.stateService.getEncryptedFolders();
    const folders = Object.values(data || {}).map((f) => new Folder(f));

    return this.decryptFolders(folders);
  }

  async upsert(folderData: FolderData | FolderData[]): Promise<void> {
    await this.encryptedFoldersState.update((folders) => {
      if (folders == null) {
        folders = {};
      }
      if (folderData instanceof Array) {
        folderData.forEach((f) => {
          folders[f.id] = f;
        });
      } else {
        folders[folderData.id] = folderData;
      }
      return folders;
    });
  }

  async replace(folders: { [id: string]: FolderData }): Promise<void> {
    await this.encryptedFoldersState.update(() => {
      if (folders == null) {
        return null;
      }

      const newFolders: Record<string, FolderData> = {};
      for (const id in folders) {
        newFolders[id] = folders[id];
      }
      return newFolders;
    });
  }

  async clear(userId?: UserId): Promise<any> {
    if (userId == null) {
      await this.encryptedFoldersState.update(() => ({}));
      await this.decryptedFoldersState.update(() => []);
    } else {
      await this.stateProvider.getUser(userId, FOLDER_ENCRYPTED_FOLDERS).update(() => ({}));
      await this.stateProvider.getUser(userId, FOLDER_DECRYPTED_FOLDERS).update(() => []);
    }
  }

  async delete(id: string | string[]): Promise<any> {
    await this.encryptedFoldersState.update((folders) => {
      if (folders == null) {
        return;
      }

      if (typeof id === "string") {
        if (folders[id] == null) {
          return;
        }
        delete folders[id];
      } else {
        (id as string[]).forEach((i) => {
          delete folders[i];
        });
      }
      return folders;
    });

    // Items in a deleted folder are re-assigned to "No Folder"
    const ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers != null) {
      const updates: CipherData[] = [];
      for (const cId in ciphers) {
        if (ciphers[cId].folderId === id) {
          ciphers[cId].folderId = null;
          updates.push(ciphers[cId]);
        }
      }
      if (updates.length > 0) {
        this.cipherService.upsert(updates);
      }
    }
  }

  private async updateObservables(foldersMap: { [id: string]: FolderData }) {
    const folders = Object.values(foldersMap || {}).map((f) => new Folder(f));

    if (await this.cryptoService.hasUserKey()) {
      this._folderViews.next(await this.decryptFolders(folders));
    }
  }

  private async decryptFolders(folders: Folder[]) {
    const userKey = await this.cryptoService.getUserKey();
    if (!userKey) {
      return;
    }
    const decryptFolderPromises = folders.map((f) => f.decrypt());
    const decryptedFolders = await Promise.all(decryptFolderPromises);

    decryptedFolders.sort(Utils.getSortFunction(this.i18nService, "name"));

    const noneFolder = new FolderView();
    noneFolder.name = this.i18nService.t("noneFolder");
    decryptedFolders.push(noneFolder);

    return decryptedFolders;
  }
}
