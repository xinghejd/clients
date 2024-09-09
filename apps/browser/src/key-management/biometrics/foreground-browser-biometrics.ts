import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";

import { BrowserApi } from "../../platform/browser/browser-api";

import { BrowserBiometricsService } from "./browser-biometrics.service";

export class ForegroundBrowserBiometricsService extends BrowserBiometricsService {
  async authenticateBiometric(): Promise<boolean> {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: boolean;
      error: string;
    }>("biometricUnlock");
    if (!response.result) {
      throw response.error;
    }
    return response.result;
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: BiometricsStatus;
      error: string;
    }>("biometricStatus");
    return response.result;
  }
}
