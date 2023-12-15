import { NgModule } from "@angular/core";

import { OrgSwitcherComponent } from "@bitwarden/admin-console";
import { LayoutComponent as BitLayoutComponent, NavigationModule } from "@bitwarden/components";
import { SharedModule } from "@bitwarden/web-vault/app/shared/shared.module";

import { LayoutComponent } from "./layout.component";
import { NavigationComponent } from "./navigation.component";

@NgModule({
  imports: [SharedModule, NavigationModule, BitLayoutComponent, OrgSwitcherComponent],
  declarations: [LayoutComponent, NavigationComponent],
})
export class LayoutModule {}
