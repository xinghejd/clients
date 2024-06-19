import { Component, EventEmitter, Output } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-yubikey",
  templateUrl: "two-factor-auth-yubikey.component.html",
})
export class TwoFactorAuthYubikeyComponent extends TwoFactorAuthBaseComponent {
  tokenValue: string = "";
  @Output() token = new EventEmitter<string>();

  constructor(i18nService: I18nService) {
    super(i18nService);
  }

  async ngOnInit(): Promise<void> {
    this.activeButtonTextChange.emit(this.i18nService.t("continue"));
  }
}
