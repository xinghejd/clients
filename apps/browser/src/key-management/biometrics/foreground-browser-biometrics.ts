import { BiometricsService } from "@bitwarden/common/key-management/biometrics/biometric.service";
import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
import { UserId } from "@bitwarden/common/types/guid";
import { UserKey } from "@bitwarden/common/types/key";

import { BrowserApi } from "../../platform/browser/browser-api";

export class ForegroundBrowserBiometricsService extends BiometricsService {
  async authenticateWithBiometrics(): Promise<boolean> {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: boolean;
      error: string;
    }>("authenticateWithBiometrics");
    if (!response.result) {
      throw response.error;
    }
    return response.result;
  }

  async getBiometricsStatus(): Promise<BiometricsStatus> {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: BiometricsStatus;
      error: string;
    }>("getBiometricsStatus");
    return response.result;
  }

  async unlockWithBiometricsForUser(userId: UserId): Promise<UserKey> {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: UserKey;
      error: string;
    }>("unlockWithBiometricsForUser", { userId });
    if (!response.result) {
      throw response.error;
    }
    return response.result;
  }

  async getBiometricsStatusForUser(id: UserId): Promise<BiometricsStatus> {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: BiometricsStatus;
      error: string;
    }>("getBiometricsStatusForUser", { userId: id });
    return response.result;
  }
}
