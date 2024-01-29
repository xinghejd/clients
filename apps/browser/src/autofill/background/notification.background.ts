import { firstValueFrom } from "rxjs";

import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { ThemeType } from "@bitwarden/common/platform/enums";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { LoginUriView } from "@bitwarden/common/vault/models/view/login-uri.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";

import { openUnlockPopout } from "../../auth/popup/utils/auth-popout-window";
import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/abstractions/browser-state.service";
import { openAddEditVaultItemPopout } from "../../vault/popup/utils/vault-popout-window";
import { NOTIFICATION_BAR_LIFESPAN_MS } from "../constants";
import { NotificationQueueMessageType } from "../enums/notification-queue-message-type.enum";
import { AutofillService } from "../services/abstractions/autofill.service";

import {
  AddChangePasswordQueueMessage,
  AddLoginQueueMessage,
  AddRequestFilelessImportQueueMessage,
  AddUnlockVaultQueueMessage,
  ChangePasswordMessageData,
  AddLoginMessageData,
  NotificationQueueMessageItem,
  LockedVaultPendingNotificationsData,
  NotificationBackgroundExtensionMessage,
  NotificationBackgroundExtensionMessageHandlers,
} from "./abstractions/notification.background";
import { OverlayBackgroundExtensionMessage } from "./abstractions/overlay.background";

export default class NotificationBackground {
  private openUnlockPopout = openUnlockPopout;
  private notificationQueue: NotificationQueueMessageItem[] = [];
  private readonly extensionMessageHandlers: NotificationBackgroundExtensionMessageHandlers = {
    unlockCompleted: ({ message, sender }) => this.handleUnlockCompleted(message, sender),
    bgGetFolderData: () => this.getFolderData(),
    bgCloseNotificationBar: ({ sender }) => this.handleCloseNotificationBarMessage(sender),
    bgAdjustNotificationBar: ({ message, sender }) =>
      this.bgAdjustNotificationBarMessage(message, sender),
    bgAddLogin: ({ message, sender }) => this.addLogin(message, sender),
    bgChangedPassword: ({ message, sender }) => this.changedPassword(message, sender),
    bgRemoveTabFromNotificationQueue: ({ sender }) =>
      this.removeTabFromNotificationQueue(sender.tab),
    bgSaveCipher: ({ message, sender }) => this.handleSaveCipherMessage(message, sender),
    bgNeverSave: ({ sender }) => this.saveNever(sender.tab),
    collectPageDetailsResponse: ({ message }) =>
      this.handleCollectPageDetailsResponseMessage(message),
    bgUnlockPopoutOpened: ({ message, sender }) => this.unlockVault(message, sender.tab),
    checkNotificationQueue: ({ sender }) => this.checkNotificationQueue(sender.tab),
    bgReopenUnlockPopout: ({ sender }) => this.openUnlockPopout(sender.tab),
  };

  constructor(
    private autofillService: AutofillService,
    private cipherService: CipherService,
    private authService: AuthService,
    private policyService: PolicyService,
    private folderService: FolderService,
    private stateService: BrowserStateService,
    private environmentService: EnvironmentService,
  ) {}

  async init() {
    if (chrome.runtime == null) {
      return;
    }

    this.setupExtensionMessageListener();

    this.cleanupNotificationQueue();
  }

  async checkNotificationQueue(tab: chrome.tabs.Tab = null): Promise<void> {
    if (this.notificationQueue.length === 0) {
      return;
    }

    if (tab != null) {
      await this.doNotificationQueueCheck(tab);
      return;
    }

    const currentTab = await BrowserApi.getTabFromCurrentWindow();
    if (currentTab != null) {
      await this.doNotificationQueueCheck(currentTab);
    }
  }

  private cleanupNotificationQueue() {
    for (let i = this.notificationQueue.length - 1; i >= 0; i--) {
      if (this.notificationQueue[i].expires < new Date()) {
        BrowserApi.tabSendMessageData(this.notificationQueue[i].tab, "closeNotificationBar");
        this.notificationQueue.splice(i, 1);
      }
    }
    setTimeout(() => this.cleanupNotificationQueue(), 30000); // check every 30 seconds
  }

