import { firstValueFrom } from "rxjs";

import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { ClearClipboardDelay } from "@bitwarden/common/autofill/constants";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { BiometricStateService } from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { SystemService } from "@bitwarden/common/platform/services/system.service";

import { AlarmsManagerService } from "../browser/abstractions/alarms-manager.service";

export class BrowserSystemService extends SystemService {
  constructor(
    messagingService: MessagingService,
    platformUtilsService: PlatformUtilsService,
    reloadCallback: () => Promise<void> = null,
    stateService: StateService,
    autofillSettingsService: AutofillSettingsServiceAbstraction,
    vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    biometricStateService: BiometricStateService,
    private alarmsManagerService: AlarmsManagerService,
  ) {
    super(
      messagingService,
      platformUtilsService,
      reloadCallback,
      stateService,
      autofillSettingsService,
      vaultTimeoutSettingsService,
      biometricStateService,
    );
  }

  async clearClipboard(clipboardValue: string, timeoutSeconds: number = null): Promise<void> {
    const clearClipboardAlarmName = "browserSystemClearClipboard";
    await this.alarmsManagerService.clearAlarm(clearClipboardAlarmName);
    if (this.clearClipboardTimeout != null) {
      clearTimeout(this.clearClipboardTimeout);
      this.clearClipboardTimeout = null;
    }

    if (Utils.isNullOrWhitespace(clipboardValue)) {
      return;
    }

    const clearClipboardDelayInSeconds = await firstValueFrom(
      this.autofillSettingsService.clearClipboardDelay$,
    );
    if (clearClipboardDelayInSeconds == null) {
      return;
    }

    this.clearClipboardTimeoutFunction = async () => {
      const clipboardValueNow = await this.platformUtilsService.readFromClipboard();
      if (clipboardValue === clipboardValueNow) {
        this.platformUtilsService.copyToClipboard("", { clearing: true });
      }
    };

    if (clearClipboardDelayInSeconds < ClearClipboardDelay.OneMinute) {
      this.clearClipboardTimeout = setTimeout(
        () => this.clearClipboardTimeoutFunction(),
        clearClipboardDelayInSeconds * 1000,
      );
      return;
    }

    await this.alarmsManagerService.setTimeoutAlarm(
      clearClipboardAlarmName,
      () => this.clearClipboardTimeoutFunction(),
      clearClipboardDelayInSeconds / 60,
    );
  }
}
