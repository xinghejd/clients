import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { BrowserFido2UserInterfaceSession } from "../../../fido2/browser-fido2-user-interface.service";

@Component({
  selector: "app-fido2-browser-fallback",
  templateUrl: "fido2-browser-fallback.component.html",
})
export class Fido2BrowserFallbackComponent {
  // Identifies the specific passkey session
  private sessionId: string;

  get isPasskeysPopout(): boolean {
    return this.sessionId != null;
  }

  constructor(private route: ActivatedRoute) {
    this.sessionId = this.route.snapshot.queryParams.sessionId;
  }

  abort() {
    BrowserFido2UserInterfaceSession.sendMessage({
      sessionId: this.sessionId,
      type: "AbortResponse",
      fallbackRequested: true,
    });
  }
}
