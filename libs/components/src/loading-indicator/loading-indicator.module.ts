import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { SharedModule } from "../shared";

import { LoadingIndicatorComponent } from "./loading-indicator.component";

@NgModule({
  imports: [CommonModule, FormsModule, SharedModule],
  exports: [LoadingIndicatorComponent],
  declarations: [LoadingIndicatorComponent],
})
export class LoadingIndicatorModule {}
