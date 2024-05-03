import { firstValueFrom } from "rxjs";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { SHOW_AUTOFILL_BUTTON } from "@bitwarden/common/autofill/constants";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { DomainSettingsService } from "@bitwarden/common/autofill/services/domain-settings.service";
import { InlineMenuVisibilitySetting } from "@bitwarden/common/autofill/types";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { ThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { buildCipherIcon } from "@bitwarden/common/vault/icon/build-cipher-icon";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { LoginUriView } from "@bitwarden/common/vault/models/view/login-uri.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";

import { openUnlockPopout } from "../../auth/popup/utils/auth-popout-window";
import { BrowserApi } from "../../platform/browser/browser-api";
import {
  openAddEditVaultItemPopout,
  openViewVaultItemPopout,
} from "../../vault/popup/utils/vault-popout-window";
import { AutofillOverlayElement, AutofillOverlayPort } from "../enums/autofill-overlay.enum";
import { AutofillService } from "../services/abstractions/autofill.service";
import { generateRandomChars } from "../utils";

import { LockedVaultPendingNotificationsData } from "./abstractions/notification.background";
import {
  FocusedFieldData,
  OverlayAddNewItemMessage,
  OverlayBackground as OverlayBackgroundInterface,
  OverlayBackgroundExtensionMessage,
  OverlayBackgroundExtensionMessageHandlers,
  InlineMenuButtonPortMessageHandlers,
  OverlayCipherData,
  InlineMenuListPortMessageHandlers,
  OverlayPortMessage,
  PageDetailsForTab,
  SubFrameOffsetData,
  SubFrameOffsetsForTab,
} from "./abstractions/overlay.background";

class OverlayBackground implements OverlayBackgroundInterface {
  private readonly openUnlockPopout = openUnlockPopout;
  private readonly openViewVaultItemPopout = openViewVaultItemPopout;
  private readonly openAddEditVaultItemPopout = openAddEditVaultItemPopout;
  private overlayLoginCiphers: Map<string, CipherView> = new Map();
  private pageDetailsForTab: PageDetailsForTab = {};
  private subFrameOffsetsForTab: SubFrameOffsetsForTab = {};
  private updateInlineMenuPositionTimeout: number | NodeJS.Timeout;
  private userAuthStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private inlineMenuButtonPort: chrome.runtime.Port;
  private inlineMenuListPort: chrome.runtime.Port;
  private portKeyForTab: Record<number, string> = {};
  private focusedFieldData: FocusedFieldData;
  private isFieldCurrentlyFocused: boolean = false;
  private isFieldCurrentlyFilling: boolean = false;
  private inlineMenuPageTranslations: Record<string, string>;
  private iconsServerUrl: string;
  private readonly extensionMessageHandlers: OverlayBackgroundExtensionMessageHandlers = {
    openAutofillInlineMenu: () => this.openInlineMenu(false),
    closeAutofillInlineMenu: ({ message, sender }) => this.closeInlineMenu(sender, message),
    autofillOverlayElementClosed: ({ message }) => this.overlayElementClosed(message),
    autofillOverlayAddNewVaultItem: ({ message, sender }) => this.addNewVaultItem(message, sender),
    getAutofillInlineMenuVisibility: () => this.getInlineMenuVisibility(),
    checkAutofillInlineMenuFocused: () => this.checkInlineMenuFocused(),
    focusAutofillInlineMenuList: () => this.focusInlineMenuList(),
    updateAutofillInlineMenuPosition: ({ message, sender }) =>
      this.updateInlineMenuPosition(message, sender),
    updateAutofillInlineMenuHidden: ({ message, sender }) =>
      this.updateInlineMenuHidden(message, sender),
    updateFocusedFieldData: ({ message, sender }) => this.setFocusedFieldData(message, sender),
    updateIsFieldCurrentlyFocused: ({ message }) => this.updateIsFieldCurrentlyFocused(message),
    checkIsFieldCurrentlyFocused: () => this.checkIsFieldCurrentlyFocused(),
    updateIsFieldCurrentlyFilling: ({ message }) => this.updateIsFieldCurrentlyFilling(message),
    checkIsFieldCurrentlyFilling: () => this.checkIsFieldCurrentlyFilling(),
    checkIsAutofillInlineMenuButtonVisible: ({ sender }) =>
      this.checkIsAutofillInlineMenuButtonVisible(sender),
    checkIsAutofillInlineMenuListVisible: ({ sender }) =>
      this.checkIsAutofillInlineMenuListVisible(sender),
    checkIsOverlayLoginCiphersPopulated: ({ sender }) =>
      this.checkIsOverlayLoginCiphersPopulated(sender),
    updateSubFrameData: ({ message, sender }) => this.updateSubFrameData(message, sender),
    rebuildSubFrameOffsets: ({ sender }) => this.rebuildSubFrameOffsets(sender),
    collectPageDetailsResponse: ({ message, sender }) => this.storePageDetails(message, sender),
    unlockCompleted: ({ message }) => this.unlockCompleted(message),
    addEditCipherSubmitted: () => this.updateOverlayCiphers(),
    deletedCipher: () => this.updateOverlayCiphers(),
  };
  private readonly inlineMenuButtonPortMessageHandlers: InlineMenuButtonPortMessageHandlers = {
    autofillInlineMenuButtonClicked: ({ port }) => this.handleInlineMenuButtonClicked(port),
    closeAutofillInlineMenu: ({ port }) => this.closeInlineMenu(port.sender),
    forceCloseAutofillInlineMenu: ({ port }) =>
      this.closeInlineMenu(port.sender, { forceCloseAutofillInlineMenu: true }),
    autofillInlineMenuBlurred: () => this.checkInlineMenuListFocused(),
    redirectAutofillInlineMenuFocusOut: ({ message, port }) =>
      this.redirectInlineMenuFocusOut(message, port),
    updateAutofillInlineMenuColorScheme: () => this.updateInlineMenuButtonColorScheme(),
  };
  private readonly inlineMenuListPortMessageHandlers: InlineMenuListPortMessageHandlers = {
    checkAutofillInlineMenuButtonFocused: () => this.checkInlineMenuButtonFocused(),
    forceCloseAutofillInlineMenu: ({ port }) =>
      this.closeInlineMenu(port.sender, { forceCloseAutofillInlineMenu: true }),
    autofillInlineMenuBlurred: () => this.checkInlineMenuButtonFocused(),
    unlockVault: ({ port }) => this.unlockVault(port),
    fillSelectedAutofillInlineMenuListItem: ({ message, port }) =>
      this.fillSelectedInlineMenuListItem(message, port),
    addNewVaultItem: ({ port }) => this.getNewVaultItemDetails(port),
    viewSelectedCipher: ({ message, port }) => this.viewSelectedCipher(message, port),
    redirectAutofillInlineMenuFocusOut: ({ message, port }) =>
      this.redirectInlineMenuFocusOut(message, port),
    updateAutofillInlineMenuListHeight: ({ message }) => this.updateInlineMenuListHeight(message),
  };

  constructor(
    private logService: LogService,
    private cipherService: CipherService,
    private autofillService: AutofillService,
    private authService: AuthService,
    private environmentService: EnvironmentService,
    private domainSettingsService: DomainSettingsService,
    private stateService: StateService,
    private autofillSettingsService: AutofillSettingsServiceAbstraction,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private themeStateService: ThemeStateService,
  ) {}

  /**
   * Sets up the extension message listeners and gets the settings for the
   * overlay's visibility and the user's authentication status.
   */
  async init() {
    this.setupExtensionMessageListeners();
    const env = await firstValueFrom(this.environmentService.environment$);
    this.iconsServerUrl = env.getIconsUrl();
    await this.getInlineMenuVisibility();
    await this.getAuthStatus();
  }

  /**
   * Removes cached page details for a tab
   * based on the passed tabId.
   *
   * @param tabId - Used to reference the page details of a specific tab
   */
  removePageDetails(tabId: number) {
    if (this.pageDetailsForTab[tabId]) {
      this.pageDetailsForTab[tabId].clear();
      delete this.pageDetailsForTab[tabId];
    }

    if (this.subFrameOffsetsForTab[tabId]) {
      this.subFrameOffsetsForTab[tabId].clear();
      delete this.subFrameOffsetsForTab[tabId];
    }

    if (this.portKeyForTab[tabId]) {
      delete this.portKeyForTab[tabId];
    }
  }

  /**
   * Updates the inline menu list's ciphers and sends the updated list to the inline menu list iframe.
   * Queries all ciphers for the given url, and sorts them by last used. Will not update the
   * list of ciphers if the extension is not unlocked.
   */
  async updateOverlayCiphers() {
    if (this.userAuthStatus !== AuthenticationStatus.Unlocked) {
      return;
    }

    const currentTab = await BrowserApi.getTabFromCurrentWindowId();
    if (!currentTab?.url) {
      return;
    }

    this.overlayLoginCiphers = new Map();
    const ciphersViews = (await this.cipherService.getAllDecryptedForUrl(currentTab.url)).sort(
      (a, b) => this.cipherService.sortCiphersByLastUsedThenName(a, b),
    );
    for (let cipherIndex = 0; cipherIndex < ciphersViews.length; cipherIndex++) {
      this.overlayLoginCiphers.set(`overlay-cipher-${cipherIndex}`, ciphersViews[cipherIndex]);
    }

    const ciphers = await this.getOverlayCipherData();
    this.inlineMenuListPort?.postMessage({
      command: "updateAutofillInlineMenuListCiphers",
      ciphers,
    });
  }

  /**
   * Strips out unnecessary data from the ciphers and returns an array of
   * objects that contain the cipher data needed for the inline menu list.
   */
  private async getOverlayCipherData(): Promise<OverlayCipherData[]> {
    const showFavicons = await firstValueFrom(this.domainSettingsService.showFavicons$);
    const overlayCiphersArray = Array.from(this.overlayLoginCiphers);
    const overlayCipherData = [];

    for (let cipherIndex = 0; cipherIndex < overlayCiphersArray.length; cipherIndex++) {
      const [overlayCipherId, cipher] = overlayCiphersArray[cipherIndex];

      overlayCipherData.push({
        id: overlayCipherId,
        name: cipher.name,
        type: cipher.type,
        reprompt: cipher.reprompt,
        favorite: cipher.favorite,
        icon: buildCipherIcon(this.iconsServerUrl, cipher, showFavicons),
        login: cipher.type === CipherType.Login ? { username: cipher.login.username } : null,
        card: cipher.type === CipherType.Card ? cipher.card.subTitle : null,
      });
    }

    return overlayCipherData;
  }

  /**
   * Handles aggregation of page details for a tab. Stores the page details
   * in association with the tabId of the tab that sent the message.
   *
   * @param message - Message received from the `collectPageDetailsResponse` command
   * @param sender - The sender of the message
   */
  private storePageDetails(
    message: OverlayBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    if (!this.portKeyForTab[sender.tab.id]) {
      this.portKeyForTab[sender.tab.id] = generateRandomChars(12);
    }

    const pageDetails = {
      frameId: sender.frameId,
      tab: sender.tab,
      details: message.details,
    };

    if (pageDetails.frameId !== 0 && pageDetails.details.fields.length) {
      void this.buildSubFrameOffsets(pageDetails.tab, pageDetails.frameId, pageDetails.details.url);
    }

    const pageDetailsMap = this.pageDetailsForTab[sender.tab.id];
    if (!pageDetailsMap) {
      this.pageDetailsForTab[sender.tab.id] = new Map([[sender.frameId, pageDetails]]);
      return;
    }

    pageDetailsMap.set(sender.frameId, pageDetails);
  }

  private updateSubFrameData(
    message: OverlayBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    const subFrameOffsetsForTab = this.subFrameOffsetsForTab[sender.tab.id];
    if (subFrameOffsetsForTab) {
      subFrameOffsetsForTab.set(message.subFrameData.frameId, message.subFrameData);
    }
  }

  private async buildSubFrameOffsets(tab: chrome.tabs.Tab, frameId: number, url: string) {
    const tabId = tab.id;
    let subFrameOffsetsForTab = this.subFrameOffsetsForTab[tabId];
    if (!subFrameOffsetsForTab) {
      this.subFrameOffsetsForTab[tabId] = new Map();
      subFrameOffsetsForTab = this.subFrameOffsetsForTab[tabId];
    }

    if (subFrameOffsetsForTab.get(frameId)) {
      return;
    }

    const subFrameData = { url, top: 0, left: 0 };
    let frameDetails = await BrowserApi.getFrameDetails({ tabId, frameId });

    while (frameDetails && frameDetails.parentFrameId !== -1) {
      const subFrameOffset: SubFrameOffsetData = await BrowserApi.tabSendMessage(
        tab,
        {
          command: "getSubFrameOffsets",
          subFrameUrl: frameDetails.url,
          subFrameId: frameDetails.documentId,
        },
        { frameId: frameDetails.parentFrameId },
      );

      if (!subFrameOffset) {
        subFrameOffsetsForTab.set(frameId, null);
        void BrowserApi.tabSendMessage(
          tab,
          { command: "getSubFrameOffsetsFromWindowMessage", subFrameId: frameId },
          { frameId: frameId },
        );
        return;
      }

      subFrameData.top += subFrameOffset.top;
      subFrameData.left += subFrameOffset.left;

      frameDetails = await BrowserApi.getFrameDetails({
        tabId,
        frameId: frameDetails.parentFrameId,
      });
    }

    subFrameOffsetsForTab.set(frameId, subFrameData);
  }

  private async rebuildSubFrameOffsets(sender: chrome.runtime.MessageSender) {
    if (sender.frameId === this.focusedFieldData?.frameId) {
      return;
    }

    const subFrameOffsetsForTab = this.subFrameOffsetsForTab[sender.tab.id];
    if (!subFrameOffsetsForTab) {
      return;
    }

    if (this.updateInlineMenuPositionTimeout) {
      clearTimeout(this.updateInlineMenuPositionTimeout);
    }

    const frameTabs = Array.from(subFrameOffsetsForTab.keys());
    for (const frameId of frameTabs) {
      if (frameId === sender.frameId) {
        continue;
      }

      subFrameOffsetsForTab.delete(frameId);
      await this.buildSubFrameOffsets(sender.tab, frameId, sender.url);
    }

    this.updateInlineMenuPositionTimeout = setTimeout(() => {
      if (this.isFieldCurrentlyFocused) {
        void this.updateInlineMenuPosition({ overlayElement: AutofillOverlayElement.List }, sender);
        void this.updateInlineMenuPosition(
          { overlayElement: AutofillOverlayElement.Button },
          sender,
        );
      }
    }, 650);
  }

  /**
   * Triggers autofill for the selected cipher in the inline menu list. Also places
   * the selected cipher at the top of the list of ciphers.
   *
   * @param overlayCipherId - Cipher ID corresponding to the overlayLoginCiphers map. Does not correspond to the actual cipher's ID.
   * @param sender - The sender of the port message
   */
  private async fillSelectedInlineMenuListItem(
    { overlayCipherId }: OverlayPortMessage,
    { sender }: chrome.runtime.Port,
  ) {
    const pageDetails = this.pageDetailsForTab[sender.tab.id];
    if (!overlayCipherId || !pageDetails?.size) {
      return;
    }

    const cipher = this.overlayLoginCiphers.get(overlayCipherId);

    if (await this.autofillService.isPasswordRepromptRequired(cipher, sender.tab)) {
      return;
    }
    const totpCode = await this.autofillService.doAutoFill({
      tab: sender.tab,
      cipher: cipher,
      pageDetails: Array.from(pageDetails.values()),
      fillNewPassword: true,
      allowTotpAutofill: true,
    });

    if (totpCode) {
      this.platformUtilsService.copyToClipboard(totpCode);
    }

    this.overlayLoginCiphers = new Map([[overlayCipherId, cipher], ...this.overlayLoginCiphers]);
  }

  /**
   * Checks if the inline menu is focused. Will check the inline menu list
   * if it is open, otherwise it will check the inline menu button.
   */
  private checkInlineMenuFocused() {
    if (this.inlineMenuListPort) {
      this.checkInlineMenuListFocused();

      return;
    }

    this.checkInlineMenuButtonFocused();
  }

  /**
   * Posts a message to the inline menu button iframe to check if it is focused.
   */
  private checkInlineMenuButtonFocused() {
    this.inlineMenuButtonPort?.postMessage({ command: "checkAutofillInlineMenuButtonFocused" });
  }

  /**
   * Posts a message to the inline menu list iframe to check if it is focused.
   */
  private checkInlineMenuListFocused() {
    this.inlineMenuListPort?.postMessage({ command: "checkAutofillInlineMenuListFocused" });
  }

  /**
   * Sends a message to the sender tab to close the autofill inline menu.
   *
   * @param sender - The sender of the port message
   * @param forceCloseAutofillInlineMenu - Identifies whether the inline menu should be forced closed
   * @param overlayElement - The overlay element to close, either the list or button
   */
  private closeInlineMenu(
    sender: chrome.runtime.MessageSender,
    {
      forceCloseAutofillInlineMenu,
      overlayElement,
    }: { forceCloseAutofillInlineMenu?: boolean; overlayElement?: string } = {},
  ) {
    if (forceCloseAutofillInlineMenu) {
      void BrowserApi.tabSendMessage(
        sender.tab,
        { command: "closeInlineMenu", overlayElement },
        { frameId: 0 },
      );
      return;
    }

    if (this.isFieldCurrentlyFocused) {
      return;
    }

    if (this.isFieldCurrentlyFilling) {
      void BrowserApi.tabSendMessage(
        sender.tab,
        {
          command: "closeInlineMenu",
          overlayElement: AutofillOverlayElement.List,
        },
        { frameId: 0 },
      );
      return;
    }

    void BrowserApi.tabSendMessage(
      sender.tab,
      { command: "closeInlineMenu", overlayElement },
      { frameId: 0 },
    );
  }

  /**
   * Handles cleanup when an overlay element is closed. Disconnects
   * the list and button ports and sets them to null.
   *
   * @param overlayElement - The overlay element that was closed, either the list or button
   */
  private overlayElementClosed({ overlayElement }: OverlayBackgroundExtensionMessage) {
    if (overlayElement === AutofillOverlayElement.Button) {
      this.inlineMenuButtonPort?.disconnect();
      this.inlineMenuButtonPort = null;

      return;
    }

    this.inlineMenuListPort?.disconnect();
    this.inlineMenuListPort = null;
  }

  /**
   * Updates the position of either the inline menu list or button. The position
   * is based on the focused field's position and dimensions.
   *
   * @param overlayElement - The overlay element to update, either the list or button
   * @param sender - The sender of the extension message
   */
  private async updateInlineMenuPosition(
    { overlayElement }: { overlayElement?: string },
    sender: chrome.runtime.MessageSender,
  ) {
    if (!overlayElement || sender.tab.id !== this.focusedFieldData?.tabId) {
      return;
    }

    await BrowserApi.tabSendMessage(
      sender.tab,
      { command: "appendInlineMenuElementsToDom", overlayElement },
      { frameId: 0 },
    );

    const subFrameOffsetsForTab = this.subFrameOffsetsForTab[this.focusedFieldData.tabId];
    let subFrameOffsets: SubFrameOffsetData;
    if (subFrameOffsetsForTab) {
      subFrameOffsets = subFrameOffsetsForTab.get(this.focusedFieldData.frameId);
    }

    if (overlayElement === AutofillOverlayElement.Button) {
      this.inlineMenuButtonPort?.postMessage({
        command: "updateIframePosition",
        styles: this.getInlineMenuButtonPosition(subFrameOffsets),
      });

      return;
    }

    this.inlineMenuListPort?.postMessage({
      command: "updateIframePosition",
      styles: this.getInlineMenuListPosition(subFrameOffsets),
    });
  }

  /**
   * Gets the position of the focused field and calculates the position
   * of the inline menu button based on the focused field's position and dimensions.
   */
  private getInlineMenuButtonPosition(subFrameOffsets: SubFrameOffsetData) {
    if (!this.focusedFieldData) {
      return;
    }

    const subFrameTopOffset = subFrameOffsets?.top || 0;
    const subFrameLeftOffset = subFrameOffsets?.left || 0;

    const { top, left, width, height } = this.focusedFieldData.focusedFieldRects;
    const { paddingRight, paddingLeft } = this.focusedFieldData.focusedFieldStyles;
    let elementOffset = height * 0.37;
    if (height >= 35) {
      elementOffset = height >= 50 ? height * 0.47 : height * 0.42;
    }

    const fieldPaddingRight = parseInt(paddingRight, 10);
    const fieldPaddingLeft = parseInt(paddingLeft, 10);
    const elementHeight = height - elementOffset;

    const elementTopPosition = subFrameTopOffset + top + elementOffset / 2;
    const elementLeftPosition =
      fieldPaddingRight > fieldPaddingLeft
        ? subFrameLeftOffset + left + width - height - (fieldPaddingRight - elementOffset + 2)
        : subFrameLeftOffset + left + width - height + elementOffset / 2;

    return {
      top: `${Math.round(elementTopPosition)}px`,
      left: `${Math.round(elementLeftPosition)}px`,
      height: `${Math.round(elementHeight)}px`,
      width: `${Math.round(elementHeight)}px`,
    };
  }

  /**
   * Gets the position of the focused field and calculates the position
   * of the inline menu list based on the focused field's position and dimensions.
   */
  private getInlineMenuListPosition(subFrameOffsets: SubFrameOffsetData) {
    if (!this.focusedFieldData) {
      return;
    }

    const subFrameTopOffset = subFrameOffsets?.top || 0;
    const subFrameLeftOffset = subFrameOffsets?.left || 0;

    const { top, left, width, height } = this.focusedFieldData.focusedFieldRects;
    return {
      width: `${Math.round(width)}px`,
      top: `${Math.round(top + height + subFrameTopOffset)}px`,
      left: `${Math.round(left + subFrameLeftOffset)}px`,
    };
  }

  /**
   * Sets the focused field data to the data passed in the extension message.
   *
   * @param focusedFieldData - Contains the rects and styles of the focused field.
   * @param sender - The sender of the extension message
   */
  private setFocusedFieldData(
    { focusedFieldData }: OverlayBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    this.focusedFieldData = { ...focusedFieldData, tabId: sender.tab.id, frameId: sender.frameId };
  }

  /**
   * Updates the inline menu's visibility based on the display property passed in the extension message.
   *
   * @param display - The display property of the inline menu, either "block" or "none"
   * @param sender - The sender of the extension message
   */
  private updateInlineMenuHidden(
    { isAutofillInlineMenuHidden, setTransparentOverlay }: OverlayBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    const display = isAutofillInlineMenuHidden ? "none" : "block";
    let styles: { display: string; opacity?: number } = { display };

    if (typeof setTransparentOverlay !== "undefined") {
      const opacity = setTransparentOverlay ? 0 : 1;
      styles = { ...styles, opacity };
    }

    const portMessage = { command: "updateInlineMenuHidden", styles };

    void BrowserApi.tabSendMessage(
      sender.tab,
      { command: "toggleInlineMenuHidden", isInlineMenuHidden: isAutofillInlineMenuHidden },
      { frameId: 0 },
    );

    this.inlineMenuButtonPort?.postMessage(portMessage);
    this.inlineMenuListPort?.postMessage(portMessage);
  }

  /**
   * Sends a message to the currently active tab to open the autofill inline menu.
   *
   * @param isFocusingFieldElement - Identifies whether the field element should be focused when the inline menu is opened
   * @param isOpeningFullAutofillInlineMenu - Identifies whether the full inline menu should be forced open regardless of other states
   */
  private async openInlineMenu(
    isFocusingFieldElement = false,
    isOpeningFullAutofillInlineMenu = false,
  ) {
    const currentTab = await BrowserApi.getTabFromCurrentWindowId();

    await BrowserApi.tabSendMessage(
      currentTab,
      {
        command: "openAutofillInlineMenu",
        isFocusingFieldElement,
        isOpeningFullAutofillInlineMenu,
        authStatus: await this.getAuthStatus(),
      },
      {
        frameId: this.focusedFieldData?.tabId === currentTab.id ? this.focusedFieldData.frameId : 0,
      },
    );
  }

  /**
   * Gets the inline menu's visibility setting from the settings service.
   */
  private async getInlineMenuVisibility(): Promise<InlineMenuVisibilitySetting> {
    return await firstValueFrom(this.autofillSettingsService.inlineMenuVisibility$);
  }

  /**
   * Gets the user's authentication status from the auth service. If the user's authentication
   * status has changed, the inline menu button's authentication status will be updated
   * and the inline menu list's ciphers will be updated.
   */
  private async getAuthStatus() {
    const formerAuthStatus = this.userAuthStatus;
    this.userAuthStatus = await firstValueFrom(this.authService.activeAccountStatus$);

    if (
      this.userAuthStatus !== formerAuthStatus &&
      this.userAuthStatus === AuthenticationStatus.Unlocked
    ) {
      this.updateInlineMenuButtonAuthStatus();
      await this.updateOverlayCiphers();
    }

    return this.userAuthStatus;
  }

  /**
   * Sends a message to the inline menu button to update its authentication status.
   */
  private updateInlineMenuButtonAuthStatus() {
    this.inlineMenuButtonPort?.postMessage({
      command: "updateInlineMenuButtonAuthStatus",
      authStatus: this.userAuthStatus,
    });
  }

  /**
   * Handles the inline menu button being clicked. If the user is not authenticated,
   * the vault will be unlocked. If the user is authenticated, the inline menu will
   * be opened.
   *
   * @param port - The port of the inline menu button
   */
  private handleInlineMenuButtonClicked(port: chrome.runtime.Port) {
    if (this.userAuthStatus !== AuthenticationStatus.Unlocked) {
      void this.unlockVault(port);
      return;
    }

    void this.openInlineMenu(false, true);
  }

  /**
   * Facilitates opening the unlock popout window.
   *
   * @param port - The port of the inline menu list
   */
  private async unlockVault(port: chrome.runtime.Port) {
    const { sender } = port;

    this.closeInlineMenu(port.sender);
    const retryMessage: LockedVaultPendingNotificationsData = {
      commandToRetry: { message: { command: "openAutofillInlineMenu" }, sender },
      target: "overlay.background",
    };
    await BrowserApi.tabSendMessageData(
      sender.tab,
      "addToLockedVaultPendingNotifications",
      retryMessage,
    );
    await this.openUnlockPopout(sender.tab, true);
  }

  /**
   * Triggers the opening of a vault item popout window associated
   * with the passed cipher ID.
   * @param overlayCipherId - Cipher ID corresponding to the overlayLoginCiphers map. Does not correspond to the actual cipher's ID.
   * @param sender - The sender of the port message
   */
  private async viewSelectedCipher(
    { overlayCipherId }: OverlayPortMessage,
    { sender }: chrome.runtime.Port,
  ) {
    const cipher = this.overlayLoginCiphers.get(overlayCipherId);
    if (!cipher) {
      return;
    }

    await this.openViewVaultItemPopout(sender.tab, {
      cipherId: cipher.id,
      action: SHOW_AUTOFILL_BUTTON,
    });
  }

  /**
   * Facilitates redirecting focus to the inline menu list.
   */
  private focusInlineMenuList() {
    this.inlineMenuListPort?.postMessage({ command: "focusInlineMenuList" });
  }

  /**
   * Updates the authentication status for the user and opens the inline menu if
   * a followup command is present in the message.
   *
   * @param message - Extension message received from the `unlockCompleted` command
   */
  private async unlockCompleted(message: OverlayBackgroundExtensionMessage) {
    await this.getAuthStatus();

    if (message.data?.commandToRetry?.message?.command === "openAutofillInlineMenu") {
      await this.openInlineMenu(true);
    }
  }

  /**
   * Gets the translations for the inline menu page.
   */
  private getInlineMenuTranslations() {
    if (!this.inlineMenuPageTranslations) {
      this.inlineMenuPageTranslations = {
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

    return this.inlineMenuPageTranslations;
  }

  /**
   * Facilitates redirecting focus out of one of the
   * inline menu elements to elements on the page.
   *
   * @param direction - The direction to redirect focus to (either "next", "previous" or "current)
   * @param sender - The sender of the port message
   */
  private redirectInlineMenuFocusOut(
    { direction }: OverlayPortMessage,
    { sender }: chrome.runtime.Port,
  ) {
    if (!direction) {
      return;
    }

    void BrowserApi.tabSendMessageData(sender.tab, "redirectAutofillInlineMenuFocusOut", {
      direction,
    });
  }

  /**
   * Triggers adding a new vault item from the overlay. Gathers data
   * input by the user before calling to open the add/edit window.
   *
   * @param sender - The sender of the port message
   */
  private getNewVaultItemDetails({ sender }: chrome.runtime.Port) {
    if (sender.tab.id !== this.focusedFieldData.tabId) {
      return;
    }

    void BrowserApi.tabSendMessage(
      sender.tab,
      { command: "addNewVaultItemFromOverlay" },
      {
        frameId: this.focusedFieldData.frameId || 0,
      },
    );
  }

  /**
   * Handles adding a new vault item from the overlay. Gathers data login
   * data captured in the extension message.
   *
   * @param login - The login data captured from the extension message
   * @param sender - The sender of the extension message
   */
  private async addNewVaultItem(
    { login }: OverlayAddNewItemMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    if (!login) {
      return;
    }

    const uriView = new LoginUriView();
    uriView.uri = login.uri;

    const loginView = new LoginView();
    loginView.uris = [uriView];
    loginView.username = login.username || "";
    loginView.password = login.password || "";

    const cipherView = new CipherView();
    cipherView.name = (Utils.getHostname(login.uri) || login.hostname).replace(/^www\./, "");
    cipherView.folderId = null;
    cipherView.type = CipherType.Login;
    cipherView.login = loginView;

    await this.cipherService.setAddEditCipherInfo({
      cipher: cipherView,
      collectionIds: cipherView.collectionIds,
    });

    await this.openAddEditVaultItemPopout(sender.tab, { cipherId: cipherView.id });
    await BrowserApi.sendMessage("inlineAutofillMenuRefreshAddEditCipher");
  }

  private updateIsFieldCurrentlyFocused(message: OverlayBackgroundExtensionMessage) {
    this.isFieldCurrentlyFocused = message.isFieldCurrentlyFocused;
  }

  private checkIsFieldCurrentlyFocused() {
    return this.isFieldCurrentlyFocused;
  }

  private updateIsFieldCurrentlyFilling(message: OverlayBackgroundExtensionMessage) {
    this.isFieldCurrentlyFilling = message.isFieldCurrentlyFilling;
  }

  private checkIsFieldCurrentlyFilling() {
    return this.isFieldCurrentlyFilling;
  }

  private async checkIsAutofillInlineMenuButtonVisible(sender: chrome.runtime.MessageSender) {
    return await BrowserApi.tabSendMessage(
      sender.tab,
      { command: "checkIsAutofillInlineMenuButtonVisible" },
      { frameId: 0 },
    );
  }

  private async checkIsAutofillInlineMenuListVisible(sender: chrome.runtime.MessageSender) {
    return await BrowserApi.tabSendMessage(
      sender.tab,
      { command: "checkIsAutofillInlineMenuListVisible" },
      { frameId: 0 },
    );
  }

  private checkIsOverlayLoginCiphersPopulated(sender: chrome.runtime.MessageSender) {
    return sender.tab.id === this.focusedFieldData.tabId && this.overlayLoginCiphers.size > 0;
  }

  private updateInlineMenuButtonColorScheme() {
    this.inlineMenuButtonPort?.postMessage({
      command: "updateAutofillInlineMenuColorScheme",
    });
  }

  private updateInlineMenuListHeight(message: OverlayBackgroundExtensionMessage) {
    this.inlineMenuListPort?.postMessage({
      command: "updateIframePosition",
      styles: message.styles,
    });
  }

  /**
   * Sets up the extension message listeners for the overlay.
   */
  private setupExtensionMessageListeners() {
    BrowserApi.messageListener("overlay.background", this.handleExtensionMessage);
    BrowserApi.addListener(chrome.runtime.onConnect, this.handlePortOnConnect);
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
    sendResponse: (response?: any) => void,
  ) => {
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    const messageResponse = handler({ message, sender });
    if (typeof messageResponse === "undefined") {
      return;
    }

    Promise.resolve(messageResponse)
      .then((response) => sendResponse(response))
      .catch(this.logService.error);
    return true;
  };

  /**
   * Handles the connection of a port to the extension background.
   *
   * @param port - The port that connected to the extension background
   */
  private handlePortOnConnect = async (port: chrome.runtime.Port) => {
    const isInlineMenuListMessageConnector = port.name === AutofillOverlayPort.ListMessageConnector;
    const isInlineMenuButtonMessageConnector =
      port.name === AutofillOverlayPort.ButtonMessageConnector;
    if (isInlineMenuListMessageConnector || isInlineMenuButtonMessageConnector) {
      port.onMessage.addListener(this.handleOverlayElementPortMessage);
      return;
    }

    const isInlineMenuListPort = port.name === AutofillOverlayPort.List;
    const isInlineMenuButtonPort = port.name === AutofillOverlayPort.Button;
    if (!isInlineMenuListPort && !isInlineMenuButtonPort) {
      return;
    }

    if (isInlineMenuListPort) {
      this.inlineMenuListPort = port;
    } else {
      this.inlineMenuButtonPort = port;
    }

    port.onDisconnect.addListener(this.handlePortOnDisconnect);
    port.postMessage({
      command: `initAutofillInlineMenu${isInlineMenuListPort ? "List" : "Button"}`,
      iframeUrl: chrome.runtime.getURL(`overlay/${isInlineMenuListPort ? "list" : "button"}.html`),
      pageTitle: chrome.i18n.getMessage(
        isInlineMenuListPort ? "bitwardenVault" : "bitwardenOverlayButton",
      ),
      authStatus: await this.getAuthStatus(),
      styleSheetUrl: chrome.runtime.getURL(
        `overlay/${isInlineMenuListPort ? "list" : "button"}.css`,
      ),
      theme: await firstValueFrom(this.themeStateService.selectedTheme$),
      translations: this.getInlineMenuTranslations(),
      ciphers: isInlineMenuListPort ? await this.getOverlayCipherData() : null,
      portKey: this.portKeyForTab[port.sender.tab.id],
      portName: isInlineMenuListPort
        ? AutofillOverlayPort.ListMessageConnector
        : AutofillOverlayPort.ButtonMessageConnector,
    });
    void this.updateInlineMenuPosition(
      {
        overlayElement: isInlineMenuListPort
          ? AutofillOverlayElement.List
          : AutofillOverlayElement.Button,
      },
      port.sender,
    );
  };

  /**
   * Handles messages sent to the overlay list or button ports.
   *
   * @param message - The message received from the port
   * @param port - The port that sent the message
   */
  private handleOverlayElementPortMessage = (
    message: OverlayBackgroundExtensionMessage,
    port: chrome.runtime.Port,
  ) => {
    if (this.portKeyForTab[port.sender.tab.id] !== message?.portKey) {
      return;
    }

    const command = message.command;
    let handler: CallableFunction | undefined;

    if (port.name === AutofillOverlayPort.ButtonMessageConnector) {
      handler = this.inlineMenuButtonPortMessageHandlers[command];
    }

    if (port.name === AutofillOverlayPort.ListMessageConnector) {
      handler = this.inlineMenuListPortMessageHandlers[command];
    }

    if (!handler) {
      return;
    }

    handler({ message, port });
  };

  private handlePortOnDisconnect = (port: chrome.runtime.Port) => {
    if (port.name === AutofillOverlayPort.List) {
      this.inlineMenuListPort = null;
    }

    if (port.name === AutofillOverlayPort.Button) {
      this.inlineMenuButtonPort = null;
    }
  };
}

export default OverlayBackground;
