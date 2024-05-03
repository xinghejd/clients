import { EVENTS } from "@bitwarden/common/autofill/constants";

import { setElementStyles } from "../../../../utils";
import {
  InitInlineMenuElementMessage,
  AutofillInlineMenuMenuContainerWindowMessageHandlers,
} from "../../abstractions/autofill-inline-menu-container";

export class AutofillInlineMenuContainer {
  private extensionOriginsSet: Set<string>;
  private port: chrome.runtime.Port | null = null;
  private portName: string;
  private inlineMenuPageIframe: HTMLIFrameElement;
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
  private windowMessageHandlers: AutofillInlineMenuMenuContainerWindowMessageHandlers = {
    initAutofillInlineMenuList: (message) => this.handleInitInlineMenuIframe(message),
    initAutofillInlineMenuButton: (message) => this.handleInitInlineMenuIframe(message),
  };

  constructor() {
    this.extensionOriginsSet = new Set([
      chrome.runtime.getURL("").slice(0, -1).toLowerCase(), // Remove the trailing slash and normalize the extension url to lowercase
      "null",
    ]);

    globalThis.addEventListener("message", this.handleWindowMessage);
  }

  private handleInitInlineMenuIframe(message: InitInlineMenuElementMessage) {
    this.defaultIframeAttributes.src = message.iframeUrl;
    this.defaultIframeAttributes.title = message.pageTitle;
    this.portName = message.portName;

    this.inlineMenuPageIframe = globalThis.document.createElement("iframe");
    setElementStyles(this.inlineMenuPageIframe, this.iframeStyles, true);
    for (const [attribute, value] of Object.entries(this.defaultIframeAttributes)) {
      this.inlineMenuPageIframe.setAttribute(attribute, value);
    }
    this.inlineMenuPageIframe.addEventListener(EVENTS.LOAD, () =>
      this.setupPortMessageListener(message),
    );

    globalThis.document.body.appendChild(this.inlineMenuPageIframe);
  }

  private setupPortMessageListener = (message: InitInlineMenuElementMessage) => {
    this.port = chrome.runtime.connect({ name: this.portName });
    this.port.onMessage.addListener(this.handlePortMessage);

    this.postMessageToInlineMenuPage(message);
  };

  private postMessageToInlineMenuPage(message: any) {
    if (!this.inlineMenuPageIframe?.contentWindow) {
      return;
    }

    this.inlineMenuPageIframe.contentWindow.postMessage(message, "*");
  }

  private postMessageToBackground(message: any) {
    if (!this.port) {
      return;
    }

    this.port.postMessage(message);
  }

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== this.portName) {
      return;
    }

    this.postMessageToInlineMenuPage(message);
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

    if (this.isMessageFromParentWindow(event)) {
      this.postMessageToInlineMenuPage(message);
      return;
    }

    this.postMessageToBackground(message);
  };

  private isForeignWindowMessage(event: MessageEvent) {
    if (!event.data.portKey) {
      return true;
    }

    if (this.isMessageFromParentWindow(event)) {
      return false;
    }

    return !this.isMessageFromInlineMenuPageIframe(event);
  }

  private isMessageFromParentWindow(event: MessageEvent): boolean {
    return globalThis.parent === event.source;
  }

  private isMessageFromInlineMenuPageIframe(event: MessageEvent): boolean {
    if (!this.inlineMenuPageIframe) {
      return false;
    }

    return (
      this.inlineMenuPageIframe.contentWindow === event.source &&
      this.extensionOriginsSet.has(event.origin.toLowerCase())
    );
  }
}
