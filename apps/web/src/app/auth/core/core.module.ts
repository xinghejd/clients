import { NgModule, Optional, SkipSelf } from "@angular/core";

import { WebauthnApiService } from "./services/webauthn/webauthn-api.service";
import { WebauthnService } from "./services/webauthn/webauthn.service";

@NgModule({
  providers: [WebauthnService, WebauthnApiService],
})
export class CoreAuthModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreAuthModule) {
    if (parentModule) {
      throw new Error("CoreAuthModule is already loaded. Import it in AuthModule only");
    }
  }
}
