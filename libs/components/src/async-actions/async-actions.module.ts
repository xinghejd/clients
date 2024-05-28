import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { BitActionDirective } from "./bit-action.directive";
import { BitSubmitDirective } from "./bit-submit.directive";
import { BitContextProviderDirective } from "./context-provider.directive";
import { BitFormButtonDirective } from "./form-button.directive";

@NgModule({
  imports: [SharedModule],
  declarations: [
    BitActionDirective,
    BitFormButtonDirective,
    BitSubmitDirective,
    BitContextProviderDirective,
  ],
  exports: [BitActionDirective, BitFormButtonDirective, BitSubmitDirective],
})
export class AsyncActionsModule {}
