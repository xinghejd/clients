import { NgModule } from "@angular/core";

import { AuthSettingsModule } from "./settings/settings.module";

import { CoreAuthModule } from "./core/core.module";

@NgModule({
  imports: [AuthSettingsModule, CoreAuthModule],
  declarations: [],
  providers: [],
  exports: [AuthSettingsModule, CoreAuthModule],
})
export class AuthModule {}
