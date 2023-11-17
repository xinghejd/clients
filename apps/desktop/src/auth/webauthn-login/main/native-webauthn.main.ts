import { webauthns } from "@bitwarden/desktop-native";

import { NativeWebauthnMainAbstraction } from "./native-webauthn.main.abstraction";

export class NativeWebauthnMain implements NativeWebauthnMainAbstraction {
  webauthnCreate(): string {
    return webauthns.webauthnCreate();
  }
}
