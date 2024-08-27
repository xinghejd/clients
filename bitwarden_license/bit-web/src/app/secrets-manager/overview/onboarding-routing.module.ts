import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { SMOnboardingComponent } from "./sm-onboarding.component";

const routes: Routes = [
  {
    path: "",
    component: SMOnboardingComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SMOnboardingRoutingModule {}
