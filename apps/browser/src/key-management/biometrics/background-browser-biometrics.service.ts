import { Injectable } from "@angular/core";

import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
import { UserId } from "@bitwarden/common/types/guid";

import { NativeMessagingBackground } from "../../background/nativeMessaging.background";

import { BrowserBiometricsService } from "./browser-biometrics.service";

@Injectable()
export class BackgroundBrowserBiometricsService extends BrowserBiometricsService {
  constructor(private nativeMessagingBackground: () => NativeMessagingBackground) {
    super();
  }

  async authenticateBiometric(): Promise<boolean> {
    try {
      const response = await this.nativeMessagingBackground().callCommand({
        command: "biometricUnlock",
      });
      return response == "unlocked";
    } catch (e) {
      return false;
    }
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    try {
      const response = await this.nativeMessagingBackground().callCommand({
        command: "biometricStatus",
      });
      return response.response;
    } catch (e) {
      return BiometricsStatus.DesktopDisconnected;
    }
  }

  async getBiometricsStatusForUser(id: UserId): Promise<BiometricsStatus> {
    try {
      const resp = await this.nativeMessagingBackground().callCommand({
        command: "biometricStatusForUser",
        userId: id,
      });
      return resp.response;
    } catch (e) {
      return BiometricsStatus.DesktopDisconnected;
    }
  }
}
