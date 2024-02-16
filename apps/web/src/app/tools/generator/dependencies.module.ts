import { CommonModule } from "@angular/common";
import { InjectionToken, NgModule, Provider } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { JslibServicesModule } from "@bitwarden/angular/services/jslib-services.module";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ActiveUserStateProvider } from "@bitwarden/common/platform/state";
import { DefaultGeneratorService } from "@bitwarden/common/tools/generator";
import { GeneratorService } from "@bitwarden/common/tools/generator/abstractions";
import {
  PasswordGenerationServiceAbstraction,
  PasswordGeneratorPolicy,
  PasswordGenerationOptions,
  PasswordGeneratorStrategy,
} from "@bitwarden/common/tools/generator/password";
import { ColorPasswordModule, FormFieldModule } from "@bitwarden/components";

// Simplified service types
export type PasswordGenerator = GeneratorService<
  PasswordGenerationOptions,
  PasswordGeneratorPolicy
>;

// dependency injection tokens for templated services
export const PASSWORD_GENERATOR = new InjectionToken<PasswordGenerator>("PasswordGenerator");

// dependency providers
export const PasswordGeneratorProvider: Provider = {
  provide: PASSWORD_GENERATOR,
  useFactory: (
    policy: PolicyService,
    state: ActiveUserStateProvider,
    legacyGenerator: PasswordGenerationServiceAbstraction,
  ) => {
    const instance = new DefaultGeneratorService(
      new PasswordGeneratorStrategy(legacyGenerator),
      policy,
      state,
    );

    return instance;
  },
  deps: [PolicyService, ActiveUserStateProvider, PasswordGenerationServiceAbstraction],
};

/** Shared module containing generator component dependencies */
@NgModule({
  imports: [JslibServicesModule],
  exports: [JslibModule, FormFieldModule, CommonModule, ReactiveFormsModule, ColorPasswordModule],
  providers: [PasswordGeneratorProvider],
  declarations: [],
})
export class DependenciesModule {
  constructor() {}
}
