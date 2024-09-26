import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

import { LoginEmailServiceAbstraction } from "@bitwarden/auth/common";

/**
 * Functionality for the extension login component.
 */
@Injectable({
  providedIn: "root",
})
export class ExtensionLoginService {
  constructor(
    private router: Router,
    private loginEmailService: LoginEmailServiceAbstraction,
  ) {}

  /**
   * Handles the successful login - clears the login email service values and navigates to the vault.
   */
  async handleSuccessfulLogin(): Promise<void> {
    this.loginEmailService.clearValues();
    await this.router.navigate(["/tabs/vault"]);
  }
}
