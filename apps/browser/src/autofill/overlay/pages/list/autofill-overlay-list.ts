import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { EVENTS } from "../../../constants";
import { lockIcon } from "../../../utils/svg-icons";
import { buildSvgDomElement } from "../../../utils/utils";
import {
  InitAutofillOverlayListMessage,
  OverlayListWindowMessageHandlers,
} from "../../abstractions/autofill-overlay-list";
import AutofillOverlayPageElement from "../shared/autofill-overlay-page-element";

class AutofillOverlayList extends AutofillOverlayPageElement {
  private overlayListContainer: HTMLDivElement;
  private resizeObserver: ResizeObserver;
  private readonly overlayListWindowMessageHandlers: OverlayListWindowMessageHandlers = {
    initAutofillOverlayList: ({ message }) => this.initAutofillOverlayList(message),
    checkAutofillOverlayListFocused: () => this.checkOverlayListFocused(),
    focusOverlayList: () => this.focusOverlayList(),
  };

  constructor() {
    super();

    this.setupOverlayListGlobalListeners();
  }

  /**
   * Initializes the overlay list and updates the list items with the passed ciphers.
   * If the auth status is not `Unlocked`, the locked overlay is built.
   *
   * @param translations - The translations to use for the overlay list.
   * @param styleSheetUrl - The URL of the stylesheet to use for the overlay list.
   * @param theme - The theme to use for the overlay list.
   * @param authStatus - The current authentication status.
   * @param ciphers - The ciphers to display in the overlay list.
   */
  private async initAutofillOverlayList({
    translations,
    styleSheetUrl,
    theme,
    authStatus,
  }: InitAutofillOverlayListMessage) {
    const linkElement = this.initOverlayPage("button", styleSheetUrl, translations);

    globalThis.document.documentElement.classList.add(theme);

    this.overlayListContainer = globalThis.document.createElement("div");
    this.overlayListContainer.classList.add("overlay-list-container", theme);
    this.overlayListContainer.setAttribute("role", "dialog");
    this.overlayListContainer.setAttribute("aria-modal", "true");
    this.resizeObserver.observe(this.overlayListContainer);

    this.shadowDom.append(linkElement, this.overlayListContainer);

    if (authStatus === AuthenticationStatus.Unlocked) {
      return;
    }

    this.buildLockedOverlay();
  }

  /**
   * Builds the locked overlay, which is displayed when the user is not authenticated.
   * Facilitates the ability to unlock the extension from the overlay.
   */
  private buildLockedOverlay() {
    const lockedOverlay = globalThis.document.createElement("div");
    lockedOverlay.id = "locked-overlay-description";
    lockedOverlay.classList.add("locked-overlay", "overlay-list-message");
    lockedOverlay.textContent = this.getTranslation("unlockYourAccount");

    const unlockButtonElement = globalThis.document.createElement("button");
    unlockButtonElement.id = "unlock-button";
    unlockButtonElement.tabIndex = -1;
    unlockButtonElement.classList.add("unlock-button", "overlay-list-button");
    unlockButtonElement.textContent = this.getTranslation("unlockAccount");
    unlockButtonElement.setAttribute(
      "aria-label",
      `${this.getTranslation("unlockAccount")}, ${this.getTranslation("opensInANewWindow")}`
    );
    unlockButtonElement.prepend(buildSvgDomElement(lockIcon));
    unlockButtonElement.addEventListener(EVENTS.CLICK, this.handleUnlockButtonClick);

    const overlayListButtonContainer = globalThis.document.createElement("div");
    overlayListButtonContainer.classList.add("overlay-list-button-container");
    overlayListButtonContainer.appendChild(unlockButtonElement);

    this.overlayListContainer.append(lockedOverlay, overlayListButtonContainer);
  }

  /**
   * Handles the click event for the unlock button.
   * Sends a message to the parent window to unlock the vault.
   */
  private handleUnlockButtonClick = () => {
    this.postMessageToParent({ command: "unlockVault" });
  };

  /**
   * Validates whether the overlay list iframe is currently focused.
   * If not focused, will check if the button element is focused.
   */
  private checkOverlayListFocused() {
    if (globalThis.document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "checkAutofillOverlayButtonFocused" });
  }

  /**
   * Focuses the overlay list iframe. The element that receives focus is
   * determined by the presence of the unlock button, new item button, or
   * the first cipher button.
   */
  private focusOverlayList() {
    const unlockButtonElement = this.overlayListContainer.querySelector(
      "#unlock-button"
    ) as HTMLElement;
    if (unlockButtonElement) {
      unlockButtonElement.focus();
    }
  }

  /**
   * Sets up the global listeners for the overlay list iframe.
   */
  private setupOverlayListGlobalListeners() {
    this.setupGlobalListeners(this.overlayListWindowMessageHandlers);

    this.resizeObserver = new ResizeObserver(this.handleResizeObserver);
  }

  /**
   * Handles the resize observer event. Facilitates updating the height of the
   * overlay list iframe when the height of the list changes.
   *
   * @param entries - The resize observer entries.
   */
  private handleResizeObserver = (entries: ResizeObserverEntry[]) => {
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
      const entry = entries[entryIndex];
      if (entry.target !== this.overlayListContainer) {
        continue;
      }

      const { height } = entry.contentRect;
      this.postMessageToParent({
        command: "updateAutofillOverlayListHeight",
        styles: { height: `${height}px` },
      });
      break;
    }
  };
}

export default AutofillOverlayList;
