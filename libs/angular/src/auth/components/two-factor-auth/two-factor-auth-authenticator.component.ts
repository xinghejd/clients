import { Component, EventEmitter, Output } from "@angular/core";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-authenticator",
  templateUrl: "two-factor-auth-authenticator.component.html",
})
export class TwoFactorAuthAuthenticatorComponent extends TwoFactorAuthBaseComponent {
  tokenValue: string;
  @Output() token = new EventEmitter<string>();

  async ngOnInit(): Promise<void> {
    this.activeButtonTextChange.emit(this.i18nService.t("continue"));
  }
}
