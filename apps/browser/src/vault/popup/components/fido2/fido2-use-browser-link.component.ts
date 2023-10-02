import { Component } from "@angular/core";

import { BrowserFido2UserInterfaceSession } from "../../../fido2/browser-fido2-user-interface.service";
import { Fido2StateServiceAbstraction } from "../../services/abstractions/fido2-state.service";

@Component({
  selector: "app-fido2-use-browser-link",
  templateUrl: "fido2-use-browser-link.component.html",
})
export class Fido2UseBrowserLinkComponent {
  isPasskeys$ = this.fido2StateService.isPasskeys$;

  constructor(private fido2StateService: Fido2StateServiceAbstraction) {}

  abort(fallback = false) {
    BrowserFido2UserInterfaceSession.sendMessage({
      sessionId: this.fido2StateService.sessionId,
      type: "AbortResponse",
      fallbackRequested: fallback,
    });

    return;
  }
}
