import { EncryptedString } from "@bitwarden/common/platform/models/domain/enc-string";
import { DESKTOP_BIOMETRIC_SETTINGS_DISK, KeyDefinition } from "@bitwarden/common/platform/state";

export const BIOMETRIC_UNLOCK_ENABLED = new KeyDefinition<boolean>(
  DESKTOP_BIOMETRIC_SETTINGS_DISK,
  "biometricUnlockEnabled",
  {
    deserializer: (obj) => obj,
  },
);

export const DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT = new KeyDefinition<boolean>(
  DESKTOP_BIOMETRIC_SETTINGS_DISK,
  "dismissedBiometricRequirePasswordOnStartCallout",
  {
    deserializer: (obj) => obj,
  },
);

export const ENCRYPTED_CLIENT_KEY_HALF = new KeyDefinition<EncryptedString>(
  DESKTOP_BIOMETRIC_SETTINGS_DISK,
  "clientKeyHalf",
  {
    deserializer: (obj) => obj,
  },
);

export const BIOMETRIC_TEXT = new KeyDefinition<string>(
  DESKTOP_BIOMETRIC_SETTINGS_DISK,
  "biometricText",
  {
    deserializer: (obj) => obj,
  },
);

export const BIOMETRIC_NO_AUTO_PROMPT_TEXT = new KeyDefinition<string>(
  DESKTOP_BIOMETRIC_SETTINGS_DISK,
  "biometricNoAutoPromptText",
  {
    deserializer: (obj) => obj,
  },
);
