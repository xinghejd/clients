import {
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT,
  FINGERPRINT_VALIDATED,
  PROMPT_AUTOMATICALLY,
  PROMPT_CANCELLED,
} from "./biometric.state";

describe("biometric unlock enabled", () => {
  const sut = BIOMETRIC_UNLOCK_ENABLED;

  it("should deserialize biometric unlock enabled state", () => {
    const biometricLockEnabled = true;

    const result = sut.deserializer(JSON.parse(JSON.stringify(biometricLockEnabled)));

    expect(result).toEqual(biometricLockEnabled);
  });
});

describe("dismissed require password on start callout", () => {
  it("should deserialize dismissed require password on start callout state", () => {
    const sut = DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const dismissedBiometricRequirePasswordOnStartCallout = true;

    const result = sut.deserializer(
      JSON.parse(JSON.stringify(dismissedBiometricRequirePasswordOnStartCallout)),
    );

    expect(result).toEqual(dismissedBiometricRequirePasswordOnStartCallout);
  });
});

describe("encrypted client key half", () => {
  it("should deserialize encrypted client key half state", () => {
    const sut = DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const encryptedClientKeyHalf = "encryptedClientKeyHalf";

    const result = sut.deserializer(JSON.parse(JSON.stringify(encryptedClientKeyHalf)));

    expect(result).toEqual(encryptedClientKeyHalf);
  });
});

describe("biometric text", () => {
  it("should deserialize biometric text state", () => {
    const sut = DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const biometricText = "biometricText";

    const result = sut.deserializer(JSON.parse(JSON.stringify(biometricText)));

    expect(result).toEqual(biometricText);
  });
});

describe("no auto prompt text", () => {
  it("should deserialize no auto prompt text state", () => {
    const sut = DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT;
    const biometricNoAutoPromptText = "biometricNoAutoPromptText";

    const result = sut.deserializer(JSON.parse(JSON.stringify(biometricNoAutoPromptText)));

    expect(result).toEqual(biometricNoAutoPromptText);
  });
});

describe("fingerprint validated", () => {
  it("should deserialize fingerprint validated state", () => {
    const sut = FINGERPRINT_VALIDATED;
    const value = true;

    const result = sut.deserializer(JSON.parse(JSON.stringify(value)));

    expect(result).toEqual(value);
  });
});

describe("prompt cancelled", () => {
  it("should deserialize prompt cancelled state", () => {
    const sut = PROMPT_CANCELLED;
    const value = true;

    const result = sut.deserializer(JSON.parse(JSON.stringify(value)));

    expect(result).toEqual(value);
  });
});

describe("prompt automatically", () => {
  it("should deserialize prompt automatically state", () => {
    const sut = PROMPT_AUTOMATICALLY;
    const value = true;

    const result = sut.deserializer(JSON.parse(JSON.stringify(value)));

    expect(result).toEqual(value);
  });
});
