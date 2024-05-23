import { Jsonify } from "type-fest";

import Domain from "../../../platform/models/domain/domain-base";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { SecureNoteType } from "../../enums";
import { SecureNoteDataLatest } from "../ciphers/data/latest";
import { SecureNoteView } from "../view/secure-note.view";

export class SecureNote extends Domain {
  type: SecureNoteType;

  constructor(obj?: SecureNoteDataLatest) {
    super();
    if (obj == null) {
      return;
    }

    this.type = obj.type;
  }

  decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<SecureNoteView> {
    return Promise.resolve(new SecureNoteView(this));
  }

  toSecureNoteData(): SecureNoteDataLatest {
    const n = new SecureNoteDataLatest();
    n.type = this.type;
    return n;
  }

  static fromJSON(obj: Jsonify<SecureNote>): SecureNote {
    if (obj == null) {
      return null;
    }

    return Object.assign(new SecureNote(), obj);
  }
}
