import { Component, EventEmitter, Output } from "@angular/core";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-webauthn",
  templateUrl: "two-factor-auth-webauthn.component.html",
})
export class TwoFactorAuthWebAuthnComponent extends TwoFactorAuthBaseComponent {
  @Output() token = new EventEmitter<string>();

  constructor() {
    super();
  }

  async ngOnInit(): Promise<void> {}

  ngOnDestroy(): void {}
}
