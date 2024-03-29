import { mock, MockProxy } from "jest-mock-extended";

import { AutofillSettingsService } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

import { AlarmNames } from "../../platform/browser/abstractions/alarms-manager.service";
import { AlarmsManagerService } from "../../platform/browser/alarms-manager.service";
import { BrowserApi } from "../../platform/browser/browser-api";

import { GeneratePasswordToClipboardCommand } from "./generate-password-to-clipboard-command";

describe("GeneratePasswordToClipboardCommand", () => {
  let passwordGenerationService: MockProxy<PasswordGenerationServiceAbstraction>;
  let autofillSettingsService: MockProxy<AutofillSettingsService>;
  let alarmsManagerService: MockProxy<AlarmsManagerService>;

  let sut: GeneratePasswordToClipboardCommand;

  beforeEach(() => {
    passwordGenerationService = mock<PasswordGenerationServiceAbstraction>();

    passwordGenerationService.getOptions.mockResolvedValue([{ length: 8 }, {} as any]);

    passwordGenerationService.generatePassword.mockResolvedValue("PASSWORD");

    alarmsManagerService = mock<AlarmsManagerService>();

    jest.spyOn(BrowserApi, "sendTabsMessage").mockReturnValue();

    sut = new GeneratePasswordToClipboardCommand(
      passwordGenerationService,
      autofillSettingsService,
      alarmsManagerService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("generatePasswordToClipboard", () => {
    it("has clear clipboard value", async () => {
      jest.spyOn(sut as any, "getClearClipboard").mockImplementation(() => 5 * 60); // 5 minutes

      await sut.generatePasswordToClipboard({ id: 1 } as any);

      expect(jest.spyOn(BrowserApi, "sendTabsMessage")).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(BrowserApi, "sendTabsMessage")).toHaveBeenCalledWith(1, {
        command: "copyText",
        text: "PASSWORD",
      });
      expect(alarmsManagerService.setTimeoutAlarm).toHaveBeenCalledTimes(1);
      expect(alarmsManagerService.setTimeoutAlarm).toHaveBeenCalledWith(
        AlarmNames.clearClipboardTimeout,
        expect.any(Function),
        expect.any(Number),
      );
    });

    it("does not have clear clipboard value", async () => {
      jest.spyOn(sut as any, "getClearClipboard").mockImplementation(() => null);

      await sut.generatePasswordToClipboard({ id: 1 } as any);

      expect(jest.spyOn(BrowserApi, "sendTabsMessage")).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(BrowserApi, "sendTabsMessage")).toHaveBeenCalledWith(1, {
        command: "copyText",
        text: "PASSWORD",
      });
      expect(alarmsManagerService.setTimeoutAlarm).not.toHaveBeenCalled();
    });
  });
});
