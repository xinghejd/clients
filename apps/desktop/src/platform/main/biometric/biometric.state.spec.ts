import {
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
} from "./biometric.state";

describe("biometric unlock enabled", () => {
  const sut = BIOMETRIC_UNLOCK_ENABLED;

  it("should deserialize biometric unlock enabled state", () => {
    const biometricLockEnabled = true;

    const result = sut.deserializer(JSON.parse(JSON.stringify(biometricLockEnabled)));

    expect(result).toEqual(biometricLockEnabled);
  });
});

describe("dismissed biometric require password on start callout", () => {
  it("should deserialize dismissed biometric require password on start callout state", () => {
    const sut = DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const dismissedBiometricRequirePasswordOnStartCallout = true;

    const result = sut.deserializer(
      JSON.parse(JSON.stringify(dismissedBiometricRequirePasswordOnStartCallout)),
    );

    expect(result).toEqual(dismissedBiometricRequirePasswordOnStartCallout);
  });
});

describe("encrypted client key half", () => {
  it("should deserialize encrypted client key half state", () => {
    const sut = DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const encryptedClientKeyHalf = "encryptedClientKeyHalf";

    const result = sut.deserializer(JSON.parse(JSON.stringify(encryptedClientKeyHalf)));

    expect(result).toEqual(encryptedClientKeyHalf);
  });
});

describe("biometric text", () => {
  it("should deserialize biometric text state", () => {
    const sut = DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const biometricText = "biometricText";

    const result = sut.deserializer(JSON.parse(JSON.stringify(biometricText)));

    expect(result).toEqual(biometricText);
  });
});

describe("biometric no auto prompt text", () => {
  it("should deserialize biometric no auto prompt text state", () => {
    const sut = DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const biometricNoAutoPromptText = "biometricNoAutoPromptText";

    const result = sut.deserializer(JSON.parse(JSON.stringify(biometricNoAutoPromptText)));

    expect(result).toEqual(biometricNoAutoPromptText);
  });
});
