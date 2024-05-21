import { Decryptable } from "../../../platform/interfaces/decryptable.interface";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { InitializerKey } from "../../../platform/services/cryptography/initializer-key";
import { CipherData } from "../data/cipher.data";
import { LocalData } from "../data/local.data";
import { CipherView } from "../view/cipher.view";

import { CipherV1 } from "./cipher-v1";

export class Cipher implements Decryptable<CipherView> {
  readonly id = this.cipherData.id;
  readonly organizationId = this.cipherData.organizationId;
  readonly version = this.cipherData.version;

  collectionIds: string[];

  private _key: EncString;
  get key() {
    return this._key;
  }

  set key(value: EncString) {
    this.cipherData.key = value.toJSON();
    this._key = value;
  }

  constructor(
    private cipherData: CipherData,
    private localData: LocalData,
  ) {
    this._key = new EncString(this.cipherData.key);

    // Unencrypted data available across versions
    this.collectionIds = cipherData.collectionIds;
    this.localData = localData;
  }

  initializerKey: InitializerKey;
  toJSON?: () => { initializerKey: InitializerKey };

  async decrypt(encKey: SymmetricCryptoKey): Promise<CipherView> {
    if (this.version == 0) {
      const cipher = new CipherV1(this.cipherData, this.localData);
      return cipher.decrypt(encKey);
    }
  }

  async encrypt(encKey: SymmetricCryptoKey): Promise<
}
