import { mockEnc } from "../../../../spec";
import { EncryptionType } from "../../../enums";
import { EncString } from "../../../platform/models/domain/enc-string";
import { Fido2CredentialData } from "../data/fido2-credential.data";

import { Fido2Credential } from "./fido2-credential";

describe("Fido2Credential", () => {
  let mockDate: Date;

  beforeEach(() => {
    mockDate = new Date("2023-01-01T12:00:00.000Z");
  });

  describe("constructor", () => {
    it("returns all fields null when given empty data parameter", () => {
      const data = new Fido2CredentialData();
      const fido2Credential = new Fido2Credential(data);

      expect(fido2Credential).toEqual({
        credentialId: null,
        keyType: null,
        keyAlgorithm: null,
        keyCurve: null,
        keyValue: null,
        rpId: null,
        userHandle: null,
        rpName: null,
        userDisplayName: null,
        counter: null,
        discoverable: null,
        creationDate: null,
      });
    });

    it("returns all fields as EncStrings except creationDate when given full Fido2CredentialData", () => {
      const data: Fido2CredentialData = {
        credentialId: "credentialId",
        keyType: "public-key",
        keyAlgorithm: "ECDSA",
        keyCurve: "P-256",
        keyValue: "keyValue",
        rpId: "rpId",
        userHandle: "userHandle",
        counter: "counter",
        rpName: "rpName",
        userDisplayName: "userDisplayName",
        discoverable: "discoverable",
        creationDate: mockDate.toISOString(),
      };
      const fido2Credential = new Fido2Credential(data);

      expect(fido2Credential).toEqual({
        credentialId: { encryptedString: "credentialId", encryptionType: 0 },
        keyType: { encryptedString: "public-key", encryptionType: 0 },
        keyAlgorithm: { encryptedString: "ECDSA", encryptionType: 0 },
        keyCurve: { encryptedString: "P-256", encryptionType: 0 },
        keyValue: { encryptedString: "keyValue", encryptionType: 0 },
        rpId: { encryptedString: "rpId", encryptionType: 0 },
        userHandle: { encryptedString: "userHandle", encryptionType: 0 },
        counter: { encryptedString: "counter", encryptionType: 0 },
        rpName: { encryptedString: "rpName", encryptionType: 0 },
        userDisplayName: { encryptedString: "userDisplayName", encryptionType: 0 },
        discoverable: { encryptedString: "discoverable", encryptionType: 0 },
        creationDate: mockDate,
      });
    });

    it("should not populate fields when data parameter is not given", () => {
      const fido2Credential = new Fido2Credential();

      expect(fido2Credential).toEqual({
        credentialId: null,
      });
    });
  });

  describe("decrypt", () => {
    it("decrypts and populates all fields when populated with EncStrings", async () => {
      const fido2Credential = new Fido2Credential();
      fido2Credential.credentialId = mockEnc("credentialId");
      fido2Credential.keyType = mockEnc("keyType");
      fido2Credential.keyAlgorithm = mockEnc("keyAlgorithm");
      fido2Credential.keyCurve = mockEnc("keyCurve");
      fido2Credential.keyValue = mockEnc("keyValue");
      fido2Credential.rpId = mockEnc("rpId");
      fido2Credential.userHandle = mockEnc("userHandle");
      fido2Credential.counter = mockEnc("2");
      fido2Credential.rpName = mockEnc("rpName");
      fido2Credential.userDisplayName = mockEnc("userDisplayName");
      fido2Credential.discoverable = mockEnc("true");
      fido2Credential.creationDate = mockDate;

      const fido2CredentialView = await fido2Credential.decrypt(null);

      expect(fido2CredentialView).toEqual({
        credentialId: "credentialId",
        keyType: "keyType",
        keyAlgorithm: "keyAlgorithm",
        keyCurve: "keyCurve",
        keyValue: "keyValue",
        rpId: "rpId",
        userHandle: "userHandle",
        rpName: "rpName",
        userDisplayName: "userDisplayName",
        counter: 2,
        discoverable: true,
        creationDate: mockDate,
      });
    });
  });

  describe("toFido2CredentialData", () => {
    it("encodes to data object when converted from Fido2CredentialData and back", () => {
      const data: Fido2CredentialData = {
        credentialId: "credentialId",
        keyType: "public-key",
        keyAlgorithm: "ECDSA",
        keyCurve: "P-256",
        keyValue: "keyValue",
        rpId: "rpId",
        userHandle: "userHandle",
        counter: "2",
        rpName: "rpName",
        userDisplayName: "userDisplayName",
        discoverable: "true",
        creationDate: mockDate.toISOString(),
      };

      const fido2Credential = new Fido2Credential(data);
      const result = fido2Credential.toFido2CredentialData();

      expect(result).toEqual(data);
    });
  });

  describe("fromJSON", () => {
    it("recreates equivalent object when converted to JSON and back", () => {
      const fido2Credential = new Fido2Credential();
      fido2Credential.credentialId = createEncryptedEncString("credentialId");
      fido2Credential.keyType = createEncryptedEncString("keyType");
      fido2Credential.keyAlgorithm = createEncryptedEncString("keyAlgorithm");
      fido2Credential.keyCurve = createEncryptedEncString("keyCurve");
      fido2Credential.keyValue = createEncryptedEncString("keyValue");
      fido2Credential.rpId = createEncryptedEncString("rpId");
      fido2Credential.userHandle = createEncryptedEncString("userHandle");
      fido2Credential.counter = createEncryptedEncString("2");
      fido2Credential.rpName = createEncryptedEncString("rpName");
      fido2Credential.userDisplayName = createEncryptedEncString("userDisplayName");
      fido2Credential.discoverable = createEncryptedEncString("discoverable");
      fido2Credential.creationDate = mockDate;

      const json = JSON.stringify(fido2Credential);
      const result = Fido2Credential.fromJSON(JSON.parse(json));

      expect(result).toEqual(fido2Credential);
    });

    it("returns null if input is null", () => {
      expect(Fido2Credential.fromJSON(null)).toBeNull();
    });
  });
});

function createEncryptedEncString(s: string): EncString {
  return new EncString(`${EncryptionType.AesCbc256_HmacSha256_B64}.${s}`);
}
