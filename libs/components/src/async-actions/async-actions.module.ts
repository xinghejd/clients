import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { BitAsyncContextDirective } from "./async-context.directive";
import { BitActionDirective } from "./bit-action.directive";
import { BitSubmitDirective } from "./bit-submit.directive";
import { BitFormButtonDirective } from "./form-button.directive";

@NgModule({
  imports: [SharedModule],
  declarations: [
    BitActionDirective,
    BitFormButtonDirective,
    BitSubmitDirective,
    BitAsyncContextDirective,
  ],
  exports: [BitActionDirective, BitFormButtonDirective, BitSubmitDirective],
})
export class AsyncActionsModule {}
