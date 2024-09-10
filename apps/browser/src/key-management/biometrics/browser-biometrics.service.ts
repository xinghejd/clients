import { Injectable } from "@angular/core";

import { BiometricsService } from "@bitwarden/common/key-management/biometrics/biometric.service";

@Injectable()
export abstract class BrowserBiometricsService extends BiometricsService {
  async biometricsSetup(): Promise<void> {}
}
