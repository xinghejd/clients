// import { firstValueFrom } from "rxjs";

import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { DomainSettingsService } from "@bitwarden/common/autofill/services/domain-settings.service";
import { UserNotificationSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/user-notification-settings.service";
// import { NeverDomains } from "@bitwarden/common/models/domain/domain-service";
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
  private websiteOriginsWithFields: Set<string> = new Set();
  private activeFormSubmissionRequests: ActiveFormSubmissionRequests = new Set();
  private modifyLoginCipherFormData: ModifyLoginCipherFormData = new Map();
  private readonly formSubmissionRequestMethods: Set<string> = new Set(["POST", "PUT", "PATCH"]);
  private readonly extensionMessageHandlers: OverlayNotificationsExtensionMessageHandlers = {
    collectPageDetailsResponse: ({ message, sender }) =>
      this.handleCollectPageDetailsResponse(message, sender),
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

  private async handleCollectPageDetailsResponse(
    message: OverlayNotificationsExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    if (await this.isSenderFromExcludedDomain(sender)) {
      return;
    }

    const originMatchPattern = `${sender.origin}/*`;
    if (!message.details?.fields?.length) {
      this.clearWebRequestsListenersOnWebsiteOrigin(originMatchPattern);
      return;
    }

    if (this.websiteOriginsWithFields.has(originMatchPattern)) {
      return;
    }

    this.websiteOriginsWithFields.add(originMatchPattern);
    this.resetWebRequestsListeners();
  }

  private async isSenderFromExcludedDomain(sender: chrome.runtime.MessageSender): Promise<boolean> {
    // const excludedDomains = await firstValueFrom(this.domainSettingsService.neverDomains$);

    return true;
  }

  private clearWebRequestsListenersOnWebsiteOrigin(originMatchPattern: string) {
    if (!this.websiteOriginsWithFields.has(originMatchPattern)) {
      return;
    }

    this.websiteOriginsWithFields.delete(originMatchPattern);
    this.removeWebRequestListeners();
  }

  private resetWebRequestsListeners() {
    this.removeWebRequestListeners();

    const requestFilter: chrome.webRequest.RequestFilter = {
      urls: Array.from(this.websiteOriginsWithFields),
      types: ["main_frame", "sub_frame", "xmlhttprequest"],
    };
    chrome.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequestEvent, requestFilter);
    chrome.webRequest.onCompleted.addListener(this.handleOnCompletedRequestEvent, requestFilter);
  }

  private removeWebRequestListeners() {
    chrome.webRequest.onBeforeRequest.removeListener(this.handleOnBeforeRequestEvent);
    chrome.webRequest.onCompleted.removeListener(this.handleOnCompletedRequestEvent);
  }

  private setupExtensionListeners() {
    BrowserApi.messageListener("overlay-notifications", this.handleExtensionMessage);
  }

  private handleOnBeforeRequestEvent = (details: chrome.webRequest.WebRequestDetails) => {
    if (this.requestHostIsInvalid(details) || !this.isFormSubmissionRequest(details)) {
      return;
    }

    // console.log("onBeforeRequest", details);
    this.activeFormSubmissionRequests.add(details.requestId);
    BrowserApi.tabSendMessage({ id: details.tabId } as chrome.tabs.Tab, {
      command: "gatherFormDataForNotification",
    })
      .then((response: any) => {
        if (response) {
          const { uri, username, password, newPassword } = response;
          this.modifyLoginCipherFormData.set(details.tabId, {
            uri: uri,
            username: username,
            password: password,
            newPassword: newPassword,
          });
        }
      })
      .catch((error) => this.logService.error(error));
  };

  private isFormSubmissionRequest = (details: chrome.webRequest.WebRequestDetails) => {
    return this.formSubmissionRequestMethods.has(details.method?.toUpperCase());
  };

  private handleOnCompletedRequestEvent = (details: chrome.webRequest.WebRequestDetails) => {
    if (
      this.requestHostIsInvalid(details) ||
      !this.activeFormSubmissionRequests.has(details.requestId)
    ) {
      return;
    }

    if (this.modifyLoginCipherFormData.has(details.tabId)) {
      // console.log("onCompleted", details, this.modifyLoginCipherFormData.get(details.tabId));
    }
  };

  private requestHostIsInvalid = (details: chrome.webRequest.WebRequestDetails) => {
    return !details.url?.startsWith("http") || details.tabId < 0;
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
