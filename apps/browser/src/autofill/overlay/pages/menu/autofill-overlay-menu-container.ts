import { EVENTS } from "@bitwarden/common/autofill/constants";

import { setElementStyles } from "../../../utils";

export class AutofillOverlayMenuContainer {
  private initMessage: any;
  private extensionOriginsSet: Set<string>;
  private port: chrome.runtime.Port | null = null;
  private portName: string;
  private iframe: HTMLIFrameElement;
  private iframeStyles: Partial<CSSStyleDeclaration> = {
    all: "initial",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "block",
    zIndex: "2147483647",
    lineHeight: "0",
    overflow: "hidden",
    visibility: "visible",
    clipPath: "none",
    pointerEvents: "auto",
    margin: "0",
    padding: "0",
    colorScheme: "normal",
  };
  private defaultIframeAttributes: Record<string, string> = {
    src: "",
    title: "",
    sandbox: "allow-scripts",
    allowtransparency: "true",
    tabIndex: "-1",
  };
  private windowMessageHandlers: Record<string, (message: any) => void> = {
    initAutofillOverlayList: (message: any) => this.handleInitOverlayIframe(message),
    initAutofillOverlayButton: (message: any) => this.handleInitOverlayIframe(message),
  };
  private backgroundPortMessageHandlers: Record<string, (message: any) => void> = {};

  constructor() {
    this.extensionOriginsSet = new Set([
      chrome.runtime.getURL("").slice(0, -1).toLowerCase(), // Remove the trailing slash and normalize the extension url to lowercase
      "null",
    ]);

    globalThis.addEventListener("message", this.handleWindowMessage);
  }

  private handleInitOverlayIframe(message: any) {
    this.initMessage = message;
    this.defaultIframeAttributes.src = message.iframeUrl;
    this.defaultIframeAttributes.title = message.pageTitle;
    this.portName = message.portName;

    this.iframe = globalThis.document.createElement("iframe");
    setElementStyles(this.iframe, this.iframeStyles, true);
    for (const [attribute, value] of Object.entries(this.defaultIframeAttributes)) {
      this.iframe.setAttribute(attribute, value);
    }
    this.iframe.addEventListener(EVENTS.LOAD, this.setupPortMessageListener);

    globalThis.document.body.appendChild(this.iframe);
  }

  private setupPortMessageListener = () => {
    this.port = chrome.runtime.connect({ name: this.portName });
    this.port.onMessage.addListener(this.handlePortMessage);

    this.postMessageToIframe(this.initMessage);
  };

  private postMessageToIframe(message: any) {
    this.iframe?.contentWindow?.postMessage(message, "*");
  }

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== this.portName) {
      return;
    }

    if (this.backgroundPortMessageHandlers[message.command]) {
      this.backgroundPortMessageHandlers[message.command]({ message, port });
      return;
    }

    this.iframe.contentWindow?.postMessage(message, "*");
  };

  private handleWindowMessage = (event: MessageEvent) => {
    const message = event.data;
    if (this.isForeignWindowMessage(event)) {
      return;
    }

    if (this.windowMessageHandlers[message.command]) {
      this.windowMessageHandlers[message.command](message);
      return;
    }

    if (event.source === globalThis.parent) {
      this.iframe?.contentWindow?.postMessage(message, "*");
      return;
    }

    this.port?.postMessage(message);
  };

  private isForeignWindowMessage(event: MessageEvent) {
    if (!event.data.portKey) {
      return true;
    }

    if (globalThis.parent === event.source) {
      return false;
    }

    return (
      this.iframe?.contentWindow !== event.source ||
      !this.isFromExtensionOrigin(event.origin.toLowerCase())
    );
  }

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
