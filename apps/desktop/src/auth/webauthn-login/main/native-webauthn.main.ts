import { ipcMain } from "electron";

import { webauthns } from "@bitwarden/desktop-native";

import { WindowMain } from "../../../main/window.main";

import { NativeWebauthnMainAbstraction } from "./native-webauthn.main.abstraction";

export class NativeWebauthnMain implements NativeWebauthnMainAbstraction {
  constructor(private windowMain: WindowMain) {}

  init() {
    ipcMain.handle("webauthn.create", async (_event: any, _message: any) => {
      return await this.webauthnCreate();
    });
  }

  async webauthnCreate(): Promise<string> {
    // return "Hello from the main process!";
    try {
      console.log(this.windowMain.win.getNativeWindowHandle());
      return await webauthns.webauthnCreate(this.windowMain.win.getNativeWindowHandle());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return "Error: " + error;
    }
  }
}
