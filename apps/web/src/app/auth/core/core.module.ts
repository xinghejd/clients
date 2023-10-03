import { NgModule, Optional, SkipSelf } from "@angular/core";

import { EmergencyAccessApiService } from "./services/emergency-access/emergency-access-api.service";
import { EmergencyAccessService } from "./services/emergency-access/emergency-access.service";
import { WebauthnLoginApiService } from "./services/webauthn-login/webauthn-login-api.service";
import { WebauthnLoginService } from "./services/webauthn-login/webauthn-login.service";

@NgModule({
  providers: [
    WebauthnLoginService,
    WebauthnLoginApiService,
    EmergencyAccessService,
    EmergencyAccessApiService,
  ],
})
export class CoreAuthModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreAuthModule) {
    if (parentModule) {
      throw new Error("CoreAuthModule is already loaded. Import it in AuthModule only");
    }
  }
}
