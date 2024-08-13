import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { DomainSettingsService } from "@bitwarden/common/autofill/services/domain-settings.service";
import { UserNotificationSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/user-notification-settings.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";

import { openUnlockPopout } from "../../auth/popup/utils/auth-popout-window";
import { BrowserApi } from "../../platform/browser/browser-api";
import { openAddEditVaultItemPopout } from "../../vault/popup/utils/vault-popout-window";

import {
  ActiveFormSubmissionRequests,
  ModifyLoginCipherFormData,
  OverlayNotifications,
  OverlayNotificationsBackground as OverlayNotificationsBackgroundInterface,
  OverlayNotificationsExtensionMessage,
  OverlayNotificationsExtensionMessageHandlers,
} from "./abstractions/overlay-notifications.background";

export class OverlayNotificationsBackground implements OverlayNotificationsBackgroundInterface {
  private openUnlockPopout = openUnlockPopout;
  private openAddEditVaultItemPopout = openAddEditVaultItemPopout;
  private notifications: OverlayNotifications = new Map();
  private activeFormSubmissionRequests: ActiveFormSubmissionRequests = new Set();
  private modifyLoginCipherFormData: ModifyLoginCipherFormData = new Map();
  private readonly extensionMessageHandlers: OverlayNotificationsExtensionMessageHandlers = {
    formFieldSubmitted: ({ message, sender }) => this.handleFormFieldSubmitted(message, sender),
  };

  constructor(
    private logService: LogService,
    private authService: AuthService,
    private configService: ConfigService,
    private cipherService: CipherService,
    private policyService: PolicyService,
    private folderService: FolderService,
    private themeStateService: ThemeStateService,
    private environmentService: EnvironmentService,
    private domainSettingsService: DomainSettingsService,
    private userNotificationSettingsService: UserNotificationSettingsServiceAbstraction,
  ) {}

  init() {
    this.setupExtensionListeners();
  }

  private handleFormFieldSubmitted(
    message: OverlayNotificationsExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    // console.log(message, sender);
  }

  private setupExtensionListeners() {
    const requestFilter: chrome.webRequest.RequestFilter = {
      urls: ["<all_urls>"],
      types: ["main_frame", "sub_frame", "xmlhttprequest"],
    };
    chrome.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequestEvent, requestFilter);
    chrome.webRequest.onCompleted.addListener(this.handleOnCompletedRequestEvent, requestFilter);
    BrowserApi.messageListener("overlay-notifications", this.handleExtensionMessage);
  }

  private handleOnBeforeRequestEvent = (details: chrome.webRequest.WebRequestDetails) => {
    if (this.requestHostIsInvalid(details) || details.method !== "POST") {
      return;
    }

    // console.log("onBeforeRequest", details);
    BrowserApi.tabSendMessage({ id: details.tabId } as chrome.tabs.Tab, {
      command: "gatherFormDataForNotification",
    })
      .then((response: any) => {
        if (response) {
          this.modifyLoginCipherFormData.set(details.tabId, {
            uri: response.uri,
            addLogin: { username: response.username, password: response.password },
            updateLogin: {
              username: response.username,
              currentPassword: response.password,
              newPassword: response.newPassword,
            },
          });
        }
      })
      .catch((error) => this.logService.error(error));
  };

  private handleOnCompletedRequestEvent = (details: chrome.webRequest.WebRequestDetails) => {
    // console.log("onCompleted", details, this.modifyLoginCipherFormData);
    if (
      this.requestHostIsInvalid(details) ||
      !this.activeFormSubmissionRequests.has(details.requestId) ||
      !this.notifications.has(details.tabId)
    ) {
      return;
    }
  };

  private requestHostIsInvalid = (details: chrome.webRequest.WebRequestDetails) => {
    return !details.url?.startsWith("http");
  };

  private handleExtensionMessage = (
    message: OverlayNotificationsExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    const handler: CallableFunction = this.extensionMessageHandlers[message.command];
    if (!handler) {
      return null;
    }

    const messageResponse = handler({ message, sender });
    if (typeof messageResponse === "undefined") {
      return null;
    }

    Promise.resolve(messageResponse)
      .then((response) => sendResponse(response))
      .catch((error) => this.logService.error(error));
    return true;
  };
}
