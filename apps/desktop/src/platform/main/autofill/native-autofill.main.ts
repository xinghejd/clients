import { ipcMain } from "electron";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { autofill } from "@bitwarden/desktop-napi";

// eslint-disable-next-line @typescript-eslint/ban-types
export type AutofillSyncMessage = {};

export class NativeAutofillMain {
  constructor(private logService: LogService) {}

  async init() {
    ipcMain.handle("autofill.sync", async (_event: any, _message: AutofillSyncMessage) => {
      void this.helloWorld("String from Electron");
    });
  }

  async helloWorld(value: string): Promise<void> {
    this.logService.info("[BW][Main] =====================================");
    this.logService.info("[BW][Main] Testing autofill native module");
    try {
      const result = await autofill.helloWorld(value);
      this.logService.info("[BW][Main] Result from helloWorld: ", result);
    } catch (e) {
      this.logService.error("[BW][Main] Error running helloWorld: ", e);
    }
    this.logService.info("[BW][Main] =====================================");
  }
}
