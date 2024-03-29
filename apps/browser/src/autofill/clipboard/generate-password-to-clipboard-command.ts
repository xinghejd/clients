import { firstValueFrom } from "rxjs";

import { ClearClipboardDelay } from "@bitwarden/common/autofill/constants";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

import { AlarmNames } from "../../platform/browser/abstractions/alarms-manager.service";
import { AlarmsManagerService } from "../../platform/browser/alarms-manager.service";

import { ClearClipboard } from "./clear-clipboard";
import { copyToClipboard } from "./copy-to-clipboard-command";

export class GeneratePasswordToClipboardCommand {
  private clearClipboardTimeout: number | NodeJS.Timeout;

  constructor(
    private passwordGenerationService: PasswordGenerationServiceAbstraction,
    private autofillSettingsService: AutofillSettingsServiceAbstraction,
    private alarmsManagerService: AlarmsManagerService,
  ) {}

  async getClearClipboard() {
    return await firstValueFrom(this.autofillSettingsService.clearClipboardDelay$);
  }

  async generatePasswordToClipboard(tab: chrome.tabs.Tab) {
    const [options] = await this.passwordGenerationService.getOptions();
    const password = await this.passwordGenerationService.generatePassword(options);

    await copyToClipboard(tab, password);

    const clearClipboardDelayInSeconds = await this.getClearClipboard();
    if (!clearClipboardDelayInSeconds) {
      return;
    }

    if (clearClipboardDelayInSeconds < ClearClipboardDelay.OneMinute) {
      if (this.clearClipboardTimeout) {
        clearTimeout(this.clearClipboardTimeout);
      }
      this.clearClipboardTimeout = setTimeout(
        () => ClearClipboard.run(),
        clearClipboardDelayInSeconds * 1000,
      );
      return;
    }

    await this.alarmsManagerService.clearAlarm(AlarmNames.clearClipboardTimeout);
    await this.alarmsManagerService.setTimeoutAlarm(
      AlarmNames.clearClipboardTimeout,
      () => ClearClipboard.run(),
      clearClipboardDelayInSeconds / 60,
    );
  }
}
