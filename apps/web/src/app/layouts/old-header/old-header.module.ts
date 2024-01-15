import { NgModule } from "@angular/core";

import { DynamicAvatarComponent } from "../../components/dynamic-avatar.component";
import { SharedModule } from "../../shared";
import { ProductSwitcherModule } from "../product-switcher/product-switcher.module";

import { OldWebHeaderComponent } from "./old-web-header.component";

@NgModule({
  imports: [SharedModule, DynamicAvatarComponent, ProductSwitcherModule],
  declarations: [OldWebHeaderComponent],
  exports: [OldWebHeaderComponent],
})
export class OldHeaderModule {}
