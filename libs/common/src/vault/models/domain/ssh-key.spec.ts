import { mockEnc } from "../../../../spec";
import { SSHKeyApi } from "../api/ssh-key.api";
import { SSHKeyData } from "../data/ssh-key.data";

import { SSHKey } from "./ssh-key";

describe("SSHkey", () => {
  let data: SSHKeyData;

  beforeEach(() => {
    data = new SSHKeyData(
      new SSHKeyApi({
        PrivateKey: "privateKey",
        PublicKey: "publicKey",
        KeyFingerprint: "keyFingerprint",
      }),
    );
  });

  it("Convert", () => {
    const sshKey = new SSHKey(data);

    expect(sshKey).toEqual({
      privateKey: { encryptedString: "privateKey", encryptionType: 0 },
      publicKey: { encryptedString: "publicKey", encryptionType: 0 },
      keyFingerprint: { encryptedString: "keyFingerprint", encryptionType: 0 },
    });
  });

  it("Convert from empty", () => {
    const data = new SSHKeyData();
    const sshKey = new SSHKey(data);

    expect(sshKey).toEqual({
      privateKey: null,
      publicKey: null,
      keyFingerprint: null,
    });
  });

  it("toSSHKeyData", () => {
    const sshKey = new SSHKey(data);
    expect(sshKey.toSSHKeyData()).toEqual(data);
  });

  it("Decrypt", async () => {
    const sshKey = Object.assign(new SSHKey(), {
      privateKey: mockEnc("privateKey"),
      publicKey: mockEnc("publicKey"),
      keyFingerprint: mockEnc("keyFingerprint"),
    });
    const expectedView = {
      privateKey: "privateKey",
      publicKey: "publicKey",
      keyFingerprint: "keyFingerprint",
    };

    const loginView = await sshKey.decrypt(null);
    expect(loginView).toEqual(expectedView);
  });

  describe("fromJSON", () => {
    it("returns null if object is null", () => {
      expect(SSHKey.fromJSON(null)).toBeNull();
    });
  });
});
