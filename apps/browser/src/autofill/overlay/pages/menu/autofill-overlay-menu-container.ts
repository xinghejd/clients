import { EVENTS } from "@bitwarden/common/autofill/constants";

import { setElementStyles } from "../../../utils";
import {
  InitOverlayElementMessage,
  AutofillOverlayMenuContainerWindowMessageHandlers,
} from "../../abstractions/autofill-overlay-menu-container";

export class AutofillOverlayMenuContainer {
  private extensionOriginsSet: Set<string>;
  private port: chrome.runtime.Port | null = null;
  private portName: string;
  private overlayPageIframe: HTMLIFrameElement;
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
  private windowMessageHandlers: AutofillOverlayMenuContainerWindowMessageHandlers = {
    initAutofillOverlayList: (message) => this.handleInitOverlayIframe(message),
    initAutofillOverlayButton: (message) => this.handleInitOverlayIframe(message),
  };

  constructor() {
    this.extensionOriginsSet = new Set([
      chrome.runtime.getURL("").slice(0, -1).toLowerCase(), // Remove the trailing slash and normalize the extension url to lowercase
      "null",
    ]);

    globalThis.addEventListener("message", this.handleWindowMessage);
  }

  private handleInitOverlayIframe(message: InitOverlayElementMessage) {
    this.defaultIframeAttributes.src = message.iframeUrl;
    this.defaultIframeAttributes.title = message.pageTitle;
    this.portName = message.portName;

    this.overlayPageIframe = globalThis.document.createElement("iframe");
    setElementStyles(this.overlayPageIframe, this.iframeStyles, true);
    for (const [attribute, value] of Object.entries(this.defaultIframeAttributes)) {
      this.overlayPageIframe.setAttribute(attribute, value);
    }
    this.overlayPageIframe.addEventListener(EVENTS.LOAD, () =>
      this.setupPortMessageListener(message),
    );

    globalThis.document.body.appendChild(this.overlayPageIframe);
  }

  private setupPortMessageListener = (message: InitOverlayElementMessage) => {
    this.port = chrome.runtime.connect({ name: this.portName });
    this.port.onMessage.addListener(this.handlePortMessage);

    this.postMessageToOverlayPage(message);
  };

  private postMessageToOverlayPage(message: any) {
    if (!this.overlayPageIframe?.contentWindow) {
      return;
    }

    this.overlayPageIframe.contentWindow.postMessage(message, "*");
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

    this.postMessageToOverlayPage(message);
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
      this.postMessageToOverlayPage(message);
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

    return !this.isMessageFromOverlayPageIframe(event);
  }

  private isMessageFromParentWindow(event: MessageEvent): boolean {
    return globalThis.parent === event.source;
  }

  private isMessageFromOverlayPageIframe(event: MessageEvent): boolean {
    if (!this.overlayPageIframe) {
      return false;
    }

    return (
      this.overlayPageIframe.contentWindow === event.source &&
      this.extensionOriginsSet.has(event.origin.toLowerCase())
    );
  }
}
