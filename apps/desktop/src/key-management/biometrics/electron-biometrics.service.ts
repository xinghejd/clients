import { Injectable } from "@angular/core";

import { BiometricsService } from "@bitwarden/common/key-management/biometrics/biometric.service";
import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
import { UserId } from "@bitwarden/common/types/guid";

/**
 * This service implement the base biometrics service to provide desktop specific functions,
 * specifically for the renderer process by passing messages to the main process.
 */
@Injectable()
export class ElectronBiometricsService extends BiometricsService {
  async getBiometricsStatus(): Promise<BiometricsStatus> {
    return await ipc.keyManagement.biometric.status();
  }

  async getBiometricsStatusForUser(id: UserId): Promise<BiometricsStatus> {
    return await ipc.keyManagement.biometric.statusForUser(id);
  }

  /** This method is used to authenticate the user presence _only_.
   * It should not be used in the process to retrieve
   * biometric keys, which has a separate authentication mechanism.
   * For biometric keys, invoke "keytar" with a biometric key suffix */
  async authenticateBiometric(): Promise<boolean> {
    return await ipc.keyManagement.biometric.authenticate();
  }

  async biometricsSetup(): Promise<void> {
    return await ipc.keyManagement.biometric.biometricsSetup();
  }
}
