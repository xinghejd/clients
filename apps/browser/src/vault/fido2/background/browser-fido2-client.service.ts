import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { DomainSettingsService } from "@bitwarden/common/autofill/services/domain-settings.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Fido2AuthenticatorService } from "@bitwarden/common/vault/abstractions/fido2/fido2-authenticator.service.abstraction";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { Fido2ClientService } from "@bitwarden/common/vault/services/fido2/fido2-client.service";

import { AlarmsManagerService } from "../../../platform/browser/alarms-manager.service";

export class BrowserFido2ClientService extends Fido2ClientService {
  private abortTimeoutAlarmName = "fido2AbortTimeout";

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

  protected initAbortTimeout = (abortController: AbortController, timeout: number) => {
    this.alarmsManagerService
      .setTimeoutAlarm(this.abortTimeoutAlarmName, () => abortController.abort(), timeout / 1000)
      .catch((error) => this.logService?.error(error));

    return 0;
  };

  protected clearAbortTimeout = () => {
    this.alarmsManagerService
      .clearAlarm(this.abortTimeoutAlarmName)
      .catch((error) => this.logService?.error(error));
  };
}
