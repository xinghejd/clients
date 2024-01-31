import { FakeStateProvider } from "@bitwarden/common/../spec/fake-state-provider";
import { mock } from "jest-mock-extended";
import { of } from "rxjs";

import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { BiometricStateService } from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "@bitwarden/common/types/csprng";
import { UserId } from "@bitwarden/common/types/guid";
import { UserKey } from "@bitwarden/common/types/key";

import {
  FakeAccountService,
  mockAccountServiceWith,
} from "../../../../../libs/common/spec/fake-account-service";

import { DefaultElectronCryptoService } from "./electron-crypto.service";
import { ElectronStateService } from "./electron-state.service.abstraction";

describe("electronCryptoService", () => {
  let electronCryptoService: DefaultElectronCryptoService;

  const cryptoFunctionService = mock<CryptoFunctionService>();
  const encryptService = mock<EncryptService>();
  const platformUtilService = mock<PlatformUtilsService>();
  const logService = mock<LogService>();
  const stateService = mock<ElectronStateService>();
  const biometricStateService = mock<BiometricStateService>();
  let accountService: FakeAccountService;
  let stateProvider: FakeStateProvider;

  const mockUserId = "mock user id" as UserId;

  beforeEach(() => {
    accountService = mockAccountServiceWith("userId" as UserId);
    stateProvider = new FakeStateProvider(accountService);

    electronCryptoService = new DefaultElectronCryptoService(
      cryptoFunctionService,
      encryptService,
      platformUtilService,
      logService,
      stateService,
      accountService,
      stateProvider,
      biometricStateService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("instantiates", () => {
    expect(electronCryptoService).not.toBeFalsy();
  });

  describe("setUserKey", () => {
    let mockUserKey: UserKey;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64) as CsprngArray;
      mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
    });

    describe("Biometric Key refresh", () => {
      it("sets an Biometric key if biometric unlock is enabled and the platform supports secure storage", async () => {
        biometricStateService.getBiometricUnlockEnabled.mockResolvedValue(true);
        platformUtilService.supportsSecureStorage.mockReturnValue(true);

        await electronCryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setUserKeyBiometric).toHaveBeenCalledWith(
          expect.objectContaining({ key: expect.any(String), clientEncKeyHalf: null }),
          {
            userId: mockUserId,
          },
        );
      });

      it("clears the Biometric key if getBiometricUnlock is false or the platform does not support secure storage", async () => {
        biometricStateService.getBiometricUnlockEnabled.mockResolvedValue(true);
        biometricStateService.biometricUnlockEnabled$ = of(true);
        platformUtilService.supportsSecureStorage.mockReturnValue(false);

        await electronCryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setUserKeyBiometric).toHaveBeenCalledWith(null, {
          userId: mockUserId,
        });
      });

      it("clears the old deprecated Biometric key whenever a User Key is set", async () => {
        await electronCryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setCryptoMasterKeyBiometric).toHaveBeenCalledWith(null, {
          userId: mockUserId,
        });
      });
    });
  });
});
