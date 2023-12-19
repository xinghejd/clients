import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { OldHeaderComponent } from "./old-header.component";

@NgModule({
  imports: [SharedModule],
  declarations: [OldHeaderComponent],
  exports: [OldHeaderComponent],
})
export class OldHeaderModule {}
