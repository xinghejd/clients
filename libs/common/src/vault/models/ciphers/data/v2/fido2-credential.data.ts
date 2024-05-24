import { SymmetricCryptoKey } from "../../../../../platform/models/domain/symmetric-crypto-key";
import { Fido2CredentialApiV2 } from "../../api/v2/fido2-credential.api";
import { decryptString } from "../migration/data-migration-utils";
import { Fido2CredentialDataV1 } from "../v1/fido2-credential.data";

export class Fido2CredentialDataV2 {
  credentialIdType: "uuid" | "base64";
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

  constructor(data?: Fido2CredentialApiV2) {
    if (data == null) {
      return;
    }

    this.credentialIdType = data.credentialIdType;
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

  static async migrate(
    old: Fido2CredentialDataV1,
    organizationId: string,
    key: SymmetricCryptoKey,
  ): Promise<Fido2CredentialDataV2> {
    const migrated = new Fido2CredentialDataV2();

    // NOTE: This is fake, it's only here to demonstrate decryption during migration.
    // "uuid" was actually implied in V1 because it was the only supported type, there was never
    // any "b64." prefixex.
    const decryptedCredentialId = await decryptString(old.credentialId, organizationId, key);
    if (decryptedCredentialId.startsWith("b64.")) {
      migrated.credentialIdType = "base64";
    } else {
      migrated.credentialIdType = "uuid";
    }

    // This is the actual migration code.
    // migrated.credentialIdType = "uuid";
    migrated.credentialId = old.credentialId;
    migrated.keyType = old.keyType;
    migrated.keyAlgorithm = old.keyAlgorithm;
    migrated.keyCurve = old.keyCurve;
    migrated.keyValue = old.keyValue;
    migrated.rpId = old.rpId;
    migrated.userHandle = old.userHandle;
    migrated.userName = old.userName;
    migrated.counter = old.counter;
    migrated.rpName = old.rpName;
    migrated.userDisplayName = old.userDisplayName;
    migrated.discoverable = old.discoverable;
    migrated.creationDate = old.creationDate;

    return migrated;
  }
}
