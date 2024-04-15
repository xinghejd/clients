import { concatMap, firstValueFrom, map, tap } from "rxjs";
import { Jsonify } from "type-fest";

import { SIMPLE_VAULT_INDEX_DISK, StateProvider, UserKeyDefinition } from "../../../platform/state";
import { CipherId } from "../../../types/guid";
import {
  IndexedField,
  SimpleVaultIndex,
  SimpleVaultIndexService,
} from "../../abstractions/fido2/simple-vault-index.service.abstraction";
import { CipherView } from "../../models/view/cipher.view";
import { CipherService } from "../cipher.service";

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

  constructor(
    private stateProvider: StateProvider,
    private cipherService: CipherService,
  ) {
    cipherService.onChanged$.pipe(
      tap(() => this.statusState.update(() => "indexing")),
      concatMap(() => this.indexCiphers()),
      tap(() => this.statusState.update(() => "ready")),
    );
  }

  async getItemIds(field: IndexedField, value: string): Promise<CipherId[]> {
    // TODO: This should take index status into account
    const result = await firstValueFrom(
      this.indexState.state$.pipe(map((index) => index[field][value] ?? [])),
    );

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

  private async indexCiphers() {
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
  }
}
