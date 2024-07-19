import { firstValueFrom } from "rxjs";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { ScriptInjectorService } from "../../platform/services/abstractions/script-injector.service";
import AutofillPageDetails from "../models/autofill-page-details";
import { AutofillService } from "../services/abstractions/autofill.service";

export class AutoSubmitLoginBackground {
  private validIdpHosts: Set<string> = new Set([
    "top-frame.local:8890",
    "dev-836655.oktapreview.com",
  ]);
  private validAutoSubmitHosts: Set<string> = new Set();
  private mostRecentIdpHost: { url?: string; tabId?: number } = {};
  private currentAutoSubmitHostData: { url?: string; tabId?: number } = {};

  constructor(
    private logService: LogService,
    private autofillService: AutofillService,
    private scriptInjectorService: ScriptInjectorService,
    private authService: AuthService,
    private configService: ConfigService,
    private platformUtilsService: PlatformUtilsService,
  ) {
    this.configService
      .getFeatureFlag(FeatureFlag.AutoSubmitLogin)
      .then((enabled) => {
        if (enabled) {
          this.init();
        }
      })
      .catch((error) => this.logService.error(error));
  }

  init() {
    chrome.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequest, {
      urls: ["<all_urls>"],
      types: ["main_frame", "sub_frame"],
    });

    BrowserApi.addListener(chrome.runtime.onMessage, this.handleExtensionMessage);

    if (this.platformUtilsService.isSafari()) {
      BrowserApi.getTabFromCurrentWindow()
        .then((tab) => {
          if (!tab) {
            return;
          }

          if (this.validIdpHosts.has(this.getUrlHost(tab.url))) {
            this.mostRecentIdpHost = {
              url: tab.url,
              tabId: tab.id,
            };
          }
        })
        .catch((error) => this.logService.error(error));
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId !== 0) {
          return;
        }

        if (this.mostRecentIdpHost.tabId && this.mostRecentIdpHost.tabId !== details.tabId) {
          return;
        }

        if (this.mostRecentIdpHost.url && this.mostRecentIdpHost.url !== details.url) {
          this.mostRecentIdpHost = {};
          return;
        }

