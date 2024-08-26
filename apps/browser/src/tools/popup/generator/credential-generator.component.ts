import { Component } from "@angular/core";

import { PassphraseSettingsComponent, PasswordComponent } from "@bitwarden/generator-components";

@Component({
  standalone: true,
  selector: "credential-generator",
  templateUrl: "credential-generator.component.html",
  imports: [PassphraseSettingsComponent, PasswordComponent],
})
export class CredentialGeneratorComponent {}
