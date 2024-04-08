import { AutofillExtensionMessage } from "../../content/abstractions/autofill-init";
import {
  sendExtensionMessage,
  generateRandomCustomElementName,
  setElementStyles,
} from "../../utils";
import { AutofillOverlayElement } from "../../utils/autofill-overlay.enum";
import {
  InlineMenuExtensionMessageHandlers,
  InlineMenuElements as InlineMenuElementsInterface,
} from "../abstractions/inline-menu-elements";
import AutofillOverlayButtonIframe from "../iframe-content/autofill-overlay-button-iframe";
import AutofillOverlayListIframe from "../iframe-content/autofill-overlay-list-iframe";

export class AutofillOverlayInlineMenuElements implements InlineMenuElementsInterface {
  private readonly sendExtensionMessage = sendExtensionMessage;
  private readonly generateRandomCustomElementName = generateRandomCustomElementName;
  private readonly setElementStyles = setElementStyles;
  private isFirefoxBrowser =
    globalThis.navigator.userAgent.indexOf(" Firefox/") !== -1 ||
    globalThis.navigator.userAgent.indexOf(" Gecko/") !== -1;
  private buttonElement: HTMLElement;
  private listElement: HTMLElement;
  private isButtonVisible = false;
  private isListVisible = false;
  private inlineMenuElementsMutationObserver: MutationObserver;
  private bodyElementMutationObserver: MutationObserver;
  private documentElementMutationObserver: MutationObserver;
  private mutationObserverIterations = 0;
  private mutationObserverIterationsResetTimeout: number | NodeJS.Timeout;
  private readonly customElementDefaultStyles: Partial<CSSStyleDeclaration> = {
    all: "initial",
    position: "fixed",
    display: "block",
    zIndex: "2147483647",
  };
  private readonly _extensionMessageHandlers: InlineMenuExtensionMessageHandlers = {
    closeInlineMenu: ({ message }) => this.removeInlineMenu(message),
    appendInlineMenuElementsToDom: ({ message }) => this.appendInlineMenuElements(message),
    toggleInlineMenuHidden: ({ message }) =>
      this.toggleInlineMenuHidden(message.isInlineMenuHidden),
    checkIsInlineMenuButtonVisible: () => this.isInlineMenuButtonVisible(),
    checkIsInlineMenuListVisible: () => this.isInlineMenuListVisible(),
  };

  constructor() {
    this.setupMutationObserver();
  }

  get extensionMessageHandlers() {
    return this._extensionMessageHandlers;
  }

  isElementInlineMenu(element: HTMLElement) {
    return element === this.buttonElement || element === this.listElement;
  }

  private isInlineMenuButtonVisible() {
    return this.isButtonVisible;
  }

  private isInlineMenuListVisible() {
    return this.isListVisible;
  }

  /**
   * Sends a message that facilitates hiding the inline menu elements.
   *
   * @param isHidden - Indicates if the inline menu elements should be hidden.
   */
  private toggleInlineMenuHidden(isHidden: boolean) {
    this.isButtonVisible = !!this.buttonElement && !isHidden;
    this.isListVisible = !!this.listElement && !isHidden;
  }

  /**
   * Removes the autofill inline menu from the page. This will initially
   * unobserve the body element to ensure the mutation observer no
   * longer triggers.
   */
  private removeInlineMenu = (message?: AutofillExtensionMessage) => {
    if (message?.overlayElement === AutofillOverlayElement.Button) {
      this.removeInlineMenuButton();
      return;
    }

    if (message?.overlayElement === AutofillOverlayElement.List) {
      this.removeInlineMenuList();
      return;
    }

    this.removeBodyElementObserver();
    this.removeInlineMenuButton();
    this.removeInlineMenuList();
  };

  /**
   * Removes the inline menu button from the DOM if it is currently present. Will
   * also remove the inline menu reposition event listeners.
   */
  private removeInlineMenuButton() {
    if (!this.buttonElement) {
      return;
    }

    this.buttonElement.remove();

    this.isButtonVisible = false;

    void this.sendExtensionMessage("autofillOverlayElementClosed", {
      overlayElement: AutofillOverlayElement.Button,
    });
  }