  private async doNotificationQueueCheck(tab: chrome.tabs.Tab): Promise<void> {
    const tabDomain = Utils.getDomain(tab?.url);
    if (!tabDomain) {
      return;
    }

    const queueMessage = this.notificationQueue.find(
      (message) => message.tab.id === tab.id && message.domain === tabDomain,
    );
    if (queueMessage) {
      this.sendNotificationQueueMessage(tab, queueMessage);
    }
  }

  private async sendNotificationQueueMessage(
    tab: chrome.tabs.Tab,
    notificationQueueMessage: NotificationQueueMessageItem,
  ) {
    const notificationType = notificationQueueMessage.type;
    const webVaultURL = this.environmentService.getWebVaultUrl();
    const typeData: Record<string, any> = {
      isVaultLocked: notificationQueueMessage.wasVaultLocked,
      theme: await this.getCurrentTheme(),
      webVaultURL,
    };

    switch (notificationType) {
      case NotificationQueueMessageType.AddLogin:
        typeData.removeIndividualVault = await this.removeIndividualVault();
        break;
      case NotificationQueueMessageType.RequestFilelessImport:
        typeData.importType = (
          notificationQueueMessage as AddRequestFilelessImportQueueMessage
        ).importType;
        break;
    }

    await BrowserApi.tabSendMessageData(tab, "openNotificationBar", {
      type: notificationType,
      typeData,
    });
  }

