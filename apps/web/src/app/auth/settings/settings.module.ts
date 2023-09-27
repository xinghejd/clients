import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { WebauthnLoginSettingsModule } from "./webauthn-login-settings";

@NgModule({
  imports: [SharedModule, WebauthnLoginSettingsModule],
  declarations: [],
  providers: [],
  exports: [WebauthnLoginSettingsModule],
})
export class SettingsModule {}
