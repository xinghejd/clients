import { firstValueFrom } from "rxjs";

import { makeEncString } from "@bitwarden/common/spec";
import { UserId } from "@bitwarden/common/types/guid";

import { mockAccountServiceWith } from "../../../../../../libs/common/spec/fake-account-service";
import { FakeActiveUserStateProvider } from "../../../../../../libs/common/spec/fake-state-provider";

import { BiometricStateService, DefaultBiometricStateService } from "./biometric-state.service";
import {
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
  ENCRYPTED_CLIENT_KEY_HALF,
} from "./biometric.state";

describe("BiometricStateService", () => {
  let sut: BiometricStateService;
  const userId = "userId" as UserId;
  const encClientKeyHalf = makeEncString();
  const encryptedClientKeyHalf = encClientKeyHalf.encryptedString;
  const accountService = mockAccountServiceWith(userId);
  let stateProvider: FakeActiveUserStateProvider;

  beforeEach(() => {
    stateProvider = new FakeActiveUserStateProvider(accountService);

    sut = new DefaultBiometricStateService(stateProvider);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("requirePasswordOnState$", () => {
    it("should be false when encryptedClientKeyHalf is undefined", async () => {
      stateProvider.getFake(ENCRYPTED_CLIENT_KEY_HALF).nextState(undefined);
      expect(await firstValueFrom(sut.requirePasswordOnStart$)).toBe(false);
    });

    it("should be true when encryptedClientKeyHalf is defined", async () => {
      stateProvider.getFake(ENCRYPTED_CLIENT_KEY_HALF).nextState(encryptedClientKeyHalf);
      expect(await firstValueFrom(sut.requirePasswordOnStart$)).toBe(true);
    });
  });

  describe("encryptedClientKeyHalf$", () => {
    it("should track the encryptedClientKeyHalf state", async () => {
      const state = stateProvider.getFake(ENCRYPTED_CLIENT_KEY_HALF);
      state.nextState(undefined);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toBe(undefined);

      state.nextState(encryptedClientKeyHalf);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toBe(encryptedClientKeyHalf);
    });
  });

  describe("biometricUnlockEnabled$", () => {
    it("should track the biometricUnlockEnabled state", async () => {
      const state = stateProvider.getFake(BIOMETRIC_UNLOCK_ENABLED);
      state.nextState(undefined);

      expect(await firstValueFrom(sut.biometricUnlockEnabled$)).toBe(false);

      state.nextState(true);

      expect(await firstValueFrom(sut.biometricUnlockEnabled$)).toBe(true);
    });
  });

  describe("dismissedBiometricRequirePasswordOnStartCallout$", () => {
    it("should track the dismissedBiometricRequirePasswordOnStartCallout state", async () => {
      const state = stateProvider.getFake(DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT);
      state.nextState(undefined);

      expect(await firstValueFrom(sut.dismissedBiometricRequirePasswordOnStartCallout$)).toBe(
        false,
      );

      state.nextState(true);

      expect(await firstValueFrom(sut.dismissedBiometricRequirePasswordOnStartCallout$)).toBe(true);
    });
  });

  describe("setEncryptedClientKeyHalf", () => {
    it("should update the encryptedClientKeyHalf$", async () => {
      await sut.setEncryptedClientKeyHalf(encClientKeyHalf);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toBe(encryptedClientKeyHalf);
    });
  });

  describe("setDismissedBiometricRequirePasswordOnStartCallout", () => {
    it("should update the dismissedBiometricRequirePasswordOnStartCallout$", async () => {
      await sut.setDismissedBiometricRequirePasswordOnStartCallout(true);

      expect(await firstValueFrom(sut.dismissedBiometricRequirePasswordOnStartCallout$)).toBe(true);
    });
  });
});
