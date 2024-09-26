export interface OsBiometricService {
  authenticateBiometric(): Promise<boolean>;
  isBiometricsAvailable(): Promise<boolean>;

  unlockWithBiometrics(
    userId: string,
    clientKeyHalfB64: string | undefined,
  ): Promise<string | null>;
  enableBiometricUnlock(
    userId: string,
    unlockKey: string,
    clientKeyHalfB64: string | undefined,
  ): Promise<boolean>;
  disableBiometricUnlock(userId: string): Promise<void>;
  provideUnlockKey(userId: string, unlockKey: string): Promise<void>;

  /** LINUX ONLY */
  /**
   * Check whether support for biometric unlock requires setup. This can be automatic or manual.
   *
   * @returns true if biometrics support requires setup, false if it does not (is already setup, or did not require it in the first place)
   */
  osBiometricsNeedsSetup: () => Promise<boolean>;
  /**
   * Check whether biometrics can be automatically setup, or requires user interaction.
   *
   * @returns true if biometrics support can be automatically setup, false if it requires user interaction.
   */
  osBiometricsCanAutoSetup: () => Promise<boolean>;
  /**
   * Starts automatic biometric setup, which places the required configuration files / changes the required settings.
   */
  osBiometricsSetup: () => Promise<void>;
}
