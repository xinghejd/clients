import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { ChangePasswordComponent } from "./change-password.component";
import { WebauthnLoginSettingsModule } from "./webauthn-login-settings";

@NgModule({
  imports: [SharedModule, WebauthnLoginSettingsModule],
  declarations: [ChangePasswordComponent],
  providers: [],
  exports: [WebauthnLoginSettingsModule, ChangePasswordComponent],
})
export class SettingsModule {}
