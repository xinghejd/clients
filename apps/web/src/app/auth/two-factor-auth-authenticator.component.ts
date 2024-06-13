import { Component, EventEmitter, Output } from "@angular/core";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-authenticator",
  templateUrl: "two-factor-auth-authenticator.component.html",
})
export class TwoFactorAuthAuthenticatorComponent extends TwoFactorAuthBaseComponent {
  @Output() token = new EventEmitter<string>();
}
