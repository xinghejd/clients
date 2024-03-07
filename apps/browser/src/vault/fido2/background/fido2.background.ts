import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";

import { BrowserApi } from "../../../platform/browser/browser-api";
import { AbortManager } from "../../background/abort-manager";
import { Fido2Port } from "../enums/fido2-port.enum";

import {
  Fido2Background as Fido2BackgroundInterface,
  Fido2BackgroundExtensionMessageHandlers,
  Fido2ExtensionMessage,
} from "./abstractions/fido2.background";

export default class Fido2Background implements Fido2BackgroundInterface {
  private abortManager = new AbortManager();
  private fido2ContentScriptPortsSet = new Set<chrome.runtime.Port>();
  private previousEnablePasskeys: boolean;
  private extensionMessageHandlers: Fido2BackgroundExtensionMessageHandlers = {
    triggerFido2ContentScriptInjection: ({ message, sender }) =>
      this.injectFido2ContentScript(message.hostname, message.origin, sender.tab, sender.frameId),
    triggerFido2PageScriptInjection: ({ message, sender }) =>
      this.injectFido2PageScript(message, sender),
    fido2AbortRequest: ({ message }) => this.abortRequest(message),
    fido2RegisterCredentialRequest: ({ message, sender }) =>
      this.registerCredentialRequest(message, sender),
    fido2GetCredentialRequest: ({ message, sender }) => this.getCredentialRequest(message, sender),
  };

  constructor(
    private logService: LogService,
    private fido2ClientService: Fido2ClientService,
    private vaultSettingsService: VaultSettingsService,
  ) {}

  /**
   * Initializes the FIDO2 background service. Sets up the extension message
   * and port listeners. Subscribes to the enablePasskeys$ observable to
   * handle passkey enable/disable events.
   */
  init() {
    BrowserApi.messageListener("fido2.background", this.handleExtensionMessage);
    BrowserApi.addListener(chrome.runtime.onConnect, this.handleInjectedScriptPortConnection);
    this.vaultSettingsService.enablePasskeys$.subscribe(this.handleEnablePasskeysUpdate.bind(this));
  }

  async loadFido2ScriptsOnInstall() {
    await this.injectFido2ContentScriptInAllTabs();
  }

  private handleEnablePasskeysUpdate(enablePasskeys: boolean) {
    if (enablePasskeys && this.previousEnablePasskeys === false) {
      this.reloadFido2ContentScripts();
    }

    this.previousEnablePasskeys = enablePasskeys;
  }

  /**
   * Injects the FIDO2 content script into the current tab.
   *
   * @returns {Promise<void>}
   */
  private async injectFido2ContentScript(
    hostname: string,
    origin: string,
    tab: chrome.tabs.Tab,
    frameId?: chrome.runtime.MessageSender["frameId"],
  ): Promise<void> {
    if (!(await this.fido2ClientService.isFido2FeatureEnabled(hostname, origin))) {
      return;
    }

    await BrowserApi.executeScriptInTab(tab.id, {
      file: "content/fido2/content-script.js",
      frameId: frameId || 0,
      runAt: "document_start",
    });
  }

  private injectFido2PageScript(
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    if (BrowserApi.manifestVersion === 3) {
      void BrowserApi.executeScriptInTab(
        sender.tab.id,
        { file: "content/fido2/page-script.js", runAt: "document_start" },
        { world: "MAIN" },
      );
      return;
    }

    void BrowserApi.executeScriptInTab(sender.tab.id, {
      file: "content/fido2/page-script-append-mv2.js",
      runAt: "document_start",
    });
  }

  private reloadFido2ContentScripts() {
    this.fido2ContentScriptPortsSet.forEach((port) => {
      port.disconnect();
      this.fido2ContentScriptPortsSet.delete(port);
    });

    void this.injectFido2ContentScriptInAllTabs();
  }

  private async injectFido2ContentScriptInAllTabs() {
    const tabs = await BrowserApi.tabsQuery({});
    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index];
      if (!tab.url?.startsWith("https")) {
        continue;
      }

      try {
        const parsedUrl = new URL(tab.url);
        void this.injectFido2ContentScript(parsedUrl.hostname, parsedUrl.origin, tab);
      } catch (e) {
        this.logService.error(e);
      }
    }
  }

  private abortRequest(message: Fido2ExtensionMessage) {
    this.abortManager.abort(message.abortedRequestId);
  }

  private async registerCredentialRequest(
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<CreateCredentialResult> {
    return await this.handleCredentialRequest<CreateCredentialResult>(
      message,
      sender.tab,
      this.fido2ClientService.createCredential.bind(this.fido2ClientService),
    );
  }

  private async getCredentialRequest(
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<AssertCredentialResult> {
    return await this.handleCredentialRequest<AssertCredentialResult>(
      message,
      sender.tab,
      this.fido2ClientService.assertCredential.bind(this.fido2ClientService),
    );
  }

  private handleCredentialRequest = async <T>(
    { requestId, data }: Fido2ExtensionMessage,
    tab: chrome.tabs.Tab,
    callback: (
      data: AssertCredentialParams | CreateCredentialParams,
      tab: chrome.tabs.Tab,
      abortController: AbortController,
    ) => Promise<T>,
  ) => {
    return await this.abortManager.runWithAbortController(requestId, async (abortController) => {
      try {
        return await callback(data, tab, abortController);
      } finally {
        await BrowserApi.focusTab(tab.id);
        await BrowserApi.focusWindow(tab.windowId);
      }
    });
  };

  private handleExtensionMessage = (
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    const messageResponse = handler({ message, sender });
    if (!messageResponse) {
      return;
    }

    Promise.resolve(messageResponse)
      .then(
        (response) => sendResponse(response),
        (error) => sendResponse({ error: { ...error, message: error.message } }),
      )
      .catch(this.logService.error);

    return true;
  };

  private handleInjectedScriptPortConnection = (port: chrome.runtime.Port) => {
    if (port.name !== Fido2Port.InjectedScript) {
      return;
    }

    this.fido2ContentScriptPortsSet.add(port);
    port.onDisconnect.addListener(this.handleInjectScriptPortOnDisconnect);
  };

  private handleInjectScriptPortOnDisconnect = (port: chrome.runtime.Port) => {
    if (port.name !== Fido2Port.InjectedScript) {
      return;
    }

    this.fido2ContentScriptPortsSet.delete(port);
  };
}
