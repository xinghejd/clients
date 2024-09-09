import { Injectable } from "@angular/core";

import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";

import { NativeMessagingBackground } from "../../background/nativeMessaging.background";

import { BrowserBiometricsService } from "./browser-biometrics.service";

@Injectable()
export class BackgroundBrowserBiometricsService extends BrowserBiometricsService {
  constructor(private nativeMessagingBackground: () => NativeMessagingBackground) {
    super();
  }

  async authenticateBiometric(): Promise<boolean> {
    const responsePromise = this.nativeMessagingBackground().getResponse();
    await this.nativeMessagingBackground().send({ command: "biometricUnlock" });
    const response = await responsePromise;
    return response.response === "unlocked";
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    const responsePromise = this.nativeMessagingBackground().getResponse();
    await this.nativeMessagingBackground().send({ command: "biometricStatus" });
    const response = await responsePromise;
    return response.response;
  }
}
