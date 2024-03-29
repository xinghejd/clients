import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { DomainSettingsService } from "@bitwarden/common/autofill/services/domain-settings.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Fido2AuthenticatorService } from "@bitwarden/common/vault/abstractions/fido2/fido2-authenticator.service.abstraction";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { Fido2ClientService } from "@bitwarden/common/vault/services/fido2/fido2-client.service";

import { AlarmNames } from "../../../platform/browser/abstractions/alarms-manager.service";
import { AlarmsManagerService } from "../../../platform/browser/alarms-manager.service";

export class BrowserFido2ClientService extends Fido2ClientService {
  constructor(
    authenticator: Fido2AuthenticatorService,
    configService: ConfigService,
    authService: AuthService,
    vaultSettingsService: VaultSettingsService,
    domainSettingsService: DomainSettingsService,
    logService?: LogService,
    private alarmsManagerService?: AlarmsManagerService,
  ) {
    super(
      authenticator,
      configService,
      authService,
      vaultSettingsService,
      domainSettingsService,
      logService,
    );
  }

  protected initAbortTimeout = (abortController: AbortController, timeoutInMs: number) => {
    const timeoutInSeconds = timeoutInMs / 1000;
    this.alarmsManagerService
      .setTimeoutAlarm(
        AlarmNames.fido2ClientAbortTimeout,
        () => abortController.abort(),
        timeoutInSeconds / 60,
      )
      .catch((error) => this.logService?.error(error));

    return 0;
  };

  protected clearAbortTimeout = () => {
    this.alarmsManagerService
      .clearAlarm(AlarmNames.fido2ClientAbortTimeout)
      .catch((error) => this.logService?.error(error));
  };
}
