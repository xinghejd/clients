import { Component, EventEmitter, Output } from "@angular/core";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-duo",
  templateUrl: "two-factor-auth-duo.component.html",
})
export class TwoFactorAuthDuoComponent extends TwoFactorAuthBaseComponent {
  @Output() token = new EventEmitter<string>();

  constructor() {
    super();
  }

  async ngOnInit(): Promise<void> {}

  ngOnDestroy(): void {}
}
