import { CommonModule } from "@angular/common";
import { InjectionToken, NgModule, Provider } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { JslibServicesModule } from "@bitwarden/angular/services/jslib-services.module";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { StateProvider } from "@bitwarden/common/platform/state";
import { DefaultGeneratorService } from "@bitwarden/common/tools/generator";
import { GeneratorService, PolicyEvaluator } from "@bitwarden/common/tools/generator/abstractions";
import {
  PasswordGenerationServiceAbstraction,
  PasswordGeneratorPolicy,
  PasswordGenerationOptions,
  PasswordGeneratorStrategy,
} from "@bitwarden/common/tools/generator/password";
import {
  CheckboxModule,
  ColorPasswordModule,
  FormFieldModule,
  InputModule,
} from "@bitwarden/components";

// Simplified service types
export type PasswordGenerator = GeneratorService<
  PasswordGenerationOptions,
  PasswordGeneratorPolicy
>;

export type PasswordEvaluator = PolicyEvaluator<PasswordGeneratorPolicy, PasswordGenerationOptions>;

// dependency injection tokens for templated services
export const PASSWORD_GENERATOR = new InjectionToken<PasswordGenerator>("PasswordGenerator");

// dependency providers
export const PasswordGeneratorProvider: Provider = {
  provide: PASSWORD_GENERATOR,
  useFactory: (
    policy: PolicyService,
    state: StateProvider,
    legacyGenerator: PasswordGenerationServiceAbstraction,
  ) => {
    const instance = new DefaultGeneratorService(
      new PasswordGeneratorStrategy(legacyGenerator, state),
      policy,
    );

    return instance;
  },
  deps: [PolicyService, StateProvider, PasswordGenerationServiceAbstraction],
};

/** Shared module containing generator component dependencies */
@NgModule({
  exports: [
    JslibModule,
    JslibServicesModule,
    FormFieldModule,
    CommonModule,
    ReactiveFormsModule,
    ColorPasswordModule,
    InputModule,
    CheckboxModule,
  ],
  providers: [PasswordGeneratorProvider],
  declarations: [],
})
export class DependenciesModule {
  constructor() {}
}
