import { UserKey, MasterKey } from "../../types/key";
import { AuthRequestResponse } from "../models/response/auth-request.response";

export abstract class AuthRequestCryptoServiceAbstraction {
  abstract setUserKeyAfterDecryptingSharedUserKey: (
    authReqResponse: AuthRequestResponse,
    authReqPrivateKey: ArrayBuffer,
  ) => Promise<void>;
  abstract setKeysAfterDecryptingSharedMasterKeyAndHash: (
    authReqResponse: AuthRequestResponse,
    authReqPrivateKey: ArrayBuffer,
  ) => Promise<void>;

  abstract decryptPubKeyEncryptedUserKey: (
    pubKeyEncryptedUserKey: string,
    privateKey: ArrayBuffer,
  ) => Promise<UserKey>;

  abstract decryptPubKeyEncryptedMasterKeyAndHash: (
    pubKeyEncryptedMasterKey: string,
    pubKeyEncryptedMasterKeyHash: string,
    privateKey: ArrayBuffer,
  ) => Promise<{ masterKey: MasterKey; masterKeyHash: string }>;
}
