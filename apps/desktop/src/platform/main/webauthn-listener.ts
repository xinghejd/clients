import { ipcMain } from "electron";

import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { passkeyclients } from "@bitwarden/desktop-native";

export class WebauthnListener {
  constructor(private logService: ConsoleLogService) {}

  init() {
    ipcMain.handle("webauthn.authenticate", async (event: any, message: any) => {
      try {
        this.logService.info("Webauthn authenticate ipc handler", message);
        return await passkeyclients.authenticate(message.challenge, message.origin, message.pin);
      } catch (e) {
        this.logService.error("Webauthn authenticate ipc handler error", e);
        if ("Pin required" === e.message) {
          return "pin-required";
        }
      }
    });
  }
}