        if (this.isValidIdpHost(details.url)) {
          this.validAutoSubmitHosts.clear();
          this.mostRecentIdpHost = {
            url: details.url,
            tabId: details.tabId,
          };
          chrome.tabs.onRemoved.addListener(this.handleTabOnRemoved);
        }
      });
      chrome.webRequest.onBeforeRedirect.addListener(
        (details) => {
          if (this.isRequestInMainFrame(details)) {
            try {
              const urlObj = new URL(details.redirectUrl);
              if (urlObj.search.indexOf("autofill=1") !== -1) {
                this.validAutoSubmitHosts.add(this.getUrlHost(details.redirectUrl));

                // This should be a different set, validRedirectHosts potentially.
                this.validAutoSubmitHosts.add(this.getUrlHost(details.url));
              }
            } catch {
              // do nothing
            }
          }
        },
        {
          urls: ["<all_urls>"],
          types: ["main_frame", "sub_frame"],
        },
      );
    }
  }

  handleOnBeforeRequest = (details: chrome.webRequest.WebRequestBodyDetails) => {
    const requestInitiator = this.getRequestInitiator(details);
    const isValidInitiator = this.isValidInitiator(requestInitiator);

    if (this.validAutoSubmitHosts.size > 0 && isValidInitiator && details.method === "POST") {
      this.validAutoSubmitHosts.clear();
      this.currentAutoSubmitHostData = {};
      return;
    }

    if (
      this.validAutoSubmitHosts.size > 0 &&
      this.isRequestInMainFrame(details) &&
      (!isValidInitiator || !this.isValidAutoSubmitHost(details.url))
    ) {
      this.validAutoSubmitHosts.clear();
      this.currentAutoSubmitHostData = {};
      return;
    }

    if (isValidInitiator && this.shouldRouteTriggerAutoSubmit(details, requestInitiator)) {
      if (this.isRequestInMainFrame(details)) {
        this.currentAutoSubmitHostData = {
          url: details.url,
          tabId: details.tabId,
        };
      }
      this.validAutoSubmitHosts.add(this.getUrlHost(details.url));
      chrome.webRequest.onCompleted.addListener(this.handleWebRequestOnCompleted, {
        tabId: details.tabId,
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"],
      });

      return;
    }

    if (this.isValidAutoSubmitHost(requestInitiator)) {
      this.removeUrlFromAutoSubmitHosts(requestInitiator);
      return;
    }

    BrowserApi.getTab(details.tabId)
      .then((tab) => {
        if (tab && this.isValidAutoSubmitHost(tab.url)) {
          this.removeUrlFromAutoSubmitHosts(tab.url);
        }
      })
      .catch((error) => this.logService.error(error));
  };

  handleWebRequestOnCompleted = (details: chrome.webRequest.WebResponseDetails) => {
    chrome.webRequest.onCompleted.removeListener(this.handleWebRequestOnCompleted);

    const requestInitiator = this.getRequestInitiator(details);

    if (
      this.isValidInitiator(requestInitiator) &&
      this.shouldRouteTriggerAutoSubmit(details, requestInitiator)
    ) {
      chrome.webNavigation.onCompleted.addListener(this.handleWebNavigationOnCompleted);
    }
  };

  handleWebNavigationOnCompleted = (
    details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
  ) => {
    if (details.tabId !== this.currentAutoSubmitHostData.tabId) {
      return;
    }

    this.triggerAutoSubmitLogin(details.tabId).catch((error) => this.logService.error(error));
    chrome.webNavigation.onCompleted.removeListener(this.handleWebNavigationOnCompleted);
  };

  getAuthStatus = async () => {
    return firstValueFrom(this.authService.activeAccountStatus$);
  };

  triggerAutoSubmitLogin = async (tabId: number) => {
    const authStatus = await this.getAuthStatus();
    if (authStatus !== AuthenticationStatus.Unlocked) {
      return;
    }

    await this.scriptInjectorService.inject({
      tabId: tabId,
      injectDetails: {
        file: "content/auto-submit-login.js",
        runAt: "document_start",
        frame: "all_frames",
      },
    });
  };

  handleExtensionMessage = async (
    message: {
      command: string;
      pageDetails: AutofillPageDetails;
    },
    sender: chrome.runtime.MessageSender,
  ) => {
    const { tab, url } = sender;

    if (tab?.id !== this.currentAutoSubmitHostData.tabId || !this.isValidAutoSubmitHost(url)) {
      return;
    }

    if (message.command === "triggerAutoSubmitLogin") {
      await this.autofillService.doAutoFillOnTab(
        [
          {
            frameId: sender.frameId,
            tab,
            details: message.pageDetails,
          },
        ],
        tab,
        true,
        true,
      );
    }

    if (message.command === "multiStepAutoSubmitLoginComplete") {
      this.removeUrlFromAutoSubmitHosts(url);
    }
  };

  private isValidInitiator = (url: string) => {
    return this.isValidIdpHost(url) || this.isValidAutoSubmitHost(url);
  };

  private isValidIdpHost = (url: string) => {
    if (!url) {
      return false;
    }

    const host = this.getUrlHost(url);
    if (!host) {
      return false;
    }

    return this.validIdpHosts.has(host);
  };

  private isValidAutoSubmitHost = (url: string) => {
    if (!url) {
      return false;
    }

    const host = this.getUrlHost(url);
    if (!host) {
      return false;
    }

    return this.validAutoSubmitHosts.has(host);
  };

  private removeUrlFromAutoSubmitHosts = (url: string) => {
    this.validAutoSubmitHosts.delete(this.getUrlHost(url));
  };

  private shouldRouteTriggerAutoSubmit = (
    details: chrome.webRequest.ResourceRequest,
    initiator: string,
  ) => {
    if (this.isRequestInMainFrame(details)) {
      try {
        const urlObj = new URL(details.url);
        return (
          urlObj.search.indexOf("autofill=1") !== -1 ||
          (this.platformUtilsService.isSafari() && this.isValidAutoSubmitHost(details.url))
        );
      } catch {
        return false;
      }
    }

    return this.isValidAutoSubmitHost(initiator);
  };

  private getUrlHost = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return "";
    }
  };

  private getRequestInitiator = (details: chrome.webRequest.ResourceRequest) => {
    if (!this.platformUtilsService.isSafari()) {
      return details.initiator || (details as browser.webRequest._OnBeforeRequestDetails).originUrl;
    }

    if (this.isRequestInMainFrame(details)) {
      return this.mostRecentIdpHost.url;
    }

    if (!this.mostRecentIdpHost.url) {
      return "";
    }

    return details.url;
  };

  private isRequestInMainFrame = (details: chrome.webRequest.ResourceRequest) => {
    if (this.platformUtilsService.isSafari()) {
      return details.frameId === 0;
    }

    return details.type === "main_frame";
  };

  private handleTabOnRemoved = (tabId: number) => {
    if (this.currentAutoSubmitHostData.tabId === tabId) {
      this.validAutoSubmitHosts.clear();
      this.currentAutoSubmitHostData = {};
      this.mostRecentIdpHost = {};
      chrome.tabs.onRemoved.removeListener(this.handleTabOnRemoved);
    }
  };
}
