import { mock } from "jest-mock-extended";

import { makeStaticByteArray } from "../../../spec";
import { EncryptionType } from "../../enums";
import { CsprngArray } from "../../types/csprng";
import { CryptoFunctionService } from "../abstractions/crypto-function.service";
import { LogService } from "../abstractions/log.service";
import { Utils } from "../misc/utils";
import { EncArrayBuffer } from "../models/domain/enc-array-buffer";
import { EncString } from "../models/domain/enc-string";
import { SymmetricCryptoKey } from "../models/domain/symmetric-crypto-key";
import { EncryptServiceImplementation } from "../services/cryptography/encrypt.service.implementation";

describe("EncryptService", () => {
  const cryptoFunctionService = mock<CryptoFunctionService>();
  const logService = mock<LogService>();

  let encryptService: EncryptServiceImplementation;

  beforeEach(() => {
    encryptService = new EncryptServiceImplementation(cryptoFunctionService, logService, true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("encryptToBytes", () => {
    const plainValue = makeStaticByteArray(16, 1);
    const iv = makeStaticByteArray(16, 30);
    const mac = makeStaticByteArray(32, 40);
    const encryptedData = makeStaticByteArray(20, 50);

    it("throws if no key is provided", () => {
      return expect(encryptService.encryptToBytes(plainValue, null)).rejects.toThrow(
        "No encryption key"
      );
    });

    describe("encrypts data", () => {
      beforeEach(() => {
        cryptoFunctionService.randomBytes.calledWith(16).mockResolvedValueOnce(iv as CsprngArray);
        cryptoFunctionService.aesEncrypt.mockResolvedValue(encryptedData);
      });

      it("using a key which supports mac", async () => {
        const key = mock<SymmetricCryptoKey>();
        const encType = EncryptionType.AesCbc128_HmacSha256_B64;
        key.encType = encType;

        key.macKey = makeStaticByteArray(16, 20);

        cryptoFunctionService.hmac.mockResolvedValue(mac);

        const actual = await encryptService.encryptToBytes(plainValue, key);

        expect(actual.encryptionType).toEqual(encType);
        expect(actual.ivBytes).toEqualBuffer(iv);
        expect(actual.macBytes).toEqualBuffer(mac);
        expect(actual.dataBytes).toEqualBuffer(encryptedData);
        expect(actual.buffer.byteLength).toEqual(
          1 + iv.byteLength + mac.byteLength + encryptedData.byteLength
        );
      });

      it("using a key which doesn't support mac", async () => {
        const key = mock<SymmetricCryptoKey>();
        const encType = EncryptionType.AesCbc256_B64;
        key.encType = encType;

        key.macKey = null;

        const actual = await encryptService.encryptToBytes(plainValue, key);

        expect(cryptoFunctionService.hmac).not.toBeCalled();

        expect(actual.encryptionType).toEqual(encType);
        expect(actual.ivBytes).toEqualBuffer(iv);
        expect(actual.macBytes).toBeNull();
        expect(actual.dataBytes).toEqualBuffer(encryptedData);
        expect(actual.buffer.byteLength).toEqual(1 + iv.byteLength + encryptedData.byteLength);
      });
    });
  });

  describe("decryptToBytes", () => {
    const encType = EncryptionType.AesCbc256_HmacSha256_B64;
    const key = new SymmetricCryptoKey(makeStaticByteArray(64, 100), encType);
    const computedMac = new Uint8Array(1);
    const encBuffer = new EncArrayBuffer(makeStaticByteArray(60, encType));

    beforeEach(() => {
      cryptoFunctionService.hmac.mockResolvedValue(computedMac);
    });

    it("throws if no key is provided", () => {
      return expect(encryptService.decryptToBytes(encBuffer, null)).rejects.toThrow(
        "No encryption key"
      );
    });

    it("throws if no encrypted value is provided", () => {
      return expect(encryptService.decryptToBytes(null, key)).rejects.toThrow(
        "Nothing provided for decryption"
      );
    });

    it("decrypts data with provided key", async () => {
      const decryptedBytes = makeStaticByteArray(10, 200);

      cryptoFunctionService.hmac.mockResolvedValue(makeStaticByteArray(1));
      cryptoFunctionService.compare.mockResolvedValue(true);
      cryptoFunctionService.aesDecrypt.mockResolvedValueOnce(decryptedBytes);

      const actual = await encryptService.decryptToBytes(encBuffer, key);

      expect(cryptoFunctionService.aesDecrypt).toBeCalledWith(
        expect.toEqualBuffer(encBuffer.dataBytes),
        expect.toEqualBuffer(encBuffer.ivBytes),
        expect.toEqualBuffer(key.encKey)
      );

      expect(actual).toEqualBuffer(decryptedBytes);
    });

    it("compares macs using CryptoFunctionService", async () => {
      const expectedMacData = new Uint8Array(
        encBuffer.ivBytes.byteLength + encBuffer.dataBytes.byteLength
      );
      expectedMacData.set(new Uint8Array(encBuffer.ivBytes));
      expectedMacData.set(new Uint8Array(encBuffer.dataBytes), encBuffer.ivBytes.byteLength);

      await encryptService.decryptToBytes(encBuffer, key);

      expect(cryptoFunctionService.hmac).toBeCalledWith(
        expect.toEqualBuffer(expectedMacData),
        key.macKey,
        "sha256"
      );

      expect(cryptoFunctionService.compare).toBeCalledWith(
        expect.toEqualBuffer(encBuffer.macBytes),
        expect.toEqualBuffer(computedMac)
      );
    });

    it("returns null if macs don't match", async () => {
      cryptoFunctionService.compare.mockResolvedValue(false);

      const actual = await encryptService.decryptToBytes(encBuffer, key);
      expect(cryptoFunctionService.compare).toHaveBeenCalled();
      expect(cryptoFunctionService.aesDecrypt).not.toHaveBeenCalled();
      expect(actual).toBeNull();
    });

    it("returns null if encTypes don't match", async () => {
      key.encType = EncryptionType.AesCbc256_B64;
      cryptoFunctionService.compare.mockResolvedValue(true);

      const actual = await encryptService.decryptToBytes(encBuffer, key);

      expect(actual).toBeNull();
      expect(cryptoFunctionService.aesDecrypt).not.toHaveBeenCalled();
    });
  });

  describe("resolveLegacyKey", () => {
    it("creates a legacy key if required", async () => {
      const key = new SymmetricCryptoKey(makeStaticByteArray(32), EncryptionType.AesCbc256_B64);
      const encString = mock<EncString>();
      encString.encryptionType = EncryptionType.AesCbc128_HmacSha256_B64;

      const actual = encryptService.resolveLegacyKey(key, encString);

      const expected = new SymmetricCryptoKey(key.key, EncryptionType.AesCbc128_HmacSha256_B64);
      expect(actual).toEqual(expected);
    });

    it("does not create a legacy key if not required", async () => {
      const encType = EncryptionType.AesCbc256_HmacSha256_B64;
      const key = new SymmetricCryptoKey(makeStaticByteArray(64), encType);
      const encString = mock<EncString>();
      encString.encryptionType = encType;

      const actual = encryptService.resolveLegacyKey(key, encString);

      expect(actual).toEqual(key);
    });
  });

  describe("encryptWithPurpose", () => {
    const encryptedValue = new EncString("2.iv|data|mac");
    const key = new SymmetricCryptoKey(
      makeStaticByteArray(64, 1),
      EncryptionType.AesCbc256_HmacSha256_B64
    );
    const purpose = "purpose";
    const encPurpose = makeStaticByteArray(32, 2);
    const encPurposeB64 = Utils.fromBufferToB64(encPurpose);
    const plainValue = "plainValue";
    let originalEncryptMethod: (
      plainValue: string | Uint8Array,
      key: SymmetricCryptoKey
    ) => Promise<EncString>;

    beforeEach(() => {
      originalEncryptMethod = encryptService.encrypt;
      encryptService.encrypt = jest.fn().mockResolvedValue(encryptedValue);
      cryptoFunctionService.hkdf.mockResolvedValue(encPurpose);
    });

    afterEach(() => {
      encryptService.encrypt = originalEncryptMethod;
    });

    it("should use the encrypt method", async () => {
      await encryptService.encryptWithPurpose(plainValue, key, purpose);

      expect(encryptService.encrypt).toHaveBeenCalledWith(plainValue, key);
    });

    it("should produce an encrypted key with the correct purpose", async () => {
      const actual = await encryptService.encryptWithPurpose(plainValue, key, purpose);

      expect(cryptoFunctionService.hkdf).toHaveBeenCalled();
      expect(actual).toEqual(
        expect.objectContaining({
          ...new EncString(`7.iv|data|mac|${encPurposeB64}`),
        })
      );
    });

    test.each([
      EncryptionType.AesCbc256_B64,
      EncryptionType.AesCbc128_HmacSha256_B64,
      EncryptionType.Rsa2048_OaepSha1_B64,
      EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64,
      EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64,
      EncryptionType.Rsa2048_OaepSha256_HmacSha256_B64,
    ])(
      "should throw if the encryption type is not supported for encryption type %p",
      async (encType) => {
        const key = mock<SymmetricCryptoKey>();
        key.encType = encType;
        await expect(encryptService.encryptWithPurpose(plainValue, key, purpose)).rejects.toThrow(
          `EncryptionType ${encType} cannot be extended to support purpose encryption.`
        );
      }
    );

    it("should throw if no purpose is provided", async () => {
      await expect(encryptService.encryptWithPurpose(plainValue, key, null)).rejects.toThrow(
        "No purpose provided for encryption."
      );
    });
  });

  describe("decryptToUtf8WithPurpose", () => {
    let originalDecryptToUtf8Method: (
      encString: EncString,
      key: SymmetricCryptoKey
    ) => Promise<string>;
    const encPurpose = makeStaticByteArray(32, 1);
    const encPurposeB64 = Utils.fromBufferToB64(encPurpose);
    const encString = new EncString(`7.iv|data|mac|${encPurposeB64}`);
    const key = new SymmetricCryptoKey(
      makeStaticByteArray(64, 2),
      EncryptionType.AesCbc256_HmacSha256_B64
    );

    beforeEach(() => {
      originalDecryptToUtf8Method = encryptService.decryptToUtf8;
      encryptService.decryptToUtf8 = jest.fn().mockResolvedValue("decrypted");
      cryptoFunctionService.hkdf.mockResolvedValue(encPurpose);
    });

    afterEach(() => {
      encryptService.decryptToUtf8 = originalDecryptToUtf8Method;
    });

    it("should throw if no purpose is provided", async () => {
      await expect(encryptService.decryptToUtf8WithPurpose(encString, key, null)).rejects.toThrow(
        "No purpose provided for decryption."
      );
    });

    it("should call decryptToUtf8 with the correct key", async () => {
      cryptoFunctionService.compareFast.mockResolvedValue(true);
      await encryptService.decryptToUtf8WithPurpose(encString, key, "purpose");

      expect(encryptService.decryptToUtf8).toHaveBeenCalledWith(
        expect.objectContaining({
          ...new EncString("2.iv|data|mac"),
        }),
        key
      );
    });

    it("should throw if the purpose does not match", async () => {
      cryptoFunctionService.compareFast.mockResolvedValue(false);
      await expect(
        encryptService.decryptToUtf8WithPurpose(encString, key, "purpose")
      ).rejects.toThrow("purpose failed.");
    });

    it("should return the decrypted value if the purpose matches", async () => {
      cryptoFunctionService.compareFast.mockResolvedValue(true);
      const actual = await encryptService.decryptToUtf8WithPurpose(encString, key, "purpose");

      expect(actual).toEqual("decrypted");
    });
  });
});