  /**
   * Removes the inline menu list from the DOM if it is currently present.
   */
  private removeInlineMenuList() {
    if (!this.listElement) {
      return;
    }

    this.listElement.remove();

    this.isListVisible = false;

    void this.sendExtensionMessage("autofillOverlayElementClosed", {
      overlayElement: AutofillOverlayElement.List,
    });
  }

  /**
   * Updates the position of both the inline menu button and inline menu list.
   */
  private async appendInlineMenuElements({ overlayElement }: AutofillExtensionMessage) {
    if (overlayElement === AutofillOverlayElement.Button) {
      return this.appendButtonElement();
    }

    return this.appendListElement();
  }

  /**
   * Updates the position of the inline menu button.
   */
  private async appendButtonElement(): Promise<void> {
    if (!this.buttonElement) {
      this.createButton();
      this.updateCustomElementDefaultStyles(this.buttonElement);
    }

    if (!this.isButtonVisible) {
      this.appendInlineMenuElementToBody(this.buttonElement);
      this.isButtonVisible = true;
    }
  }

  /**
   * Updates the position of the inline menu list.
   */
  private async appendListElement(): Promise<void> {
    if (!this.listElement) {
      this.createList();
      this.updateCustomElementDefaultStyles(this.listElement);
    }

    if (!this.isListVisible) {
      this.appendInlineMenuElementToBody(this.listElement);
      this.isListVisible = true;
    }
  }

  /**
   * Appends the inline menu element to the body element. This method will also
   * observe the body element to ensure that the inline menu element is not
   * interfered with by any DOM changes.
   *
   * @param element - The inline menu element to append to the body element.
   */
  private appendInlineMenuElementToBody(element: HTMLElement) {
    this.observeBodyElement();
    globalThis.document.body.appendChild(element);
  }

  /**
   * Creates the autofill inline menu button element. Will not attempt
   * to create the element if it already exists in the DOM.
   */
  private createButton() {
    if (this.buttonElement) {
      return;
    }

    if (this.isFirefoxBrowser) {
      this.buttonElement = globalThis.document.createElement("div");
      new AutofillOverlayButtonIframe(this.buttonElement);

      return;
    }

    const customElementName = this.generateRandomCustomElementName();
    globalThis.customElements?.define(
      customElementName,
      class extends HTMLElement {
        constructor() {
          super();
          new AutofillOverlayButtonIframe(this);
        }
      },
    );
    this.buttonElement = globalThis.document.createElement(customElementName);
  }

  /**
   * Creates the autofill inline menu list element. Will not attempt
   * to create the element if it already exists in the DOM.
   */
  private createList() {
    if (this.listElement) {
      return;
    }

    if (this.isFirefoxBrowser) {
      this.listElement = globalThis.document.createElement("div");
      new AutofillOverlayListIframe(this.listElement);

      return;
    }

    const customElementName = this.generateRandomCustomElementName();
    globalThis.customElements?.define(
      customElementName,
      class extends HTMLElement {
        constructor() {
          super();
          new AutofillOverlayListIframe(this);
        }
      },
    );
    this.listElement = globalThis.document.createElement(customElementName);
  }

  /**
   * Updates the default styles for the custom element. This method will
   * remove any styles that are added to the custom element by other methods.
   *
   * @param element - The custom element to update the default styles for.
   */
  private updateCustomElementDefaultStyles(element: HTMLElement) {
    this.unobserveCustomElements();

    this.setElementStyles(element, this.customElementDefaultStyles, true);

    this.observeCustomElements();
  }

  /**
   * Sets up mutation observers for the inline menu elements, the body element, and
   * the document element. The mutation observers are used to remove any styles that
   * are added to the inline menu elements by the website. They are also used to ensure
   * that the inline menu elements are always present at the bottom of the body element.
   */
  private setupMutationObserver = () => {
    this.inlineMenuElementsMutationObserver = new MutationObserver(
      this.handleInlineMenuElementMutationObserverUpdate,
    );

    this.bodyElementMutationObserver = new MutationObserver(
      this.handleBodyElementMutationObserverUpdate,
    );
  };

  /**
   * Sets up mutation observers to verify that the inline menu
   * elements are not modified by the website.
   */
  private observeCustomElements() {
    if (this.buttonElement) {
      this.inlineMenuElementsMutationObserver?.observe(this.buttonElement, {
        attributes: true,
      });
    }

    if (this.listElement) {
      this.inlineMenuElementsMutationObserver?.observe(this.listElement, { attributes: true });
    }
  }

