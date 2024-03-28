import {
  AuthRequestServiceAbstraction,
  InternalUserDecryptionOptionsServiceAbstraction,
  LoginStrategyService,
} from "@bitwarden/auth/common";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { GlobalStateProvider } from "@bitwarden/common/platform/state";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";

import { AlarmsManagerService } from "../../platform/browser/abstractions/alarms-manager.service";

export class BrowserLoginStrategyService extends LoginStrategyService {
  private readonly sessionTimeoutAlarmName = "browser-session-timeout-alarm";

  constructor(
    cryptoService: CryptoService,
    apiService: ApiService,
    tokenService: TokenService,
    appIdService: AppIdService,
    platformUtilsService: PlatformUtilsService,
    messagingService: MessagingService,
    logService: LogService,
    keyConnectorService: KeyConnectorService,
    environmentService: EnvironmentService,
    stateService: StateService,
    twoFactorService: TwoFactorService,
    i18nService: I18nService,
    encryptService: EncryptService,
    passwordStrengthService: PasswordStrengthServiceAbstraction,
    policyService: PolicyService,
    deviceTrustCryptoService: DeviceTrustCryptoServiceAbstraction,
    authRequestService: AuthRequestServiceAbstraction,
    userDecryptionOptionsService: InternalUserDecryptionOptionsServiceAbstraction,
    stateProvider: GlobalStateProvider,
    billingAccountProfileStateService: BillingAccountProfileStateService,
    private alarmsManagerService: AlarmsManagerService,
  ) {
    super(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      keyConnectorService,
      environmentService,
      stateService,
      twoFactorService,
      i18nService,
      encryptService,
      passwordStrengthService,
      policyService,
      deviceTrustCryptoService,
      authRequestService,
      userDecryptionOptionsService,
      stateProvider,
      billingAccountProfileStateService,
    );
  }

  protected setupSessionTimeout = () => {
    const sessionTimeoutLengthInSeconds = this.sessionTimeoutLengthInMs / 1000;
    this.alarmsManagerService
      .setTimeoutAlarm(
        this.sessionTimeoutAlarmName,
        () => this.clearCache(),
        sessionTimeoutLengthInSeconds / 60,
      )
      .catch((error) => this.logService.error(`Failed to set session timeout alarm: ${error}`));
  };

  protected async clearSessionTimeout() {
    await super.clearSessionTimeout();
    void this.alarmsManagerService
      .clearAlarm(this.sessionTimeoutAlarmName)
      .catch((error) => this.logService.error(`Failed to clear session timeout alarm: ${error}`));
  }
}
