import { mock } from "jest-mock-extended";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { Fido2ClientService } from "@bitwarden/common/vault/services/fido2/fido2-client.service";

import { BrowserApi } from "../../../platform/browser/browser-api";

import Fido2Background from "./fido2.background";

describe("Fido2Background", () => {
  const logService: LogService = mock<LogService>();
  let fido2ClientService: Fido2ClientService;
  let vaultSettingsService: VaultSettingsService;
  let fido2Background: Fido2Background;
  let tabMock: chrome.tabs.Tab;

  beforeEach(() => {
    fido2ClientService = mock<Fido2ClientService>();
    vaultSettingsService = mock<VaultSettingsService>();
    fido2Background = new Fido2Background(logService, fido2ClientService, vaultSettingsService);
    tabMock = { id: 123, url: "https://bitwarden.com" } as chrome.tabs.Tab;
    jest.spyOn(BrowserApi, "executeScriptInTab").mockImplementation();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("injectFido2ContentScripts", () => {
    const fido2ContentScript = "content/fido2/content-script.js";
    const defaultExecuteScriptOptions = { runAt: "document_start", frameId: 0 };

    it("accepts an extension message sender and injects the fido2 scripts into the tab of the sender", async () => {
      fido2ClientService.isFido2FeatureEnabled = jest.fn().mockResolvedValue(true);
      const hostname = "not-bitwarden.com";
      const origin = "https://not-bitwarden.com";

      await fido2Background["injectFido2ContentScript"](hostname, origin, tabMock);

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabMock.id, {
        file: fido2ContentScript,
        ...defaultExecuteScriptOptions,
      });
    });
  });
});
