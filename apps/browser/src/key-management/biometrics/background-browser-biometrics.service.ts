import { Injectable } from "@angular/core";

import { BiometricsService } from "@bitwarden/common/key-management/biometrics/biometric.service";
import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
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
        command: "authenticateWithBiometrics",
      });
      return response == "unlocked";
    } catch (e) {
      return false;
    }
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    try {
      const response = await this.nativeMessagingBackground().callCommand({
        command: "getBiometricsStatus",
      });
      return response.response;
    } catch (e) {
      return BiometricsStatus.DesktopDisconnected;
    }
  }

  async unlockWithBiometricsForUser(userId: UserId): Promise<UserKey> {
    try {
      return (
        await this.nativeMessagingBackground().callCommand({
          command: "unlockWithBiometricsForUser",
          userId: userId,
        })
      ).response;
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
