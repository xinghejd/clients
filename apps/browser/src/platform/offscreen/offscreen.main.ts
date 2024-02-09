import { BrowserApi } from "../browser/browser-api";
import BrowserClipboardService from "../services/browser-clipboard.service";

import {
  OffscreenMainExtensionMessage,
  OffscreenMainExtensionMessageHandlers,
} from "./abstractions/offscreen.main";

class OffscreenMain {
  extensionMessageHandlers: OffscreenMainExtensionMessageHandlers = {
    offscreenCopyToClipboard: ({ message }) => this.handleOffscreenCopyToClipboard(message),
    offscreenReadFromClipboard: () => this.handleOffscreenReadFromClipboard(),
  };

  constructor() {
    this.setupExtensionMessageListener();
  }

  async handleOffscreenCopyToClipboard(message: OffscreenMainExtensionMessage) {
    await BrowserClipboardService.copy(window, message.text);
  }

  async handleOffscreenReadFromClipboard() {
    return await BrowserClipboardService.read(window);
  }

  private setupExtensionMessageListener() {
    BrowserApi.messageListener("offscreen-document", this.handleExtensionMessage);
  }

  /**
   * Handles extension messages sent to the extension background.
   *
   * @param message - The message received from the extension
   * @param sender - The sender of the message
   * @param sendResponse - The response to send back to the sender
   */
  private handleExtensionMessage = (
    message: OffscreenMainExtensionMessage,
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
      .catch(() => {});
    return true;
  };
}

new OffscreenMain();
