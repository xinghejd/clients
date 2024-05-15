import { mock, MockProxy } from "jest-mock-extended";

import { makeStaticByteArray } from "../../../../spec";
import { CryptoFunctionService } from "../../abstractions/crypto-function.service";
import { LogService } from "../../abstractions/log.service";
import { EncryptionType } from "../../enums";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";
import { DefaultConfigService } from "../config/default-config.service";

import { MultiWorkerEncryptServiceImplementation } from "./multitworker-encrypt.service.implementation";

describe("BrowserMultithreadEncryptServiceImplementation", () => {
  let cryptoFunctionServiceMock: MockProxy<CryptoFunctionService>;
  let logServiceMock: MockProxy<LogService>;
  let configServiceMock: MockProxy<DefaultConfigService>;
  let encryptService: MultiWorkerEncryptServiceImplementation;
  const encType = EncryptionType.AesCbc256_HmacSha256_B64;
  const key = new SymmetricCryptoKey(makeStaticByteArray(64, 100), encType);

  beforeEach(() => {
    cryptoFunctionServiceMock = mock<CryptoFunctionService>();
    logServiceMock = mock<LogService>();
    configServiceMock = mock<DefaultConfigService>();
    configServiceMock.getFeatureFlag.mockResolvedValue;
    encryptService = new MultiWorkerEncryptServiceImplementation(
      cryptoFunctionServiceMock,
      logServiceMock,
      configServiceMock,
      false,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns an empty array if the passed items are not defined", async () => {
    const result = await encryptService.decryptItems(null, key);

    expect(result).toEqual([]);
  });

  it("returns an empty array for an empty input successfully", async () => {
    const result = await encryptService.decryptItems([], key);

    expect(result).toEqual([]);
  });
});
