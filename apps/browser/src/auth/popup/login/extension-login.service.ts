import { inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { DefaultLoginService, LoginService } from "@bitwarden/auth/angular";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/generator-legacy";

import { flagEnabled } from "../../../platform/flags"; // TODO-rr-bw: do I need a client specific `flagEnabled()` fn?

export class ExtensionLoginService extends DefaultLoginService implements LoginService {
  ssoLoginService = inject(SsoLoginServiceAbstraction);
  // TODO-rr-bw: refactor to not use deprecated service
  passwordGenerationService = inject(PasswordGenerationServiceAbstraction);
  cryptoFunctionService = inject(CryptoFunctionService);
  environmentService = inject(EnvironmentService);
  platformUtilsService = inject(PlatformUtilsService);

  getShowPasswordlessFlag(): boolean {
    return flagEnabled("showPasswordless");
  }

  async launchSsoBrowserWindow(email: string): Promise<void | null> {
    // Save email for SSO
    await this.ssoLoginService.setSsoEmail(email);

    // Generate SSO params
    const passwordOptions: any = {
      type: "password",
      length: 64,
      uppercase: true,
      lowercase: true,
      numbers: true,
      special: false,
    };
    const state =
      (await this.passwordGenerationService.generatePassword(passwordOptions)) +
      ":clientId=browser";
    const codeVerifier = await this.passwordGenerationService.generatePassword(passwordOptions);
    const codeVerifierHash = await this.cryptoFunctionService.hash(codeVerifier, "sha256");
    const codeChallenge = Utils.fromBufferToUrlB64(codeVerifierHash);

    // Save SSO params
    await this.ssoLoginService.setCodeVerifier(codeVerifier);
    await this.ssoLoginService.setSsoState(state);

    // Build URL
    const env = await firstValueFrom(this.environmentService.environment$);
    let url = env.getWebVaultUrl();
    if (url == null) {
      url = "https://vault.bitwarden.com";
    }

    const redirectUri = url + "/sso-connector.html";

    // Launch browser window with URL
    this.platformUtilsService.launchUri(
      url +
        "/#/sso?clientId=browser" +
        "&redirectUri=" +
        encodeURIComponent(redirectUri) +
        "&state=" +
        state +
        "&codeChallenge=" +
        codeChallenge +
        "&email=" +
        encodeURIComponent(email),
    );
  }
}
