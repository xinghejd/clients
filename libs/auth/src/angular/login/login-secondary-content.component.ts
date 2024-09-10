import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";

@Component({
  standalone: true,
  imports: [JslibModule, RouterModule],
  template: `
    <div class="tw-text-center">
      {{ "newToBitwarden" | i18n }}
      <a class="tw-font-bold" bitLink routerLink="/register">{{ "createAccount" | i18n }}</a>
    </div>
  `,
})
export class LoginSecondaryContentComponent {}
