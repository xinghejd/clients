export enum NativeMessageCommandType {
  WRONG_USER = "wrongUserId",
  VERIFY_FINGERPRINT = "verifyFingerprint",
  SETUP_ENCRYPTION = "setupEncryption",
  INVALIDATE_ENCRYPTION = "invalidateEncryption",
  BIOMETRIC_UNLOCK = "biometricUnlock",
  BROWSER_PROVIDED_USER_KEY = "browserProvidedUserKey",
}

export enum BiometricUnlockResponse {
  NO_USER = "no user",
  NO_USER_ID = "no userId",
  NOT_SUPPORTED = "not supported",
  NO_CLIENT_KEY_HALF = "no client key half",
  NOT_ENABLED = "not enabled",
  CANCELED = "canceled",
  UNLOCKED = "unlocked",
}

export class LegacyUnencryptedCommandMessage {
  constructor(
    public command: NativeMessageCommandType,
    public appId: string,
  ) {}
}

export class LegacySetupEncryptionResponse extends LegacyUnencryptedCommandMessage {
  constructor(
    appId: string,
    public sharedSecret: string,
  ) {
    super(NativeMessageCommandType.SETUP_ENCRYPTION, appId);
  }
}

export class LegacyInnerCommandMessage {
  command: NativeMessageCommandType;

  userId?: string;
  timestamp?: number;

  constructor(command: NativeMessageCommandType) {
    this.command = command;
  }
}

export class BrowserCommandLegacyMessage extends LegacyInnerCommandMessage {
  constructor(
    command: NativeMessageCommandType,
    public appId: string,
  ) {
    super(command);
  }
}

export class BiometricUnlockCommand extends LegacyInnerCommandMessage {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK);
  }
}

export class BiometricProvideUserKeyCommand extends LegacyInnerCommandMessage {
  constructor(public userKeyB64: string) {
    super(NativeMessageCommandType.BROWSER_PROVIDED_USER_KEY);
  }
}

export class BiometricNativeCommandResponse extends LegacyInnerCommandMessage {
  constructor(
    public command: NativeMessageCommandType,
    public response: BiometricUnlockResponse,
  ) {
    super(command);
  }
}

export class BiometricCommandWrongUser extends LegacyUnencryptedCommandMessage {
  constructor(appId: string) {
    super(NativeMessageCommandType.WRONG_USER, appId);
  }
}

export class BiometricCommandVerifyFingerprint extends LegacyUnencryptedCommandMessage {
  constructor(appId: string) {
    super(NativeMessageCommandType.VERIFY_FINGERPRINT, appId);
  }
}

export class BiometricCommandSetupEncryption extends LegacyInnerCommandMessage {
  constructor(
    public publicKey: string,
    public userId: string,
  ) {
    super(NativeMessageCommandType.SETUP_ENCRYPTION);
  }
}

export class BiometricCommandInvalidateEncryption extends LegacyUnencryptedCommandMessage {
  constructor(appId: string) {
    super(NativeMessageCommandType.INVALIDATE_ENCRYPTION, appId);
  }
}

export class BiometricCommandProvideUserKey extends LegacyInnerCommandMessage {
  constructor(public userKeyB64: string) {
    super(NativeMessageCommandType.BROWSER_PROVIDED_USER_KEY);
  }
}

export class BiometricUnlockNotSupportedResponse extends BiometricNativeCommandResponse {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.NOT_SUPPORTED);
  }
}

export class BiometricUnlockCanceledResponse extends BiometricNativeCommandResponse {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.CANCELED);
  }
}

export class BiometricUnlockUnlockedResponse extends BiometricNativeCommandResponse {
  constructor(public userKeyB64: string) {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.UNLOCKED);
  }
}

export class BiometricUnlockNoUserResponse extends BiometricNativeCommandResponse {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.NO_USER);
  }
}

export class BiometricUnlockNoUserIdResponse extends BiometricNativeCommandResponse {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.NO_USER_ID);
  }
}

export class BiometricUnlockNoClientKeyHalfResponse extends BiometricNativeCommandResponse {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.NO_CLIENT_KEY_HALF);
  }
}

export class BiometricUnlockNotEnabledResponse extends BiometricNativeCommandResponse {
  constructor() {
    super(NativeMessageCommandType.BIOMETRIC_UNLOCK, BiometricUnlockResponse.NOT_ENABLED);
  }
}
