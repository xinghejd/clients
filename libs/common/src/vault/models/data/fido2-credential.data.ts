import { Fido2CredentialApiLatest } from "../ciphers/api/latest";

export class Fido2CredentialData {
  credentialId: string;
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  userHandle: string;
  userName: string;
  counter: string;
  rpName: string;
  userDisplayName: string;
  discoverable: string;
  creationDate: string;

  // TODO: Implement version support
  constructor(data?: Fido2CredentialApiLatest) {
    if (data == null) {
      return;
    }

    this.credentialId = data.credentialId;
    this.keyType = data.keyType;
    this.keyAlgorithm = data.keyAlgorithm;
    this.keyCurve = data.keyCurve;
    this.keyValue = data.keyValue;
    this.rpId = data.rpId;
    this.userHandle = data.userHandle;
    this.userName = data.userName;
    this.counter = data.counter;
    this.rpName = data.rpName;
    this.userDisplayName = data.userDisplayName;
    this.discoverable = data.discoverable;
    this.creationDate = data.creationDate;
  }
}
