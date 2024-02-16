import { Component } from "@angular/core";

import { PasswordGeneratorComponent } from "./password.component";

@Component({
  standalone: true,
  selector: "credential-generator",
  templateUrl: "credential-generator.component.html",
  imports: [PasswordGeneratorComponent],
})
export class CredentialGeneratorComponent {}
