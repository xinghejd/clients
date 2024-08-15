import { LogService } from "@bitwarden/common/platform/abstractions/log.service";

import { BrowserApi } from "../../platform/browser/browser-api";

import {
  ActiveFormSubmissionRequests,
  ModifyLoginCipherFormData,
  OverlayNotificationsBackground as OverlayNotificationsBackgroundInterface,
  OverlayNotificationsExtensionMessage,
  OverlayNotificationsExtensionMessageHandlers,
} from "./abstractions/overlay-notifications.background";
import NotificationBackground from "./notification.background";

export class OverlayNotificationsBackground implements OverlayNotificationsBackgroundInterface {
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
    private notificationsBackground: NotificationBackground,
  ) {}

  init() {
    this.setupExtensionListeners();
  }

  private async handleCollectPageDetailsResponse(
    message: OverlayNotificationsExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ) {
    if (
      !(await this.isAddLoginOrChangePasswordNotificationEnabled()) ||
      (await this.isSenderFromExcludedDomain(sender))
    ) {
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
    try {
      const senderOrigin = sender.origin;
      const serverConfig = await this.notificationsBackground.getActiveUserServerConfig();
      const activeUserVault = serverConfig?.environment?.vault;
      if (activeUserVault === senderOrigin) {
        return true;
      }

      const excludedDomains = await this.notificationsBackground.getExcludedDomains();
      if (!excludedDomains) {
        return false;
      }

      const senderDomain = new URL(senderOrigin).hostname;
      return excludedDomains[senderDomain] !== undefined;
    } catch {
      return true;
    }
  }

  private async isAddLoginOrChangePasswordNotificationEnabled() {
    if (await this.notificationsBackground.getEnableChangedPasswordPrompt()) {
      return true;
    }

    return await this.notificationsBackground.getEnableAddedLoginPrompt();
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
    BrowserApi.tabSendMessage(
      { id: details.tabId } as chrome.tabs.Tab,
      { command: "gatherFormDataForNotification" },
      { frameId: details.frameId },
    )
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

  private handleOnCompletedRequestEvent = async (details: chrome.webRequest.WebResponseDetails) => {
    // console.log("onCompleted", details);
    if (
      this.requestHostIsInvalid(details) ||
      this.isInvalidStatusCode(details.statusCode) ||
      !this.activeFormSubmissionRequests.has(details.requestId)
    ) {
      return;
    }

    const modifyLoginData = this.modifyLoginCipherFormData.get(details.tabId);
    if (!modifyLoginData) {
      return;
    }

    // console.log("modifyLoginData", modifyLoginData);

    const tab = await BrowserApi.getTab(details.tabId);
    if (
      (await this.notificationsBackground.getEnableChangedPasswordPrompt()) &&
      modifyLoginData.newPassword &&
      !modifyLoginData.username
    ) {
      await this.notificationsBackground.changedPassword(
        {
          command: "bgChangedPassword",
          data: {
            url: modifyLoginData.uri,
            currentPassword: modifyLoginData.password,
            newPassword: modifyLoginData.newPassword,
          },
        },
        { tab },
      );
      this.clearCompletedWebRequest(details.requestId, tab);
      return;
    }

    if (
      (await this.notificationsBackground.getEnableAddedLoginPrompt()) &&
      modifyLoginData.username &&
      (modifyLoginData.password || modifyLoginData.newPassword)
    ) {
      await this.notificationsBackground.addLogin(
        {
          command: "bgAddLogin",
          login: {
            url: modifyLoginData.uri,
            username: modifyLoginData.username,
            password: modifyLoginData.password || modifyLoginData.newPassword,
          },
        },
        { tab },
      );
      this.clearCompletedWebRequest(details.requestId, tab);
    }
  };

  private isInvalidStatusCode = (statusCode: number) => {
    return statusCode < 200 || statusCode >= 300;
  };

  private requestHostIsInvalid = (details: chrome.webRequest.ResourceRequest) => {
    return !details.url?.startsWith("http") || details.tabId < 0;
  };

  private clearCompletedWebRequest = (requestId: string, tab: chrome.tabs.Tab) => {
    try {
      this.activeFormSubmissionRequests.delete(requestId);
      this.modifyLoginCipherFormData.delete(tab.id);
      const tabOrigin = new URL(tab.url).origin;
      this.websiteOriginsWithFields.delete(`${tabOrigin}/*`);
    } catch {
      /* empty */
    } finally {
      this.resetWebRequestsListeners();
    }
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
