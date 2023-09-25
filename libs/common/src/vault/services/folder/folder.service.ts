import { combineLatestWith, concatMap, firstValueFrom, map } from "rxjs";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { LogService } from "../../../platform/abstractions/log.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { Utils } from "../../../platform/misc/utils";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { NamespacedStateService } from "../../../platform/services/state/namespaced-state-service";
import { StateServiceFactory } from "../../../platform/services/state/state-service-factory";
import { PersistedSubject } from "../../../platform/subject/persisted-subject";
import { UserId } from "../../../types/guid";
import { CipherService } from "../../../vault/abstractions/cipher.service";
import { InternalFolderService as InternalFolderServiceAbstraction } from "../../../vault/abstractions/folder/folder.service.abstraction";
import { CipherData } from "../../../vault/models/data/cipher.data";
import { FolderData } from "../../../vault/models/data/folder.data";
import { Folder } from "../../../vault/models/domain/folder";
import { FolderView } from "../../../vault/models/view/folder.view";

type StoredFolders = { [id: string]: FolderData };
type StoredFolderViews = { [id: string]: FolderView };

export class FolderService implements InternalFolderServiceAbstraction {
  private readonly storageKeys = {
    namespace: "folders",
    folders: "folders",
    folderViews: "folderViews",
  };
  private namespacedStateService: NamespacedStateService;
  protected _folders: PersistedSubject<StoredFolders>;
  protected _folderViews: PersistedSubject<StoredFolderViews>;

  get folders$() {
    return this._folders
      .asObservable()
      .pipe(map((folders) => Object.values(folders).map((d) => new Folder(d))));
  }
  get folderViews$() {
    return this._folderViews
      .asObservable()
      .pipe(map((folders) => this.storedFolderViewsToArray(folders)));
  }

  constructor(
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private cipherService: CipherService,
    private stateService: StateService,
    stateServiceFactory: StateServiceFactory,
    private logService: LogService
  ) {
    this.namespacedStateService = stateServiceFactory.buildFor(this.storageKeys.namespace);
    this._folders = new PersistedSubject<StoredFolders>(
      this.storageKeys.folders,
      "disk",
      this.namespacedStateService,
      this.logService
    );
    this._folderViews = new PersistedSubject<StoredFolderViews>(
      this.storageKeys.folderViews,
      "memory",
      this.namespacedStateService,
      this.logService
    );

    this.stateService.activeAccountUnlocked$
      .pipe(
        combineLatestWith(this.stateService.activeAccount$),
        concatMap(async ([unlocked, userId]) => {
          if (Utils.global.bitwardenContainerService == null) {
            return;
          }

          if (!unlocked) {
            await this._folders.next(userId, {});
            await this._folderViews.next(userId, {});
            return;
          }
          const data = await this.readFolderDataFromDisk(userId);

          await this.updateObservables(userId, data);
        })
      )
      .subscribe();
  }

  async clearCache(): Promise<void> {
    const userId = await this.stateService.getUserId();
    this._folderViews.next(userId, {});
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

    return folders.find((folder) => folder.id === id);
  }

  // TODO MDG: this should require a userId and rename to export
  async getAllFromState(): Promise<Folder[]> {
    const userId = await this.stateService.getUserId();
    const folders = await this.readFolderDataFromDisk(userId);
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
    const userId = await this.stateService.getUserId();
    const foldersMap = await this.readFolderDataFromDisk(userId);
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
    const userId = await this.stateService.getUserId();
    const data = await this.readFolderDataFromDisk(userId);
    const folders = Object.values(data || {}).map((f) => new Folder(f));

    return this.decryptFolders(folders);
  }

  async upsert(folder: FolderData | FolderData[]): Promise<void> {
    const userId = await this.stateService.getUserId();
    let folders = await this.readFolderDataFromDisk(userId);
    if (folders == null) {
      folders = {};
    }

    if (folder instanceof FolderData) {
      const f = folder as FolderData;
      folders[f.id] = f;
    } else {
      (folder as FolderData[]).forEach((f) => {
        folders[f.id] = f;
      });
    }

    await this.updateObservables(folders);
    await this.writeFolderDataToDisk(userId, folders);
  }

  async replace(folders: { [id: string]: FolderData }): Promise<void> {
    await this.updateObservables(folders);
    const userId = await this.stateService.getUserId();
    await this.writeFolderDataToDisk(userId, folders);
  }

  async clear(userId?: UserId): Promise<any> {
    if (userId == null || userId == (await this.stateService.getUserId())) {
      this._folders.next(userId, {});
      this._folderViews.next(userId, {});
    }
    await this.writeFolderDataToDisk(userId, null);
  }

  async delete(id: string | string[]): Promise<any> {
    const userId = await this.stateService.getUserId();
    const folders = await this.readFolderDataFromDisk(userId);
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

    await this.updateObservables(folders);
    await this.writeFolderDataToDisk(userId, folders);

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

  private async updateObservables(userId: UserId, foldersMap: StoredFolders) {
    this._folders.next(userId, foldersMap);

    if (await this.cryptoService.hasUserKey()) {
      this._folderViews.next(userId, await this.decryptFolders(foldersMap));
    }
  }

  private async decryptFolders(folders: StoredFolders) {
    const decryptFolderPromises = Object.values(folders).map((f) => new Folder(f).decrypt());
    const decryptedFolders = await Promise.all(decryptFolderPromises).then((folders) => {
      return Utils.arrayToRecordBy(folders, "id");
    });

    return decryptedFolders;
  }

  private storedFolderViewsToArray(folderViews: StoredFolderViews) {
    const folderViewsArray = Object.values(folderViews).sort(
      Utils.getSortFunction(this.i18nService, "name")
    );

    const noneFolder = new FolderView();
    noneFolder.name = this.i18nService.t("noneFolder");
    folderViewsArray.push(noneFolder);

    return folderViewsArray;
  }

  private async readFolderDataFromDisk(userId: UserId): Promise<StoredFolders> {
    return await this.namespacedStateService.get<StoredFolders>(
      userId,
      this.storageKeys.folders,
      "disk"
    );
  }

  private async writeFolderDataToDisk(userId: UserId, folders: StoredFolders): Promise<void> {
    return await this.namespacedStateService.save(
      userId,
      this.storageKeys.folders,
      folders,
      "disk"
    );
  }
}
