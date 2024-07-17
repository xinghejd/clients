import { firstValueFrom } from "rxjs";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { ScriptInjectorService } from "../../platform/services/abstractions/script-injector.service";
import AutofillPageDetails from "../models/autofill-page-details";
import { AutofillService } from "../services/abstractions/autofill.service";

export class AutoSubmitLoginBackground {
  private validIdpHosts: Set<string> = new Set([
    "https://top-frame.local:8890",
    "https://dev-836655.oktapreview.com",
  ]);
  private validAutoSubmitHosts: Set<string> = new Set();
  private currentAutoSubmitHostData: { url?: string; tabId?: number; origin?: string } = {};

  constructor(
    private logService: LogService,
    private autofillService: AutofillService,
    private scriptInjectorService: ScriptInjectorService,
    private authService: AuthService,
    private configService: ConfigService,
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
  }

  handleOnBeforeRequest = (details: chrome.webRequest.WebRequestBodyDetails) => {
    const requestInitiator =
      details.initiator || (details as browser.webRequest._OnBeforeRequestDetails).originUrl;
    const isValidInitiator = this.isValidInitiator(requestInitiator);

    if (this.validAutoSubmitHosts.size > 0 && isValidInitiator && details.method === "POST") {
      this.validAutoSubmitHosts.clear();
      this.currentAutoSubmitHostData = {};
      return;
    }

    if (
      this.validAutoSubmitHosts.size > 0 &&
      details.type === "main_frame" &&
      (!isValidInitiator || !this.isValidAutoSubmitHost(details.url))
    ) {
      this.validAutoSubmitHosts.clear();
      this.currentAutoSubmitHostData = {};
      return;
    }

    if (
      isValidInitiator &&
      this.shouldRouteTriggerAutoSubmit(details.type, details.url, requestInitiator)
    ) {
      if (details.type === "main_frame") {
        this.currentAutoSubmitHostData = {
          url: details.url,
          tabId: details.tabId,
          origin: this.getUrlOrigin(details.url),
        };
      }
      const urlOrigin = this.getUrlOrigin(details.url);
      this.validAutoSubmitHosts.add(urlOrigin);
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

    const requestInitiator =
      details.initiator || (details as browser.webRequest._OnCompletedDetails).originUrl;
    if (
      this.isValidInitiator(requestInitiator) &&
      this.shouldRouteTriggerAutoSubmit(details.type, details.url, requestInitiator)
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

  private isValidInitiator = (host: string) => {
    return this.isValidIdpHost(host) || this.isValidAutoSubmitHost(host);
  };

  private isValidIdpHost = (host: string) => {
    if (!host) {
      return false;
    }

    const origin = this.getUrlOrigin(host);
    if (!origin) {
      return false;
    }

    for (const validIdpHost of this.validIdpHosts) {
      if (origin === validIdpHost) {
        return true;
      }
    }

    return false;
  };

  private isValidAutoSubmitHost = (host: string) => {
    if (!host) {
      return false;
    }

    const origin = this.getUrlOrigin(host);
    if (!origin) {
      return false;
    }

    for (const validAutoSubmitHost of this.validAutoSubmitHosts) {
      if (origin === validAutoSubmitHost) {
        return true;
      }
    }

    return false;
  };

  private removeUrlFromAutoSubmitHosts = (url: string) => {
    this.validAutoSubmitHosts.delete(this.getUrlOrigin(url));
  };

  private shouldRouteTriggerAutoSubmit = (requestType: string, url: string, initiator: string) => {
    if (requestType === "main_frame") {
      try {
        const urlObj = new URL(url);
        return urlObj.search.indexOf("autofill=1") !== -1;
      } catch {
        return false;
      }
    }

    return this.isValidAutoSubmitHost(initiator);
  };

  private getUrlOrigin = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.origin;
    } catch {
      return "";
    }
  };
}
