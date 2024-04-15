import { Subject, concatMap, debounceTime, firstValueFrom, map, tap } from "rxjs";
import { Jsonify } from "type-fest";

import { SIMPLE_VAULT_INDEX_DISK, StateProvider, UserKeyDefinition } from "../../../platform/state";
import { CipherId } from "../../../types/guid";
import { CipherService } from "../../abstractions/cipher.service";
import {
  IndexedField,
  SimpleVaultIndex,
  SimpleVaultIndexService,
} from "../../abstractions/fido2/simple-vault-index.service.abstraction";
import { CipherView } from "../../models/view/cipher.view";

/**
 * The `KeyDefinition` for accessing the index in application state.
 * The key definition is configured to clear the index when the user locks the vault.
 */
export const SIMPLE_VAULT_INDEX = new UserKeyDefinition<SimpleVaultIndex>(
  SIMPLE_VAULT_INDEX_DISK,
  "simpleVaultIndex",
  {
    deserializer: (obj: Jsonify<SimpleVaultIndex>) => obj,
    clearOn: ["logout"],
  },
);

type SimpleVaultIndexStatus = "empty" | "indexing" | "ready";

/**
 * The `KeyDefinition` for accessing the index in application state.
 * The key definition is configured to clear the index when the user locks the vault.
 */
export const SIMPLE_VAULT_INDEX_STATUS = new UserKeyDefinition<SimpleVaultIndexStatus>(
  SIMPLE_VAULT_INDEX_DISK,
  "simpleVaultIndexStatus",
  {
    deserializer: (obj: Jsonify<SimpleVaultIndexStatus>) => obj,
    clearOn: ["logout"],
  },
);

// TODO: We should use derived state to keep the index up to date with the ciphers.

export class SimpleVaultIndexServiceImplementation implements SimpleVaultIndexService {
  private indexState = this.stateProvider.getActive(SIMPLE_VAULT_INDEX);
  private statusState = this.stateProvider.getActive(SIMPLE_VAULT_INDEX_STATUS);

  private triggerIndex = ((window as any).triggerIndex = new Subject<void>());

  constructor(
    private stateProvider: StateProvider,
    private cipherService: CipherService,
  ) {
    // cipherService.onChanged$
    this.triggerIndex
      .pipe(
        tap(() => this.statusState.update(() => "indexing")),
        // Wait for 100ms before indexing to avoid indexing multiple times in quick succession
        debounceTime(100),
        concatMap(() => this.indexCiphers()),
        tap((status) => this.statusState.update(() => status)),
      )
      .subscribe();
  }

  async getItemIds(field: IndexedField, value: string): Promise<CipherId[]> {
    // TODO: This should take index status into account
    const result = await firstValueFrom(
      this.indexState.state$.pipe(map((index) => index[field][value] ?? [])),
    );

    // eslint-disable-next-line no-console
    console.debug("Simple vault index ciphers: ", result);

    return result;
  }

  async getDecryptedItems(field: IndexedField, value: string): Promise<CipherView[]> {
    const cipherIds = await this.getItemIds(field, value);
    const promises = cipherIds.map(async (cipherId) => {
      const encrypted = await this.cipherService.get(cipherId);
      const decryptionKey = await this.cipherService.getKeyForCipherKeyDecryption(encrypted);
      return await encrypted.decrypt(decryptionKey);
    });

    return await Promise.all(promises);
  }

  private async indexCiphers(): Promise<SimpleVaultIndexStatus> {
    // eslint-disable-next-line no-console
    console.debug("Indexing ciphers for simple vault index.");

    try {
      const ciphers = await this.cipherService.getAllDecrypted();

      const index: SimpleVaultIndex = {
        fido2CredentialRpId: {},
      };
      const addToIndex = (field: IndexedField, value: string, cipherId: CipherId) => {
        if (!index[field][value]) {
          index[field][value] = [];
        }
        index[field][value].push(cipherId);
      };

      for (const cipher of ciphers) {
        // fido2CredentialRpId
        const rpId = cipher.login?.fido2Credentials?.[0]?.rpId;
        if (rpId) {
          addToIndex("fido2CredentialRpId", rpId, cipher.id as CipherId);
        }
      }

      await this.indexState.update(() => index);
      // eslint-disable-next-line no-console
      console.log("Simple vault index updated.");
      return "ready";
    } catch {
      return "empty";
    }
  }
}
