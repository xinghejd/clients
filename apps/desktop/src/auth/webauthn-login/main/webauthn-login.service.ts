import { Injectable } from "@angular/core";

import { webauthns } from "@bitwarden/desktop-native";

import { WebauthnLoginServiceAbstraction } from "./webauthn-login.service.abstraction";

@Injectable({ providedIn: "root" })
export class WebauthnLoginService implements WebauthnLoginServiceAbstraction {
  webauthnCreate(): string {
    return webauthns.webauthnCreate();
  }
}
