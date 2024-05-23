import { EncArrayBuffer } from "../../../platform/models/domain/enc-array-buffer";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { CipherResponse } from "../../models/ciphers/response/version-agnostic/cipher.response";
import { Cipher } from "../../models/domain/cipher";

export abstract class CipherFileUploadService {
  upload: (
    cipher: Cipher,
    encFileName: EncString,
    encData: EncArrayBuffer,
    admin: boolean,
    dataEncKey: [SymmetricCryptoKey, EncString],
  ) => Promise<CipherResponse>;
}
