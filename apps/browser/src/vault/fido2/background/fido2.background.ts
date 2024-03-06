import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Fido2ClientService } from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

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
  private extensionMessageHandlers: Fido2BackgroundExtensionMessageHandlers = {
    triggerFido2ContentScriptInjection: ({ message, sender }) =>
      this.injectFido2ContentScripts(message.hostname, message.origin, sender.tab, sender.frameId),
    reloadFido2ContentScripts: () => this.reloadFido2ContentScripts(),
    fido2AbortRequest: ({ message }) => this.abortFido2Requests(message),
  };

  constructor(
    private logService: LogService,
    private fido2ClientService: Fido2ClientService,
  ) {}

  async loadAutofillScriptsOnInstall() {
    BrowserApi.messageListener("fido2.background", this.handleExtensionMessage);
    BrowserApi.addListener(chrome.runtime.onConnect, this.handleInjectedScriptPortConnection);

    await this.injectFido2ContentScriptsInAllTabs();
  }

  /**
   * Injects the FIDO2 content script into the current tab.
   * @returns {Promise<void>}
   */
  async injectFido2ContentScripts(
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

  private abortFido2Requests(message: Fido2ExtensionMessage) {
    this.abortManager.abort(message.abortedRequestId);
  }

  private reloadFido2ContentScripts() {
    this.fido2ContentScriptPortsSet.forEach((port) => {
      port.disconnect();
      this.fido2ContentScriptPortsSet.delete(port);
    });

    void this.injectFido2ContentScriptsInAllTabs();
  }

  private async injectFido2ContentScriptsInAllTabs() {
    const tabs = await BrowserApi.tabsQuery({});
    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index];
      if (!tab.url?.startsWith("https")) {
        continue;
      }

      try {
        const parsedUrl = new URL(tab.url);
        void this.injectFido2ContentScripts(parsedUrl.hostname, parsedUrl.origin, tab);
      } catch (e) {
        this.logService.error(e);
      }
    }
  }

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
      .then((response) => sendResponse(response))
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
