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
    // const responsePromise = await this.nativeMessagingBackground().getResponse();
    const response = await this.nativeMessagingBackground().callCommand({
      command: "biometricUnlock",
    });
    console.log("responsepromise", response);
    return true;
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    const response = await this.nativeMessagingBackground().callCommand({
      command: "biometricStatus",
    });
    return response.response;
  }

  async getBiometricsStatusForUser(id: UserId): Promise<BiometricsStatus> {
    const resp = await this.nativeMessagingBackground().callCommand({
      command: "biometricStatusForUser",
      userId: id,
    });
    return resp.response;
  }
}
