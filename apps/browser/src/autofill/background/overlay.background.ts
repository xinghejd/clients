import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { ThemeType } from "@bitwarden/common/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

import { openUnlockPopout } from "../../auth/popup/utils/auth-popout-window";
import LockedVaultPendingNotificationsItem from "../../background/models/lockedVaultPendingNotificationsItem";
import { BrowserApi } from "../../platform/browser/browser-api";
import { AutofillOverlayElement, AutofillOverlayPort } from "../utils/autofill-overlay.enum";

import {
  FocusedFieldData,
  OverlayBackgroundExtensionMessageHandlers,
  OverlayButtonPortMessageHandlers,
  OverlayListPortMessageHandlers,
  OverlayBackgroundExtensionMessage,
  OverlayPortMessage,
} from "./abstractions/overlay.background";

class OverlayBackground {
  private readonly openUnlockPopout = openUnlockPopout;
  private overlayVisibility: number;
  private userAuthStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private overlayButtonPort: chrome.runtime.Port;
  private overlayListPort: chrome.runtime.Port;
  private focusedFieldData: FocusedFieldData;
  private overlayPageTranslations: Record<string, string>;
  private readonly extensionMessageHandlers: OverlayBackgroundExtensionMessageHandlers = {
    openAutofillOverlay: () => this.openOverlay(false),
    autofillOverlayElementClosed: ({ message }) => this.overlayElementClosed(message),
    getAutofillOverlayVisibility: () => this.getOverlayVisibility(),
    checkAutofillOverlayFocused: () => this.checkOverlayFocused(),
    focusAutofillOverlayList: () => this.focusOverlayList(),
    updateAutofillOverlayPosition: ({ message }) => this.updateOverlayPosition(message),
    updateAutofillOverlayHidden: ({ message }) => this.updateOverlayHidden(message),
    updateFocusedFieldData: ({ message }) => this.setFocusedFieldData(message),
    unlockCompleted: ({ message }) => this.unlockCompleted(message),
  };
  private readonly overlayButtonPortMessageHandlers: OverlayButtonPortMessageHandlers = {
    overlayButtonClicked: ({ port }) => this.handleOverlayButtonClicked(port),
    closeAutofillOverlay: ({ port }) => this.closeOverlay(port),
    overlayPageBlurred: () => this.checkOverlayListFocused(),
    redirectOverlayFocusOut: ({ message, port }) => this.redirectOverlayFocusOut(message, port),
  };
  private readonly overlayListPortMessageHandlers: OverlayListPortMessageHandlers = {
    checkAutofillOverlayButtonFocused: () => this.checkOverlayButtonFocused(),
    overlayPageBlurred: () => this.checkOverlayButtonFocused(),
    unlockVault: ({ port }) => this.unlockVault(port),
    redirectOverlayFocusOut: ({ message, port }) => this.redirectOverlayFocusOut(message, port),
  };

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private stateService: StateService,
    private i18nService: I18nService
  ) {}

  /**
   * Sets up the extension message listeners and gets the settings for the
   * overlay's visibility and the user's authentication status.
   */
  async init() {
    this.setupExtensionMessageListeners();
    await this.getOverlayVisibility();
    await this.getAuthStatus();
  }

  /**
   * Checks if the overlay is focused. Will check the overlay list
   * if it is open, otherwise it will check the overlay button.
   */
  private checkOverlayFocused() {
    if (this.overlayListPort) {
      this.checkOverlayListFocused();

      return;
    }

    this.checkOverlayButtonFocused();
  }

  /**
   * Posts a message to the overlay button iframe to check if it is focused.
   */
  private checkOverlayButtonFocused() {
    this.overlayButtonPort?.postMessage({ command: "checkAutofillOverlayButtonFocused" });
  }

  /**
   * Posts a message to the overlay list iframe to check if it is focused.
   */
  private checkOverlayListFocused() {
    this.overlayListPort?.postMessage({ command: "checkAutofillOverlayListFocused" });
  }

  /**
   * Sends a message to the sender tab to close the autofill overlay.
   *
   * @param sender - The sender of the port message
   */
  private closeOverlay({ sender }: chrome.runtime.Port) {
    BrowserApi.tabSendMessage(sender.tab, { command: "closeAutofillOverlay" });
  }

  /**
   * Handles cleanup when an overlay element is closed. Disconnects
   * the list and button ports and sets them to null.
   *
   * @param overlayElement - The overlay element that was closed, either the list or button
   */
  private overlayElementClosed({ overlayElement }: OverlayBackgroundExtensionMessage) {
    if (overlayElement === AutofillOverlayElement.Button) {
      this.overlayButtonPort?.disconnect();
      this.overlayButtonPort = null;

      return;
    }

    this.overlayListPort?.disconnect();
    this.overlayListPort = null;
  }

  /**
   * Updates the position of either the overlay list or button. The position
   * is based on the focused field's position and dimensions.
   *
   * @param overlayElement - The overlay element to update, either the list or button
   */
  private updateOverlayPosition({ overlayElement }: { overlayElement?: string }) {
    if (!overlayElement) {
      return;
    }

    if (overlayElement === AutofillOverlayElement.Button) {
      this.overlayButtonPort?.postMessage({
        command: "updateIframePosition",
        styles: this.getOverlayButtonPosition(),
      });

      return;
    }

    this.overlayListPort?.postMessage({
      command: "updateIframePosition",
      styles: this.getOverlayListPosition(),
    });
  }

  /**
   * Gets the position of the focused field and calculates the position
   * of the overlay button based on the focused field's position and dimensions.
   */
  private getOverlayButtonPosition() {
    if (!this.focusedFieldData) {
      return;
    }

    const { top, left, width, height } = this.focusedFieldData.focusedFieldRects;
    const { paddingRight, paddingLeft } = this.focusedFieldData.focusedFieldStyles;
    const elementOffset = height * 0.37;
    const elementHeight = height - elementOffset;
    const elementTopPosition = top + elementOffset / 2;
    let elementLeftPosition = left + width - height + elementOffset / 2;

    const fieldPaddingRight = parseInt(paddingRight, 10);
    const fieldPaddingLeft = parseInt(paddingLeft, 10);
    if (fieldPaddingRight > fieldPaddingLeft) {
      elementLeftPosition = left + width - height - (fieldPaddingRight - elementOffset + 2);
    }

    return {
      top: `${Math.round(elementTopPosition)}px`,
      left: `${Math.round(elementLeftPosition)}px`,
      height: `${Math.round(elementHeight)}px`,
      width: `${Math.round(elementHeight)}px`,
    };
  }

  /**
   * Gets the position of the focused field and calculates the position
   * of the overlay list based on the focused field's position and dimensions.
   */
  private getOverlayListPosition() {
    if (!this.focusedFieldData) {
      return;
    }

    const { top, left, width, height } = this.focusedFieldData.focusedFieldRects;
    return {
      width: `${Math.round(width)}px`,
      top: `${Math.round(top + height)}px`,
      left: `${Math.round(left)}px`,
    };
  }

  /**
   * Sets the focused field data to the data passed in the extension message.
   *
   * @param focusedFieldData - Contains the rects and styles of the focused field.
   */
  private setFocusedFieldData({ focusedFieldData }: OverlayBackgroundExtensionMessage) {
    this.focusedFieldData = focusedFieldData;
  }

  /**
   * Updates the overlay's visibility based on the display property passed in the extension message.
   *
   * @param display - The display property of the overlay, either "block" or "none"
   */
  private updateOverlayHidden({ display }: OverlayBackgroundExtensionMessage) {
    if (!display) {
      return;
    }

    const portMessage = { command: "updateOverlayHidden", styles: { display } };

    this.overlayButtonPort?.postMessage(portMessage);
    this.overlayListPort?.postMessage(portMessage);
  }

  /**
   * Sends a message to the currently active tab to open the autofill overlay.
   *
   * @param isFocusingFieldElement - Identifies whether the field element should be focused when the overlay is opened
   * @param isOpeningFullOverlay - Identifies whether the full overlay should be forced open regardless of other states
   */
  private async openOverlay(isFocusingFieldElement = false, isOpeningFullOverlay = false) {
    const currentTab = await BrowserApi.getTabFromCurrentWindowId();

    await BrowserApi.tabSendMessageData(currentTab, "openAutofillOverlay", {
      isFocusingFieldElement,
      isOpeningFullOverlay,
      authStatus: await this.getAuthStatus(),
    });
  }

  /**
   * Gets the overlay's visibility setting from the settings service.
   */
  private async getOverlayVisibility(): Promise<number> {
    this.overlayVisibility = await this.settingsService.getAutoFillOverlayVisibility();

    return this.overlayVisibility;
  }

  /**
   * Gets the user's authentication status from the auth service. If the user's
   * authentication status has changed, the overlay button's authentication status
   * will be updated and the overlay list's ciphers will be updated.
   */
  private async getAuthStatus() {
    const formerAuthStatus = this.userAuthStatus;
    this.userAuthStatus = await this.authService.getAuthStatus();

    if (
      this.userAuthStatus !== formerAuthStatus &&
      this.userAuthStatus === AuthenticationStatus.Unlocked
    ) {
      this.updateOverlayButtonAuthStatus();
    }

    return this.userAuthStatus;
  }

  /**
   * Gets the currently set theme for the user.
   */
  private async getCurrentTheme() {
    const theme = await this.stateService.getTheme();

    if (theme !== ThemeType.System) {
      return theme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ThemeType.Dark
      : ThemeType.Light;
  }

  /**
   * Sends a message to the overlay button to update its authentication status.
   */
  private updateOverlayButtonAuthStatus() {
    this.overlayButtonPort?.postMessage({
      command: "updateOverlayButtonAuthStatus",
      authStatus: this.userAuthStatus,
    });
  }

  /**
   * Handles the overlay button being clicked. If the user is not authenticated,
   * the vault will be unlocked. If the user is authenticated, the overlay will
   * be opened.
   *
   * @param port - The port of the overlay button
   */
  private handleOverlayButtonClicked(port: chrome.runtime.Port) {
    if (this.userAuthStatus !== AuthenticationStatus.Unlocked) {
      this.unlockVault(port);
      return;
    }

    this.openOverlay(false, true);
  }

  /**
   * Facilitates opening the unlock popout window.
   *
   * @param port - The port of the overlay list
   */
  private async unlockVault(port: chrome.runtime.Port) {
    const { sender } = port;

    this.closeOverlay(port);
    const retryMessage: LockedVaultPendingNotificationsItem = {
      commandToRetry: { msg: { command: "openAutofillOverlay" }, sender },
      target: "overlay.background",
    };
    await BrowserApi.tabSendMessageData(
      sender.tab,
      "addToLockedVaultPendingNotifications",
      retryMessage
    );
    await this.openUnlockPopout(sender.tab, true);
  }

  /**
   * Facilitates redirecting focus to the overlay list.
   */
  private focusOverlayList() {
    this.overlayListPort?.postMessage({ command: "focusOverlayList" });
  }

  /**
   * Updates the authentication status for the user and opens the overlay if
   * a followup command is present in the message.
   *
   * @param message - Extension message received from the `unlockCompleted` command
   */
  private async unlockCompleted(message: OverlayBackgroundExtensionMessage) {
    await this.getAuthStatus();

    if (message.data?.commandToRetry?.msg?.command === "openAutofillOverlay") {
      await this.openOverlay(true);
    }
  }

  /**
   * Gets the translations for the overlay page.
   */
  private getTranslations() {
    if (!this.overlayPageTranslations) {
      this.overlayPageTranslations = {
        locale: BrowserApi.getUILanguage(),
        opensInANewWindow: this.i18nService.translate("opensInANewWindow"),
        buttonPageTitle: this.i18nService.translate("bitwardenOverlayButton"),
        toggleBitwardenVaultOverlay: this.i18nService.translate("toggleBitwardenVaultOverlay"),
        listPageTitle: this.i18nService.translate("bitwardenVault"),
        unlockYourAccount: this.i18nService.translate("unlockYourAccountToViewMatchingLogins"),
        unlockAccount: this.i18nService.translate("unlockAccount"),
        fillCredentialsFor: this.i18nService.translate("fillCredentialsFor"),
        partialUsername: this.i18nService.translate("partialUsername"),
        view: this.i18nService.translate("view"),
        noItemsToShow: this.i18nService.translate("noItemsToShow"),
        newItem: this.i18nService.translate("newItem"),
        addNewVaultItem: this.i18nService.translate("addNewVaultItem"),
      };
    }

    return this.overlayPageTranslations;
  }

  /**
   * Facilitates redirecting focus out of one of the
   *  overlay elements to elements on the page.
   *
   * @param direction - The direction to redirect focus to (either "next", "previous" or "current)
   * @param sender - The sender of the port message
   */
  private redirectOverlayFocusOut(
    { direction }: OverlayPortMessage,
    { sender }: chrome.runtime.Port
  ) {
    if (!direction) {
      return;
    }

    BrowserApi.tabSendMessageData(sender.tab, "redirectOverlayFocusOut", { direction });
  }

  /**
   * Sets up the extension message listeners for the overlay.
   */
  private setupExtensionMessageListeners() {
    chrome.runtime.onMessage.addListener(this.handleExtensionMessage);
    chrome.runtime.onConnect.addListener(this.handlePortOnConnect);
  }

  /**
   * Handles extension messages sent to the extension background.
   *
   * @param message - The message received from the extension
   * @param sender - The sender of the message
   * @param sendResponse - The response to send back to the sender
   */
  private handleExtensionMessage = (
    message: OverlayBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    const messageResponse = handler({ message, sender });
    if (!messageResponse) {
      return;
    }

    Promise.resolve(messageResponse).then((response) => sendResponse(response));
    return true;
  };

  /**
   * Handles the connection of a port to the extension background.
   *
   * @param port - The port that connected to the extension background
   */
  private handlePortOnConnect = async (port: chrome.runtime.Port) => {
    const isOverlayListPort = port.name === AutofillOverlayPort.List;

    if (isOverlayListPort) {
      this.overlayListPort = port;
    } else {
      this.overlayButtonPort = port;
    }

    port.onMessage.addListener(this.handleOverlayElementPortMessage);
    port.postMessage({
      command: `initAutofillOverlay${isOverlayListPort ? "List" : "Button"}`,
      authStatus: await this.getAuthStatus(),
      styleSheetUrl: chrome.runtime.getURL(`overlay/${isOverlayListPort ? "list" : "button"}.css`),
      theme: `theme_${await this.getCurrentTheme()}`,
      translations: this.getTranslations(),
    });
    this.updateOverlayPosition({
      overlayElement: isOverlayListPort
        ? AutofillOverlayElement.List
        : AutofillOverlayElement.Button,
    });
  };

  /**
   * Handles messages sent to the overlay list or button ports.
   *
   * @param message - The message received from the port
   * @param port - The port that sent the message
   */
  private handleOverlayElementPortMessage = (
    message: OverlayBackgroundExtensionMessage,
    port: chrome.runtime.Port
  ) => {
    const command = message?.command;
    let handler: CallableFunction | undefined;

    if (port.name === AutofillOverlayPort.Button) {
      handler = this.overlayButtonPortMessageHandlers[command];
    }

    if (port.name === AutofillOverlayPort.List) {
      handler = this.overlayListPortMessageHandlers[command];
    }

    if (!handler) {
      return;
    }

    handler({ message, port });
  };
}

export default OverlayBackground;
