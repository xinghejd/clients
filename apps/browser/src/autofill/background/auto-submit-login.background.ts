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
  private isSafariBrowser: boolean = false;

  constructor(
    private logService: LogService,
    private autofillService: AutofillService,
    private scriptInjectorService: ScriptInjectorService,
    private authService: AuthService,
    private configService: ConfigService,
    private platformUtilsService: PlatformUtilsService,
  ) {
    this.isSafariBrowser = this.platformUtilsService.isSafari();
    this.configService
      .getFeatureFlag(FeatureFlag.AutoSubmitLogin)
      .then((enabled) => {
        if (enabled) {
          this.init();
        }
      })
      .catch((error) => this.logService.error(error));

    // this.init();
  }

  init() {
    BrowserApi.addListener(chrome.runtime.onMessage, this.handleExtensionMessage);
    chrome.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequest, {
      urls: ["<all_urls>"],
      types: ["main_frame", "sub_frame"],
    });

    if (this.isSafariBrowser) {
      this.initSafari().catch((error) => this.logService.error(error));
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
      const autoSubmitHost = this.getUrlHost(details.url);
      this.validAutoSubmitHosts.add(autoSubmitHost);
      chrome.webNavigation.onCompleted.removeListener(this.handleAutoSubmitHostNavigationCompleted);
      chrome.webNavigation.onCompleted.addListener(this.handleAutoSubmitHostNavigationCompleted, {
        url: [{ hostEquals: autoSubmitHost }],
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

  handleAutoSubmitHostNavigationCompleted = (
    details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
  ) => {
    if (
      details.tabId !== this.currentAutoSubmitHostData.tabId ||
      !this.urlContainsAutoFillParam(details.url)
    ) {
      return;
    }

    this.triggerAutoSubmitLogin(details.tabId).catch((error) => this.logService.error(error));
    chrome.webNavigation.onCompleted.removeListener(this.handleAutoSubmitHostNavigationCompleted);
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
      return (
        this.urlContainsAutoFillParam(details.url) ||
        (this.isSafariBrowser &&
          (this.isValidAutoSubmitHost(details.url) ||
            this.validAutoSubmitHosts.has(this.getUrlHost(details.url))))
      );
    }

    return this.isValidAutoSubmitHost(initiator);
  };

  private urlContainsAutoFillParam = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.search.indexOf("autofill=1") !== -1;
    } catch {
      return false;
    }
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
    if (!this.isSafariBrowser) {
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
    if (this.isSafariBrowser) {
      return details.frameId === 0;
    }

    return details.type === "main_frame";
  };

  private async initSafari() {
    const currentTab = await BrowserApi.getTabFromCurrentWindow();
    this.setMostRecentIdpHost(currentTab.url, currentTab.id);

    chrome.tabs.onActivated.addListener(this.handleTabOnActivated);
    chrome.tabs.onUpdated.addListener(this.handleTabOnUpdated);
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId !== 0) {
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
        if (
          this.isRequestInMainFrame(details) &&
          this.urlContainsAutoFillParam(details.redirectUrl)
        ) {
          this.validAutoSubmitHosts.add(this.getUrlHost(details.redirectUrl));
          this.validAutoSubmitHosts.add(this.getUrlHost(details.url));
        }
      },
      {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"],
      },
    );
  }

  private setMostRecentIdpHost(url: string, tabId: number) {
    if (this.isValidIdpHost(url)) {
      this.mostRecentIdpHost = { url, tabId };
    }
  }

  private handleTabOnActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    const tab = await BrowserApi.getTab(activeInfo.tabId);
    this.setMostRecentIdpHost(tab.url, tab.id);
  };

  private handleTabOnUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    this.setMostRecentIdpHost(changeInfo.url, tabId);
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