  private async getCurrentTheme() {
    const theme = await this.stateService.getTheme();

    if (theme !== ThemeType.System) {
      return theme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ThemeType.Dark
      : ThemeType.Light;
  }

  private removeTabFromNotificationQueue(tab: chrome.tabs.Tab) {
    for (let i = this.notificationQueue.length - 1; i >= 0; i--) {
      if (this.notificationQueue[i].tab.id === tab.id) {
        this.notificationQueue.splice(i, 1);
      }
    }
  }

  private async addLogin(
    message: NotificationBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    const loginInfo = message.login;
    const authStatus = await this.authService.getAuthStatus();
    if (authStatus === AuthenticationStatus.LoggedOut) {
      return;
    }

    const loginDomain = Utils.getDomain(loginInfo.url);
    if (loginDomain == null) {
      return;
    }

    let normalizedUsername = loginInfo.username;
    if (normalizedUsername != null) {
      normalizedUsername = normalizedUsername.toLowerCase();
    }

    const disabledAddLogin = await this.stateService.getDisableAddLoginNotification();
    if (authStatus === AuthenticationStatus.Locked) {
      if (disabledAddLogin) {
        return;
      }

      this.pushAddLoginToQueue(loginDomain, loginInfo, sender.tab, true);
      return;
    }

    const ciphers = await this.cipherService.getAllDecryptedForUrl(loginInfo.url);
    const usernameMatches = ciphers.filter(
      (c) => c.login.username != null && c.login.username.toLowerCase() === normalizedUsername,
    );
    if (usernameMatches.length === 0) {
      if (disabledAddLogin) {
        return;
      }

      this.pushAddLoginToQueue(loginDomain, loginInfo, sender.tab);
    } else if (
      usernameMatches.length === 1 &&
      usernameMatches[0].login.password !== loginInfo.password
    ) {
      const disabledChangePassword =
        await this.stateService.getDisableChangedPasswordNotification();
      if (disabledChangePassword) {
        return;
      }
      this.pushChangePasswordToQueue(
        usernameMatches[0].id,
        loginDomain,
        loginInfo.password,
        sender.tab,
      );
    }
  }

  private async pushAddLoginToQueue(
    loginDomain: string,
    loginInfo: AddLoginMessageData,
    tab: chrome.tabs.Tab,
    isVaultLocked = false,
  ) {
    // remove any old messages for this tab
    this.removeTabFromNotificationQueue(tab);
    const message: AddLoginQueueMessage = {
      type: NotificationQueueMessageType.AddLogin,
      username: loginInfo.username,
      password: loginInfo.password,
      domain: loginDomain,
      uri: loginInfo.url,
      tab: tab,
      expires: new Date(new Date().getTime() + NOTIFICATION_BAR_LIFESPAN_MS),
      wasVaultLocked: isVaultLocked,
    };
    this.notificationQueue.push(message);
    await this.checkNotificationQueue(tab);
  }

  private async changedPassword(
    message: NotificationBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    const changeData = message.data as ChangePasswordMessageData;
    const loginDomain = Utils.getDomain(changeData.url);
    if (loginDomain == null) {
      return;
    }

    if ((await this.authService.getAuthStatus()) < AuthenticationStatus.Unlocked) {
      this.pushChangePasswordToQueue(null, loginDomain, changeData.newPassword, sender.tab, true);
      return;
    }

    let id: string = null;
    const ciphers = await this.cipherService.getAllDecryptedForUrl(changeData.url);
    if (changeData.currentPassword != null) {
      const passwordMatches = ciphers.filter(
        (c) => c.login.password === changeData.currentPassword,
      );
      if (passwordMatches.length === 1) {
        id = passwordMatches[0].id;
      }
    } else if (ciphers.length === 1) {
      id = ciphers[0].id;
    }
    if (id != null) {
      this.pushChangePasswordToQueue(id, loginDomain, changeData.newPassword, sender.tab);
    }
  }

  private async handleCollectPageDetailsResponseMessage(
    message: NotificationBackgroundExtensionMessage,
  ) {
    if (message.sender !== "notificationBar") {
      return;
    }

    const forms = this.autofillService.getFormsWithPasswordFields(message.details);
    await BrowserApi.tabSendMessageData(message.tab, "notificationBarPageDetails", {
      details: message.details,
      forms: forms,
    });
  }

  /**
   * Sets up a notification to unlock the vault when the user
   * attempts to autofill a cipher while the vault is locked.
   *
   * @param message - Extension message, determines if the notification should be skipped
   * @param tab - The tab that the message was sent from
   */
  private async unlockVault(message: NotificationBackgroundExtensionMessage, tab: chrome.tabs.Tab) {
    if (message.data?.skipNotification) {
      return;
    }

    const currentAuthStatus = await this.authService.getAuthStatus();
    if (currentAuthStatus !== AuthenticationStatus.Locked || this.notificationQueue.length) {
      return;
    }

    const loginDomain = Utils.getDomain(tab.url);
    if (loginDomain) {
      this.pushUnlockVaultToQueue(loginDomain, tab);
    }
  }

  /**
   * Sets up a notification to request a fileless import when the user
   * attempts to trigger an import from a third party website.
   *
   * @param tab - The tab that we are sending the notification to
   * @param importType - The type of import that is being requested
   */
  async requestFilelessImport(tab: chrome.tabs.Tab, importType: string) {
    const currentAuthStatus = await this.authService.getAuthStatus();
    if (currentAuthStatus !== AuthenticationStatus.Unlocked || this.notificationQueue.length) {
      return;
    }

    const loginDomain = Utils.getDomain(tab.url);
    if (loginDomain) {
      this.pushRequestFilelessImportToQueue(loginDomain, tab, importType);
    }
  }

  private async pushChangePasswordToQueue(
    cipherId: string,
    loginDomain: string,
    newPassword: string,
    tab: chrome.tabs.Tab,
    isVaultLocked = false,
  ) {
    // remove any old messages for this tab
    this.removeTabFromNotificationQueue(tab);
    const message: AddChangePasswordQueueMessage = {
      type: NotificationQueueMessageType.ChangePassword,
      cipherId: cipherId,
      newPassword: newPassword,
      domain: loginDomain,
      tab: tab,
      expires: new Date(new Date().getTime() + NOTIFICATION_BAR_LIFESPAN_MS),
      wasVaultLocked: isVaultLocked,
    };
    this.notificationQueue.push(message);
    await this.checkNotificationQueue(tab);
  }

  private async pushUnlockVaultToQueue(loginDomain: string, tab: chrome.tabs.Tab) {
    this.removeTabFromNotificationQueue(tab);
    const message: AddUnlockVaultQueueMessage = {
      type: NotificationQueueMessageType.UnlockVault,
      domain: loginDomain,
      tab: tab,
      expires: new Date(new Date().getTime() + 0.5 * 60000), // 30 seconds
      wasVaultLocked: true,
    };
    await this.sendNotificationQueueMessage(tab, message);
  }

  /**
   * Pushes a request to start a fileless import to the notification queue.
   * This will display a notification bar to the user, prompting them to
   * start the import.
   *
   * @param loginDomain - The domain of the tab that we are sending the notification to
   * @param tab - The tab that we are sending the notification to
   * @param importType - The type of import that is being requested
   */
  private async pushRequestFilelessImportToQueue(
    loginDomain: string,
    tab: chrome.tabs.Tab,
    importType?: string,
  ) {
    this.removeTabFromNotificationQueue(tab);
    const message: AddRequestFilelessImportQueueMessage = {
      type: NotificationQueueMessageType.RequestFilelessImport,
      domain: loginDomain,
      tab,
      expires: new Date(new Date().getTime() + 0.5 * 60000), // 30 seconds
      wasVaultLocked: false,
      importType,
    };
    this.notificationQueue.push(message);
    await this.checkNotificationQueue(tab);
    this.removeTabFromNotificationQueue(tab);
  }

  private async handleSaveCipherMessage(
    message: NotificationBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    if ((await this.authService.getAuthStatus()) < AuthenticationStatus.Unlocked) {
      await BrowserApi.tabSendMessageData(sender.tab, "addToLockedVaultPendingNotifications", {
        commandToRetry: {
          message: {
            command: message.command,
            edit: message.edit,
            folder: message.folder,
          },
          sender: sender,
        },
        target: "notification.background",
      } as LockedVaultPendingNotificationsData);
      await this.openUnlockPopout(sender.tab);
      return;
    }

    await this.saveOrUpdateCredentials(sender.tab, message.edit, message.folder);
  }

  private async saveOrUpdateCredentials(tab: chrome.tabs.Tab, edit: boolean, folderId?: string) {
    for (let i = this.notificationQueue.length - 1; i >= 0; i--) {
      const queueMessage = this.notificationQueue[i];
      if (
        queueMessage.tab.id !== tab.id ||
        (queueMessage.type !== NotificationQueueMessageType.AddLogin &&
          queueMessage.type !== NotificationQueueMessageType.ChangePassword)
      ) {
        continue;
      }

      const tabDomain = Utils.getDomain(tab.url);
      if (tabDomain != null && tabDomain !== queueMessage.domain) {
        continue;
      }

      this.notificationQueue.splice(i, 1);

      if (queueMessage.type === NotificationQueueMessageType.ChangePassword) {
        const cipherView = await this.getDecryptedCipherById(queueMessage.cipherId);
        await this.updatePassword(cipherView, queueMessage.newPassword, edit, tab);
        return;
      }

      // If the vault was locked, check if a cipher needs updating instead of creating a new one
      if (queueMessage.wasVaultLocked) {
        const allCiphers = await this.cipherService.getAllDecryptedForUrl(queueMessage.uri);
        const existingCipher = allCiphers.find(
          (c) =>
            c.login.username != null && c.login.username.toLowerCase() === queueMessage.username,
        );

        if (existingCipher != null) {
          await this.updatePassword(existingCipher, queueMessage.password, edit, tab);
          return;
        }
      }

      folderId = (await this.folderExists(folderId)) ? folderId : null;
      const newCipher = this.convertAddLoginQueueMessageToCipherView(queueMessage, folderId);

      if (edit) {
        await this.editItem(newCipher, tab);
        BrowserApi.tabSendMessage(tab, { command: "closeNotificationBar" });
        return;
      }

      const cipher = await this.cipherService.encrypt(newCipher);
      try {
        await this.cipherService.createWithServer(cipher);
        BrowserApi.tabSendMessage(tab, { command: "saveCipherAttemptCompleted" });
        BrowserApi.tabSendMessage(tab, { command: "addedCipher" });
      } catch (error) {
        BrowserApi.tabSendMessageData(tab, "saveCipherAttemptCompleted", {
          error: String(error.message),
        });
      }
    }
  }

  private async updatePassword(
    cipherView: CipherView,
    newPassword: string,
    edit: boolean,
    tab: chrome.tabs.Tab,
  ) {
    cipherView.login.password = newPassword;

    if (edit) {
      await this.editItem(cipherView, tab);
      BrowserApi.tabSendMessage(tab, { command: "closeNotificationBar" });
      BrowserApi.tabSendMessage(tab, { command: "editedCipher" });
      return;
    }

    const cipher = await this.cipherService.encrypt(cipherView);
    try {
      // We've only updated the password, no need to broadcast editedCipher message
      await this.cipherService.updateWithServer(cipher);
      BrowserApi.tabSendMessage(tab, { command: "saveCipherAttemptCompleted" });
    } catch (error) {
      BrowserApi.tabSendMessageData(tab, "saveCipherAttemptCompleted", {
        error: String(error.message),
      });
    }
  }

  private async editItem(cipherView: CipherView, senderTab: chrome.tabs.Tab) {
    await this.stateService.setAddEditCipherInfo({
      cipher: cipherView,
      collectionIds: cipherView.collectionIds,
    });

    await openAddEditVaultItemPopout(senderTab, { cipherId: cipherView.id });
  }

  private async folderExists(folderId: string) {
    if (Utils.isNullOrWhitespace(folderId) || folderId === "null") {
      return false;
    }

    const folders = await firstValueFrom(this.folderService.folderViews$);
    return folders.some((x) => x.id === folderId);
  }

  private async getDecryptedCipherById(cipherId: string) {
    const cipher = await this.cipherService.get(cipherId);
    if (cipher != null && cipher.type === CipherType.Login) {
      return await cipher.decrypt(await this.cipherService.getKeyForCipherKeyDecryption(cipher));
    }
    return null;
  }

  private async saveNever(tab: chrome.tabs.Tab) {
    for (let i = this.notificationQueue.length - 1; i >= 0; i--) {
      const queueMessage = this.notificationQueue[i];
      if (
        queueMessage.tab.id !== tab.id ||
        queueMessage.type !== NotificationQueueMessageType.AddLogin
      ) {
        continue;
      }

      const tabDomain = Utils.getDomain(tab.url);
      if (tabDomain != null && tabDomain !== queueMessage.domain) {
        continue;
      }

      this.notificationQueue.splice(i, 1);
      BrowserApi.tabSendMessageData(tab, "closeNotificationBar");

      const hostname = Utils.getHostname(tab.url);
      await this.cipherService.saveNeverDomain(hostname);
    }
  }

  private async getFolderData() {
    return await firstValueFrom(this.folderService.folderViews$);
  }

  private async removeIndividualVault(): Promise<boolean> {
    return await firstValueFrom(
      this.policyService.policyAppliesToActiveUser$(PolicyType.PersonalOwnership),
    );
  }

  private async handleUnlockCompleted(
    message: NotificationBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<void> {
    const messageData = message.data as LockedVaultPendingNotificationsData;
    const retryCommand = messageData.commandToRetry.message.command;
    if (retryCommand === "autofill_login") {
      await BrowserApi.tabSendMessageData(sender.tab, "closeNotificationBar");
    }

    if (messageData.target !== "notification.background") {
      return;
    }

    const retryHandler: CallableFunction | undefined = this.extensionMessageHandlers[retryCommand];
    if (!retryHandler) {
      return;
    }

    retryHandler({
      message: messageData.commandToRetry.message,
      sender: messageData.commandToRetry.sender,
    });
  }

  private async handleCloseNotificationBarMessage(sender: chrome.runtime.MessageSender) {
    await BrowserApi.tabSendMessageData(sender.tab, "closeNotificationBar");
  }

  private async bgAdjustNotificationBarMessage(
    message: NotificationBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    await BrowserApi.tabSendMessageData(sender.tab, "adjustNotificationBar", message.data);
  }

  /**
   * Accepts a login queue message and converts it into a
   * login uri view, login view, and cipher view.
   *
   * @param message - The message to convert to a cipher view
   * @param folderId - The folder to add the cipher to
   */
  private convertAddLoginQueueMessageToCipherView(
    message: AddLoginQueueMessage,
    folderId?: string,
  ): CipherView {
    const uriView = new LoginUriView();
    uriView.uri = message.uri;

    const loginView = new LoginView();
    loginView.uris = [uriView];
    loginView.username = message.username;
    loginView.password = message.password;

    const cipherView = new CipherView();
    cipherView.name = (Utils.getHostname(message.uri) || message.domain).replace(/^www\./, "");
    cipherView.folderId = folderId;
    cipherView.type = CipherType.Login;
    cipherView.login = loginView;

    return cipherView;
  }

  private setupExtensionMessageListener() {
    BrowserApi.messageListener("notification.background", this.handleExtensionMessage);
  }

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
    if (!messageResponse) {
      return;
    }

    Promise.resolve(messageResponse).then((response) => sendResponse(response));
    return true;
  };
}