  /**
   * Disconnects the mutation observers that are used to verify that the inline menu
   * elements are not modified by the website.
   */
  private unobserveCustomElements() {
    this.inlineMenuElementsMutationObserver?.disconnect();
  }

  /**
   * Sets up a mutation observer for the body element. The mutation observer is used
   * to ensure that the inline menu elements are always present at the bottom of the
   * body element.
   */
  private observeBodyElement() {
    this.bodyElementMutationObserver?.observe(globalThis.document.body, { childList: true });
  }

  /**
   * Disconnects the mutation observer for the body element.
   */
  private removeBodyElementObserver() {
    this.bodyElementMutationObserver?.disconnect();
  }

  /**
   * Handles the mutation observer update for the inline menu elements. This method will
   * remove any attributes or styles that might be added to the inline menu elements by
   * a separate process within the website where this script is injected.
   *
   * @param mutationRecord - The mutation record that triggered the update.
   */
  private handleInlineMenuElementMutationObserverUpdate = (mutationRecord: MutationRecord[]) => {
    if (this.isTriggeringExcessiveMutationObserverIterations()) {
      return;
    }

    for (let recordIndex = 0; recordIndex < mutationRecord.length; recordIndex++) {
      const record = mutationRecord[recordIndex];
      if (record.type !== "attributes") {
        continue;
      }

      const element = record.target as HTMLElement;
      if (record.attributeName !== "style") {
        this.removeModifiedElementAttributes(element);

        continue;
      }

      element.removeAttribute("style");
      this.updateCustomElementDefaultStyles(element);
    }
  };

  /**
   * Removes all elements from a passed inline menu
   * element except for the style attribute.
   *
   * @param element - The element to remove the attributes from.
   */
  private removeModifiedElementAttributes(element: HTMLElement) {
    const attributes = Array.from(element.attributes);
    for (let attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++) {
      const attribute = attributes[attributeIndex];
      if (attribute.name === "style") {
        continue;
      }

      element.removeAttribute(attribute.name);
    }
  }

  /**
   * Handles the mutation observer update for the body element. This method will
   * ensure that the inline menu elements are always present at the bottom of the
   * body element.
   */
  private handleBodyElementMutationObserverUpdate = () => {
    if (
      (!this.buttonElement && !this.listElement) ||
      this.isTriggeringExcessiveMutationObserverIterations()
    ) {
      return;
    }

    const lastChild = globalThis.document.body.lastElementChild;
    const secondToLastChild = lastChild?.previousElementSibling;
    const lastChildIsInlineMenuList = lastChild === this.listElement;
    const lastChildIsInlineMenuButton = lastChild === this.buttonElement;
    const secondToLastChildIsInlineMenuButton = secondToLastChild === this.buttonElement;

    if (
      (lastChildIsInlineMenuList && secondToLastChildIsInlineMenuButton) ||
      (lastChildIsInlineMenuButton && !this.isListVisible)
    ) {
      return;
    }

    if (
      (lastChildIsInlineMenuList && !secondToLastChildIsInlineMenuButton) ||
      (lastChildIsInlineMenuButton && this.isListVisible)
    ) {
      globalThis.document.body.insertBefore(this.buttonElement, this.listElement);
      return;
    }

    globalThis.document.body.insertBefore(lastChild, this.buttonElement);
  };

  /**
   * Identifies if the mutation observer is triggering excessive iterations.
   * Will trigger a blur of the most recently focused field and remove the
   * autofill inline menu if any set mutation observer is triggering
   * excessive iterations.
   */
  private isTriggeringExcessiveMutationObserverIterations() {
    if (this.mutationObserverIterationsResetTimeout) {
      clearTimeout(this.mutationObserverIterationsResetTimeout);
    }

    this.mutationObserverIterations++;
    this.mutationObserverIterationsResetTimeout = setTimeout(
      () => (this.mutationObserverIterations = 0),
      2000,
    );

    if (this.mutationObserverIterations > 100) {
      clearTimeout(this.mutationObserverIterationsResetTimeout);
      this.mutationObserverIterations = 0;
      void this.sendExtensionMessage("blurMostRecentOverlayField");
      this.removeInlineMenu();

      return true;
    }

    return false;
  }
  destroy() {
    this.documentElementMutationObserver?.disconnect();
    this.removeInlineMenu();
  }
}
