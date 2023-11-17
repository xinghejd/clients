import { ipcMain } from "electron";

import { webauthns } from "@bitwarden/desktop-native";

import { NativeWebauthnMainAbstraction } from "./native-webauthn.main.abstraction";

export class NativeWebauthnMain implements NativeWebauthnMainAbstraction {
  init() {
    ipcMain.handle("webauthn.create", async (_event: any, _message: any) => {
      return await this.webauthnCreate();
    });
  }

  webauthnCreate(): string {
    // return "Hello from the main process!";
    return webauthns.webauthnCreate();
  }
}
