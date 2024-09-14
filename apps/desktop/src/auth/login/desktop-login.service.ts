import { inject } from "@angular/core";

import { DefaultLoginService, LoginService } from "@bitwarden/auth/angular";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/generator-legacy";

export class DesktopLoginService extends DefaultLoginService implements LoginService {
  ssoLoginService = inject(SsoLoginServiceAbstraction);
  passwordGenerationService = inject(PasswordGenerationServiceAbstraction);
  cryptoFunctionService = inject(CryptoFunctionService);
  environmentService = inject(EnvironmentService);
  platformUtilsService = inject(PlatformUtilsService);

  async launchSsoBrowserWindow(
    email: string,
    clientId: string,
    redirectUri: string,
  ): Promise<void | null> {
    if (!ipc.platform.isAppImage && !ipc.platform.isSnapStore && !ipc.platform.isDev) {
      return super.launchSsoBrowser(clientId, redirectUri);
    }

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
    const state = await this.passwordGenerationService.generatePassword(passwordOptions);
    const ssoCodeVerifier = await this.passwordGenerationService.generatePassword(passwordOptions);
    const codeVerifierHash = await this.cryptoFunctionService.hash(ssoCodeVerifier, "sha256");
    const codeChallenge = Utils.fromBufferToUrlB64(codeVerifierHash);

    // Save SSO params
    await this.ssoLoginService.setSsoState(state);
    await this.ssoLoginService.setCodeVerifier(ssoCodeVerifier);

    try {
      await ipc.platform.localhostCallbackService.openSsoPrompt(codeChallenge, state);
    } catch (err) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccured"),
        this.i18nService.t("ssoError"),
      );
    }
  }
}
