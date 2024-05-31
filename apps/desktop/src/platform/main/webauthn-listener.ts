import { ipcMain } from "electron";

import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { passkeyclients } from "@bitwarden/desktop-native";

export class WebauthnListener {
  constructor(private logService: ConsoleLogService) {}

  init() {
    ipcMain.handle("webauthn.authenticate", async (event: any, message: any) => {
      try {
        this.logService.info("Webauthn authenticate ipc handler", message);
        return await passkeyclients.authenticate(message.challenge, message.origin);
      } catch (e) {
        if (
          e.message === "Password not found." ||
          e.message === "The specified item could not be found in the keychain."
        ) {
          return null;
        }
        this.logService.info(e);
      }
    });
  }
}
