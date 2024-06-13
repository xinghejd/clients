import { Component, EventEmitter, Output } from "@angular/core";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-yubikey",
  templateUrl: "two-factor-auth-yubikey.component.html",
})
export class TwoFactorAuthYubikeyComponent extends TwoFactorAuthBaseComponent {
  @Output() token = new EventEmitter<string>();

  constructor() {
    super();
  }

  async ngOnInit(): Promise<void> {}

  ngOnDestroy(): void {}
}
