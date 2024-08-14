import { makeStaticByteArray } from "../../../../spec";
import { EncryptionType } from "../../enums";

import { SymmetricCryptoKey } from "./symmetric-crypto-key";

describe("SymmetricCryptoKey", () => {
  it("errors if no key", () => {
    const t = () => {
      new SymmetricCryptoKey(null);
    };

    expect(t).toThrowError("Must provide key");
  });

  describe("guesses encKey from key length", () => {
    it("AesCbc256_B64", () => {
      const key = makeStaticByteArray(32);
      const cryptoKey = new SymmetricCryptoKey(key);

      expect(cryptoKey).toEqual({
        encKey: key,
        encType: 0,
        key: key,
        macKey: null,
      });
    });

    it("AesCbc128_HmacSha256_B64", () => {
      const key = makeStaticByteArray(32);
      const cryptoKey = new SymmetricCryptoKey(key, EncryptionType.AesCbc128_HmacSha256_B64);

      expect(cryptoKey).toEqual({
        encKey: key.slice(0, 16),
        encType: 1,
        key: key,
        macKey: key.slice(16, 32),
      });
    });

    it("AesCbc256_HmacSha256_B64", () => {
      const key = makeStaticByteArray(64);
      const cryptoKey = new SymmetricCryptoKey(key);

      expect(cryptoKey).toEqual({
        encKey: key.slice(0, 32),
        encType: 2,
        key: key,
        macKey: key.slice(32, 64),
      });
    });

    it("unknown length", () => {
      const t = () => {
        new SymmetricCryptoKey(makeStaticByteArray(30));
      };

      expect(t).toThrowError("Unable to determine encType.");
    });
  });

  it("toJSON creates object for serialization", () => {
    const key = new SymmetricCryptoKey(makeStaticByteArray(64));
    const actual = key.toJSON();

    const expected = { keyB64: key.keyB64 };

    expect(actual).toEqual(expected);
  });

  it("fromJSON hydrates new object", () => {
    const expected = new SymmetricCryptoKey(makeStaticByteArray(64));
    const actual = SymmetricCryptoKey.fromJSON({ keyB64: expected.keyB64 });

    expect(actual).toEqual(expected);
    expect(actual).toBeInstanceOf(SymmetricCryptoKey);
  });
});
