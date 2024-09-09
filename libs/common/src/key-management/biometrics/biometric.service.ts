import { UserId } from "@bitwarden/common/types/guid";

import { BiometricsStatus } from "./biometrics-status";

/**
 * The biometrics service is used to provide access to the status of and access to biometric functionality on the platforms.
 */
export abstract class BiometricsService {
  /**
   * Performs biometric authentication
   */
  abstract authenticateBiometric(): Promise<boolean>;

  /**
   * Start automatic biometric setup, which places the required configuration files / changes the required settings.
   */
  abstract biometricsSetup(): Promise<void>;

  /**
   * Gets the status of biometrics for the platform system states.
   */
  abstract getBiometricsStatus(): Promise<BiometricsStatus>;

  /**
   * Gets the status of biometrics for a current user. This includes system states (hardware unavailable) but also user specific states (needs unlock with master-password).
   */
  abstract getBiometricsStatusForUser(id: UserId): Promise<BiometricsStatus>;
}
