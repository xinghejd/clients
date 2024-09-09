import { ipcMain } from "electron";

import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { UserId } from "@bitwarden/common/types/guid";

import { BiometricMessage, BiometricAction } from "../../types/biometric-message";

import { DesktopBiometricsService } from "./desktop.biometrics.service";

export class BiometricsRendererIPCListener {
  constructor(
    private serviceName: string,
    private biometricService: DesktopBiometricsService,
    private logService: ConsoleLogService,
  ) {}

  init() {
    ipcMain.handle("biometric", async (event: any, message: BiometricMessage) => {
      try {
        let serviceName = this.serviceName;
        message.keySuffix = "_" + (message.keySuffix ?? "");
        if (message.keySuffix !== "_") {
          serviceName += message.keySuffix;
        }

        let val: string | boolean | BiometricsStatus = null;

        if (!message.action) {
          return val;
        }

        switch (message.action) {
          case BiometricAction.EnabledForUser:
            if (!message.key || !message.userId) {
              break;
            }
            val = await this.biometricService.canAuthBiometric({
              service: serviceName,
              key: message.key,
              userId: message.userId,
            });
            break;
          case BiometricAction.GetStatus:
            val = await this.biometricService.getBiometricsStatus();
            break;
          case BiometricAction.GetStatusForUser:
            val = await this.biometricService.getBiometricsStatusForUser(message.userId as UserId);
            break;
          case BiometricAction.Setup:
            await this.biometricService.biometricsSetup();
            break;
          default:
        }

        return val;
      } catch (e) {
        this.logService.info(e);
      }
    });
  }
}
