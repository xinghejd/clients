import { CipherV1 } from "../domain/cipher";

export class CipherPartialRequest {
  folderId: string;
  favorite: boolean;

  constructor(cipher: CipherV1) {
    this.folderId = cipher.folderId;
    this.favorite = cipher.favorite;
  }
}
