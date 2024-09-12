import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { RegisterRouteService } from "@bitwarden/auth/common";

@Component({
  standalone: true,
  imports: [CommonModule, JslibModule, RouterModule],
  template: `
    <div class="tw-text-center">
      {{ "newToBitwarden" | i18n }}
      <a class="tw-font-bold" bitLink [routerLink]="registerRoute$ | async">{{
        "createAccount" | i18n
      }}</a>
    </div>
  `,
})
export class LoginSecondaryContentComponent {
  registerRouteService = inject(RegisterRouteService);

  // TODO: remove when email verification flag is removed
  protected registerRoute$ = this.registerRouteService.registerRoute$();

  // TODO-rr-bw: In the original login implementation, the "Create account" link
  // also passes the email address to the registration page. We need to find a way to
  // do this now that the "Create account" link is in a separate component as
  // secondary content.
}
