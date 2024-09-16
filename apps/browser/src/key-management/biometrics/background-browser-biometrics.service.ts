import { Injectable } from "@angular/core";

import { BiometricsService } from "@bitwarden/common/key-management/biometrics/biometric.service";
import { BiometricsCommands } from "@bitwarden/common/key-management/biometrics/biometrics-commands";
import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { UserId } from "@bitwarden/common/types/guid";
import { UserKey } from "@bitwarden/common/types/key";

import { NativeMessagingBackground } from "../../background/nativeMessaging.background";

@Injectable()
export class BackgroundBrowserBiometricsService extends BiometricsService {
  constructor(private nativeMessagingBackground: () => NativeMessagingBackground) {
    super();
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const response = await this.nativeMessagingBackground().callCommand({
        command: BiometricsCommands.AuthenticateWithBiometrics,
      });
      return response;
    } catch (e) {
      return false;
    }
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    try {
      const response = await this.nativeMessagingBackground().callCommand({
        command: BiometricsCommands.GetBiometricsStatus,
      });
      return response.response;
    } catch (e) {
      return BiometricsStatus.DesktopDisconnected;
    }
  }

  async unlockWithBiometricsForUser(userId: UserId): Promise<UserKey> {
    try {
      const response = await this.nativeMessagingBackground().callCommand({
        command: BiometricsCommands.UnlockWithBiometricsForUser,
        userId: userId,
      });
      if (response.response) {
        return SymmetricCryptoKey.fromString(response.userKeyB64) as UserKey;
      } else {
        throw new Error("Biometric unlock failed");
      }
    } catch (e) {
      throw new Error("Biometric unlock failed");
    }
  }

  async getBiometricsStatusForUser(id: UserId): Promise<BiometricsStatus> {
    try {
      return (
        await this.nativeMessagingBackground().callCommand({
          command: "getBiometricsStatusForUser",
          userId: id,
        })
      ).response;
    } catch (e) {
      return BiometricsStatus.DesktopDisconnected;
    }
  }
}
