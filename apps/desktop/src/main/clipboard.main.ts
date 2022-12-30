import { ipcMain } from "electron";

import { clipboard } from "@bitwarden/desktop-napi";

export class ClipboardMain {
  init() {
    ipcMain.handle("clipboard.read", async (event: any, message: any) => {
      return clipboard.read();
    });

    ipcMain.handle("clipboard.write", async (event: any, message: any) => {
      return clipboard.write(message.text, message.password ?? false);
    });
  }
}
