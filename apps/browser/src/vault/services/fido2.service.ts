import { BrowserApi } from "../../platform/browser/browser-api";

import { Fido2Service as Fido2ServiceInterface } from "./abstractions/fido2.service";

export default class Fido2Service implements Fido2ServiceInterface {
  async init() {
    const tabs = await BrowserApi.tabsQuery({});
    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index];
      if (tab.url?.startsWith("http")) {
        this.injectFido2ContentScripts({ tab } as chrome.runtime.MessageSender);
      }
    }

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "fido2ContentScript") {
        port.postMessage({ command: "fido2ContentScriptInit" });
      }
    });
  }

  /**
   *
   * @param {chrome.runtime.MessageSender}  sender
   * @returns {Promise<void>}
   */
  async injectFido2ContentScripts(sender: chrome.runtime.MessageSender): Promise<void> {
    await BrowserApi.executeScriptInTab(sender.tab.id, {
      file: "content/fido2/content-script.js",
      frameId: sender.frameId,
      runAt: "document_start",
    });
  }
}
