export class AutofillOverlayMessageConnector {
  private extensionOriginsSet: Set<string>;
  private port: chrome.runtime.Port | null = null;

  constructor() {
    globalThis.addEventListener("message", this.handleWindowMessage);

    this.extensionOriginsSet = new Set([
      chrome.runtime.getURL("").slice(0, -1).toLowerCase(), // Remove the trailing slash and normalize the extension url to lowercase
      "null",
    ]);
  }

  private handleWindowMessage = (event: MessageEvent) => {
    if (
      event.source !== globalThis.parent ||
      !this.isFromExtensionOrigin(event.origin.toLowerCase())
    ) {
      return;
    }

    const message = event.data;

    if (this.port) {
      this.port.postMessage(message);
      return;
    }

    if (message.command !== "initAutofillOverlayPort") {
      return;
    }

    this.port = chrome.runtime.connect({ name: message.portName });
  };

  /**
   * Chrome returns null for any sandboxed iframe sources.
   * Firefox references the extension URI as its origin.
   * Any other origin value is a security risk.
   *
   * @param messageOrigin - The origin of the window message
   */
  private isFromExtensionOrigin(messageOrigin: string): boolean {
    return this.extensionOriginsSet.has(messageOrigin);
  }
}
