import { Component, EventEmitter, OnDestroy, Output } from "@angular/core";

@Component({
  selector: "app-two-factor-auth-authenticator",
  templateUrl: "two-factor-auth-authenticator.component.html",
})
export class TwoFactorAuthAuthenticatorComponent implements OnDestroy {
  @Output() token = new EventEmitter<string>();
  tokenValue: string = "";

  ngOnDestroy(): void {}
}
