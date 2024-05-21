import { Decryptable } from "../../../platform/interfaces/decryptable.interface";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { InitializerKey } from "../../../platform/services/cryptography/initializer-key";
import { CipherData } from "../data/cipher.data";
import { LocalData } from "../data/local.data";
import { CipherView } from "../view/cipher.view";

import { CipherV1 } from "./cipher";

export class Cipher implements Decryptable<CipherView> {
  readonly id = this.cipherData.id;
  readonly organizationId = this.cipherData.organizationId;
  readonly version = this.cipherData.version;
  readonly key: EncString;

  constructor(
    private cipherData: CipherData,
    private localData: LocalData,
  ) {
    this.key = new EncString(this.cipherData.key);
  }

  initializerKey: InitializerKey;
  toJSON?: () => { initializerKey: InitializerKey };

  async decrypt(encKey: SymmetricCryptoKey): Promise<CipherView> {
    if (this.version == 0) {
      const cipher = new CipherV1(this.cipherData, this.localData);
      return cipher.decrypt(encKey);
    }
  }
}
