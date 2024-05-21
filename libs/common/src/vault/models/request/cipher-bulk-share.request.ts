import { CipherV1 } from "../domain/cipher";

import { CipherWithIdRequest } from "./cipher-with-id.request";

export class CipherBulkShareRequest {
  ciphers: CipherWithIdRequest[];
  collectionIds: string[];

  constructor(ciphers: CipherV1[], collectionIds: string[]) {
    if (ciphers != null) {
      this.ciphers = [];
      ciphers.forEach((c) => {
        this.ciphers.push(new CipherWithIdRequest(c));
      });
    }
    this.collectionIds = collectionIds;
  }
}
