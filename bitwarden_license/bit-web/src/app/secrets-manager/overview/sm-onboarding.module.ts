import { NgModule } from "@angular/core";

import { ProgressModule, SectionComponent } from "@bitwarden/components";
import { SMOnboardingSectionComponent } from "@bitwarden/web-vault/app/shared/components/onboarding/sm-onboarding-section.component";
import { SMOnboardingTaskComponent } from "@bitwarden/web-vault/app/shared/components/onboarding/sm-onboarding-task.component";

import { OnboardingModule } from "../../../../../../apps/web/src/app/shared/components/onboarding/onboarding.module";
import { SecretsManagerSharedModule } from "../shared/sm-shared.module";

import { SMOnboardingRoutingModule } from "./onboarding-routing.module";
import { SMOnboardingComponent } from "./sm-onboarding.component";

@NgModule({
  imports: [
    SecretsManagerSharedModule,
    ProgressModule,
    SMOnboardingRoutingModule,
    OnboardingModule,
  ],
  exports: [
    SMOnboardingComponent,
    SectionComponent,
    SMOnboardingTaskComponent,
    SMOnboardingSectionComponent,
  ],
  declarations: [SMOnboardingComponent, SMOnboardingTaskComponent, SMOnboardingSectionComponent],
})
export class SMOnboardingModule {}
