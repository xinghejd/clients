import { Observable, firstValueFrom, map } from "rxjs";

import { ActiveUserStateProvider } from "../../../platform/abstractions/active-user-state.provider";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { ActiveUserState } from "../../../platform/interfaces/active-user-state";
import { Utils } from "../../../platform/misc/utils";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { DerivedActiveUserState } from "../../../platform/services/default-active-user-state.provider";
import { CipherService } from "../../../vault/abstractions/cipher.service";
import { InternalFolderService as InternalFolderServiceAbstraction } from "../../../vault/abstractions/folder/folder.service.abstraction";
import { CipherData } from "../../../vault/models/data/cipher.data";
import { FolderData } from "../../../vault/models/data/folder.data";
import { Folder } from "../../../vault/models/domain/folder";
import { FolderView } from "../../../vault/models/view/folder.view";
import { FOLDERS } from "../../types/key-definitions";

export class FolderService implements InternalFolderServiceAbstraction {
  folderState: ActiveUserState<Record<string, FolderData>>;
  decryptedFolderState: DerivedActiveUserState<Record<string, FolderData>, FolderView[]>;

  folders$: Observable<Folder[]>;
  folderViews$: Observable<FolderView[]>;

  constructor(
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private cipherService: CipherService,
    private activeUserStateProvider: ActiveUserStateProvider,
    private stateService: StateService
  ) {
    (window as any).services ||= {};
    (window as any).services.folderService = this;
    const derivedFoldersDefinition = FOLDERS.createDerivedDefinition(
      "memory",
      async (foldersMap) => {
        const folders = this.flattenMap(foldersMap);
        const decryptedFolders = await this.decryptFolders(folders);
        return decryptedFolders;
      }
    );

    this.folderState = this.activeUserStateProvider.create(FOLDERS);

    this.folders$ = this.folderState.state$.pipe(
      map((foldersMap) => {
        return this.flattenMap(foldersMap);
      })
    );

    this.decryptedFolderState = this.folderState.createDerived(derivedFoldersDefinition);
    this.folderViews$ = this.decryptedFolderState.state$;
  }

  async clearCache(): Promise<void> {
    // TODO: I don't really have a replacement for this right now
    // this._folderViews.next([]);
  }

  // TODO: This should be moved to EncryptService or something
  async encrypt(model: FolderView, key?: SymmetricCryptoKey): Promise<Folder> {
    const folder = new Folder();
    folder.id = model.id;
    folder.name = await this.cryptoService.encrypt(model.name, key);
    return folder;
  }

  async get(id: string): Promise<Folder> {
    const folders = await firstValueFrom(this.folderState.state$);
    return new Folder(folders[id]);
  }

  async getAllFromState(): Promise<Folder[]> {
    const foldersMap = await this.folderState.getFromState();
    return this.flattenMap(foldersMap);
  }

  /**
   * @deprecated For the CLI only
   * @param id id of the folder
   */
  async getFromState(id: string): Promise<Folder> {
    const foldersMap = await this.folderState.getFromState();
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
    return await this.decryptedFolderState.getFromState();
  }

  async upsert(folder: FolderData | FolderData[]): Promise<void> {
    await this.folderState.update((folders) => {
      if (folder instanceof FolderData) {
        folders[folder.id] = folder;
      } else {
        (folder as FolderData[]).forEach((f) => {
          folders[f.id] = f;
        });
      }
      return folders;
    });
  }

  async replace(folders: { [id: string]: FolderData }): Promise<void> {
    await this.folderState.update((_) => folders);
  }

  async clear(userId?: string): Promise<any> {
    await this.folderState.update((_) => null);
  }

  async delete(id: string | string[]): Promise<void> {
    const folderIds = typeof id === "string" ? [id] : id;
    await this.folderState.update((folders) => {
      folderIds.forEach((folderId) => {
        delete folders[folderId];
      });
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

  private async decryptFolders(folders: Folder[]) {
    const decryptFolderPromises = folders.map((f) => f.decrypt());
    const decryptedFolders = await Promise.all(decryptFolderPromises);

    decryptedFolders.sort(Utils.getSortFunction(this.i18nService, "name"));

    const noneFolder = new FolderView();
    noneFolder.name = this.i18nService.t("noneFolder");
    decryptedFolders.push(noneFolder);

    return decryptedFolders;
  }

  private flattenMap(foldersMap: Record<string, FolderData>): Folder[] {
    const folders: Folder[] = [];
    for (const id in foldersMap) {
      folders.push(new Folder(foldersMap[id]));
    }
    return folders;
  }
}
