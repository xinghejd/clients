import { ipcMain } from "electron";

import { webauthns } from "@bitwarden/desktop-native";

import { NativeWebauthnMainAbstraction } from "./native-webauthn.main.abstraction";

export class NativeWebauthnMain implements NativeWebauthnMainAbstraction {
  init() {
    ipcMain.handle("webauthn.create", async (_event: any, _message: any) => {
      return await this.webauthnCreate();
    });
  }

  async webauthnCreate(): Promise<string> {
    // return "Hello from the main process!";
    try {
      return await webauthns.webauthnCreate();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return "Error: " + error;
    }
  }
}
