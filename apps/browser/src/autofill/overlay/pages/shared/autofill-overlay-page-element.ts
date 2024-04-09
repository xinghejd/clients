import { EVENTS } from "@bitwarden/common/autofill/constants";

import { RedirectFocusDirection } from "../../../utils/autofill-overlay.enum";
import {
  AutofillOverlayPageElementWindowMessage,
  WindowMessageHandlers,
} from "../../abstractions/autofill-overlay-page-element";

class AutofillOverlayPageElement extends HTMLElement {
  protected shadowDom: ShadowRoot;
  protected messageOrigin: string;
  protected translations: Record<string, string>;
  protected messageConnectorIframe: HTMLIFrameElement;
  private portKey: string;
  protected windowMessageHandlers: WindowMessageHandlers;

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
  }

  /**
   * Initializes the overlay page element. Facilitates ensuring that the page
   * is set up with the expected styles and translations.
   *
   * @param elementName - The name of the element, e.g. "button" or "list"
   * @param styleSheetUrl - The URL of the stylesheet to apply to the page
   * @param translations - The translations to apply to the page
   * @param portKey - Background generated key that allows the port to communicate with the background
   */
  protected async initOverlayPage(
    elementName: "button" | "list",
    styleSheetUrl: string,
    translations: Record<string, string>,
    portKey: string,
  ): Promise<HTMLLinkElement> {
    this.portKey = portKey;

    this.translations = translations;
    globalThis.document.documentElement.setAttribute("lang", this.getTranslation("locale"));
    globalThis.document.head.title = this.getTranslation(`${elementName}PageTitle`);

    this.shadowDom.innerHTML = "";
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    return linkElement;
  }

  /**
   * Initializes an iframe that acts as the communication bridge between
   * the inline menu UI and the background script. Awaits the load event
   * of the iframe before initializing the inline menu element to ensure
   * messages from the inline menu are not missed.
   *
   * @param messageConnectorUrl - The URL of the message connector to use
   * @param elementName - The name of the element, e.g. "button" or "list"
   */
  // private initMessageConnector(messageConnectorUrl: string, elementName: "button" | "list") {
  //   this.messageConnectorIframe = globalThis.document.createElement("iframe");
  //   this.messageConnectorIframe.src = messageConnectorUrl;
  //   this.messageConnectorIframe.style.opacity = "0";
  //   this.messageConnectorIframe.style.position = "absolute";
  //   this.messageConnectorIframe.style.width = "0";
  //   this.messageConnectorIframe.style.height = "0";
  //   this.messageConnectorIframe.style.border = "none";
  //   this.messageConnectorIframe.style.pointerEvents = "none";
  //   globalThis.document.body.appendChild(this.messageConnectorIframe);
  //
  //   return new Promise<void>((resolve) => {
  //     this.messageConnectorIframe.addEventListener(EVENTS.LOAD, () => {
  //       this.postMessageToConnector({
  //         command: `initAutofillOverlayPort`,
  //         portName:
  //           elementName === "list"
  //             ? AutofillOverlayPort.ListMessageConnector
  //             : AutofillOverlayPort.ButtonMessageConnector,
  //       });
  //       resolve();
  //     });
  //   });
  // }

  /**
   * Posts a window message to the parent window.
   *
   * @param message - The message to post
   */
  protected postMessageToConnector(message: AutofillOverlayPageElementWindowMessage) {
    globalThis.parent.postMessage({ portKey: this.portKey, ...message }, "*");

    // this.messageConnectorIframe.contentWindow.postMessage(
    //   { portKey: this.portKey, ...message },
    //   "*",
    // );
  }

  /**
   * Gets a translation from the translations object.
   *
   * @param key
   * @protected
   */
  protected getTranslation(key: string): string {
    return this.translations[key] || "";
  }

  /**
   * Sets up global listeners for the window message, window blur, and
   * document keydown events.
   *
   * @param windowMessageHandlers - The window message handlers to use
   */
  protected setupGlobalListeners(windowMessageHandlers: WindowMessageHandlers) {
    this.windowMessageHandlers = windowMessageHandlers;

    globalThis.addEventListener(EVENTS.MESSAGE, this.handleWindowMessage);
    globalThis.addEventListener(EVENTS.BLUR, this.handleWindowBlurEvent);
    globalThis.document.addEventListener(EVENTS.KEYDOWN, this.handleDocumentKeyDownEvent);
  }

  /**
   * Handles window messages from the parent window.
   *
   * @param event - The window message event
   */
  private handleWindowMessage = (event: MessageEvent) => {
    if (!this.windowMessageHandlers) {
      return;
    }

    if (!this.messageOrigin) {
      this.messageOrigin = event.origin;
    }

    if (event.origin !== this.messageOrigin) {
      return;
    }

    const message = event?.data;
    const handler = this.windowMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    handler({ message });
  };

  /**
   * Handles the window blur event.
   */
  private handleWindowBlurEvent = () => {
    this.postMessageToConnector({ command: "overlayPageBlurred" });
  };

  /**
   * Handles the document keydown event. Facilitates redirecting the
   * user focus in the right direction out of the overlay. Also facilitates
   * closing the overlay when the user presses the Escape key.
   *
   * @param event - The document keydown event
   */
  private handleDocumentKeyDownEvent = (event: KeyboardEvent) => {
    const listenedForKeys = new Set(["Tab", "Escape"]);
    if (!listenedForKeys.has(event.code)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.code === "Tab") {
      this.redirectOverlayFocusOutMessage(
        event.shiftKey ? RedirectFocusDirection.Previous : RedirectFocusDirection.Next,
      );
      return;
    }

    this.redirectOverlayFocusOutMessage(RedirectFocusDirection.Current);
  };

  /**
   * Redirects the overlay focus out to the previous element on KeyDown of the `Tab+Shift` keys.
   * Redirects the overlay focus out to the next element on KeyDown of the `Tab` key.
   * Redirects the overlay focus out to the current element on KeyDown of the `Escape` key.
   *
   * @param direction - The direction to redirect the focus out
   */
  private redirectOverlayFocusOutMessage(direction: string) {
    this.postMessageToConnector({ command: "redirectOverlayFocusOut", direction });
  }
}

export default AutofillOverlayPageElement;
