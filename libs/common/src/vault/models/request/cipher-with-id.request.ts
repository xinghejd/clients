import { CipherV1 } from "../domain/cipher";

import { CipherRequest } from "./cipher.request";

export class CipherWithIdRequest extends CipherRequest {
  id: string;

  constructor(cipher: CipherV1) {
    super(cipher);
    this.id = cipher.id;
  }
}
