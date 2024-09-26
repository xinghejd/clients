import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

import { LoginComponentService } from "./login-component.service";

/**
 * Functionality for the web login component.
 */
@Injectable({
  providedIn: "root",
})
export class WebLoginService {
  constructor(
    private router: Router,
    private loginComponentService: LoginComponentService,
  ) {}

  async handleQueryParams(qParams: any): Promise<void> {
    if (qParams.org != null) {
      const route = this.router.createUrlTree(["create-organization"], {
        queryParams: { plan: qParams.org },
      });
      this.loginComponentService.setPreviousUrl(route);
    }

    /**
     * If there is a parameter called 'sponsorshipToken', they are coming
     * from an email for sponsoring a families organization. Therefore set
     * the previousUrl to /setup/families-for-enterprise?token=<paramValue>
     */
    if (qParams.sponsorshipToken != null) {
      const route = this.router.createUrlTree(["setup/families-for-enterprise"], {
        queryParams: { token: qParams.sponsorshipToken },
      });
      this.loginComponentService.setPreviousUrl(route);
    }
  }
}
