import { firstValueFrom } from "rxjs";

import { ClearClipboardDelay } from "@bitwarden/common/autofill/constants";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

import { AlarmsManagerService } from "../../platform/browser/alarms-manager.service";

import { ClearClipboard, clearClipboardAlarmName } from "./clear-clipboard";
import { copyToClipboard } from "./copy-to-clipboard-command";

export class GeneratePasswordToClipboardCommand {
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

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    copyToClipboard(tab, password);

    const clearClipboardDelayInSeconds = await this.getClearClipboard();
    if (!clearClipboardDelayInSeconds) {
      return;
    }

    if (clearClipboardDelayInSeconds < ClearClipboardDelay.OneMinute) {
      setTimeout(() => ClearClipboard.run(), clearClipboardDelayInSeconds * 1000);
      return;
    }

    await this.alarmsManagerService.clearAlarm(clearClipboardAlarmName);
    await this.alarmsManagerService.setTimeoutAlarm(
      clearClipboardAlarmName,
      () => ClearClipboard.run(),
      clearClipboardDelayInSeconds / 60,
    );
  }
}
