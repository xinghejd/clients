import { firstValueFrom, Observable } from "rxjs";

import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { ScriptInjectorService } from "../../platform/services/abstractions/script-injector.service";
import { AutofillService } from "../services/abstractions/autofill.service";

import {
  AutoSubmitLoginBackground as AutoSubmitLoginBackgroundAbstraction,
  AutoSubmitLoginBackgroundExtensionMessageHandlers,
  AutoSubmitLoginMessage,
} from "./abstractions/auto-submit-login.background";

export class AutoSubmitLoginBackground implements AutoSubmitLoginBackgroundAbstraction {
  private ipdAutoSubmitLoginPolicy$: Observable<Policy>;
  private validIdpHosts: Set<string> = new Set([
    "top-frame.local:8890",
    "dev-836655.oktapreview.com",
  ]);
  private validAutoSubmitHosts: Set<string> = new Set();
  private mostRecentIdpHost: { url?: string; tabId?: number } = {};
  private currentAutoSubmitHostData: { url?: string; tabId?: number } = {};
  private readonly isSafariBrowser: boolean = false;
  private readonly extensionMessageHandlers: AutoSubmitLoginBackgroundExtensionMessageHandlers = {
    triggerAutoSubmitLogin: ({ message, sender }) => this.triggerAutoSubmitLogin(message, sender),
    multiStepAutoSubmitLoginComplete: ({ sender }) =>
      this.handleMultiStepAutoSubmitLoginComplete(sender),
  };

  constructor(
    private logService: LogService,
    private autofillService: AutofillService,
    private scriptInjectorService: ScriptInjectorService,
    private authService: AuthService,
    private configService: ConfigService,
    private platformUtilsService: PlatformUtilsService,
    private policyService: PolicyService,
  ) {
    this.isSafariBrowser = this.platformUtilsService.isSafari();
  }

  async init() {
    const featureFlagEnabled = await this.configService.getFeatureFlag(
      FeatureFlag.IdpAutoSubmitLogin,
    );
    if (!featureFlagEnabled) {
      return;
    }

    this.ipdAutoSubmitLoginPolicy$ = this.policyService.get$(PolicyType.AutomaticAppLogIn);
    this.ipdAutoSubmitLoginPolicy$.subscribe((policy) => {
      if (!policy.enabled) {
        this.destroy();
        return;
      }

      this.applyPolicyToActiveUser(policy).catch((error) => this.logService.error(error));
    });
  }

  private applyPolicyToActiveUser = async (policy: Policy) => {
    const policyAppliesToUser = await firstValueFrom(
      this.policyService.policyAppliesToActiveUser$(PolicyType.AutomaticAppLogIn),
    );

    if (!policyAppliesToUser) {
      this.destroy();
      return;
    }

    await this.setupAutoSubmitLoginListeners(policy);
  };

  private setupAutoSubmitLoginListeners = async (policy: Policy) => {
    if (!policy?.data.idpHost) {
      return;
    }

    this.parseIpdHostsFromPolicy(policy.data.idpHost);
    if (!this.validIdpHosts.size) {
      return;
    }

    BrowserApi.addListener(chrome.runtime.onMessage, this.handleExtensionMessage);
    chrome.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequest, {
      urls: ["<all_urls>"],
      types: ["main_frame", "sub_frame"],
    });
    chrome.webRequest.onBeforeRedirect.addListener(this.handleWebRequestOnBeforeRedirect, {
      urls: ["<all_urls>"],
      types: ["main_frame", "sub_frame"],
    });

    if (this.isSafariBrowser) {
      this.initSafari().catch((error) => this.logService.error(error));
    }
  };

  private parseIpdHostsFromPolicy = (idpHost: string) => {
    if (!idpHost) {
      return;
    }

    const urls = idpHost.split(",");
    urls.forEach((url) => {
      const host = this.getUrlHost(url?.trim());
      if (host) {
        this.validIdpHosts.add(host);
      }
    });
  };

  private handleOnBeforeRequest = (details: chrome.webRequest.WebRequestBodyDetails) => {
    const requestInitiator = this.getRequestInitiator(details);
    const isValidInitiator = this.isValidInitiator(requestInitiator);

    if (
      this.postRequestEncounteredAfterSubmission(details, isValidInitiator) ||
      this.requestRedirectsToInvalidHost(details, isValidInitiator)
    ) {
      this.clearAutoSubmitHostData();
      return;
    }

    if (isValidInitiator && this.shouldRouteTriggerAutoSubmit(details, requestInitiator)) {
      this.setupAutoSubmitFlow(details);
      return;
    }

    this.disableAutoSubmitFlow(requestInitiator, details).catch((error) =>
      this.logService.error(error),
    );
  };

  private postRequestEncounteredAfterSubmission = (
    details: chrome.webRequest.WebRequestBodyDetails,
    isValidInitiator: boolean,
  ) => {
    return details.method === "POST" && this.validAutoSubmitHosts.size > 0 && isValidInitiator;
  };

  private requestRedirectsToInvalidHost = (
    details: chrome.webRequest.WebRequestBodyDetails,
    isValidInitiator: boolean,
  ) => {
    return (
      this.validAutoSubmitHosts.size > 0 &&
      this.isRequestInMainFrame(details) &&
      (!isValidInitiator || !this.isValidAutoSubmitHost(details.url))
    );
  };

  private setupAutoSubmitFlow = (details: chrome.webRequest.WebRequestBodyDetails) => {
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
  };

  private disableAutoSubmitFlow = async (
    requestInitiator: string,
    details: chrome.webRequest.WebRequestBodyDetails,
  ) => {
    if (this.isValidAutoSubmitHost(requestInitiator)) {
      this.removeUrlFromAutoSubmitHosts(requestInitiator);
      return;
    }

    const tab = await BrowserApi.getTab(details.tabId);
    if (this.isValidAutoSubmitHost(tab?.url)) {
      this.removeUrlFromAutoSubmitHosts(tab.url);
    }
  };

  private clearAutoSubmitHostData = () => {
    this.validAutoSubmitHosts.clear();
    this.currentAutoSubmitHostData = {};
    this.mostRecentIdpHost = {};
  };

  private handleWebRequestOnBeforeRedirect = (
    details: chrome.webRequest.WebRedirectionResponseDetails,
  ) => {
    if (this.isRequestInMainFrame(details) && this.urlContainsAutoFillParam(details.redirectUrl)) {
      this.validAutoSubmitHosts.add(this.getUrlHost(details.redirectUrl));
      this.validAutoSubmitHosts.add(this.getUrlHost(details.url));
    }
  };

  private handleAutoSubmitHostNavigationCompleted = (
    details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
  ) => {
    if (
      details.tabId !== this.currentAutoSubmitHostData.tabId ||
      !this.urlContainsAutoFillParam(details.url)
    ) {
      return;
    }

    this.injectAutoSubmitLoginScript(details.tabId).catch((error) => this.logService.error(error));
    chrome.webNavigation.onCompleted.removeListener(this.handleAutoSubmitHostNavigationCompleted);
  };

  private injectAutoSubmitLoginScript = async (tabId: number) => {
    if ((await this.getAuthStatus()) !== AuthenticationStatus.Unlocked) {
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

  private getAuthStatus = async () => {
    return firstValueFrom(this.authService.activeAccountStatus$);
  };

  private isValidInitiator = (url: string) => {
    return this.isValidIdpHost(url) || this.isValidAutoSubmitHost(url);
  };

  private isValidIdpHost = (url: string) => {
    const host = this.getUrlHost(url);
    if (!host) {
      return false;
    }

    return this.validIdpHosts.has(host);
  };

  private isValidAutoSubmitHost = (url: string) => {
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
        this.triggerAutoSubmitAfterRedirectOnSafari(details.url)
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
    if (!url) {
      return "";
    }

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

  private triggerAutoSubmitLogin = async (
    message: AutoSubmitLoginMessage,
    sender: chrome.runtime.MessageSender,
  ) => {
    await this.autofillService.doAutoFillOnTab(
      [
        {
          frameId: sender.frameId,
          tab: sender.tab,
          details: message.pageDetails,
        },
      ],
      sender.tab,
      true,
      true,
    );
  };

  private handleMultiStepAutoSubmitLoginComplete = async (sender: chrome.runtime.MessageSender) => {
    this.removeUrlFromAutoSubmitHosts(sender.url);
  };

  private handleExtensionMessage = async (
    message: AutoSubmitLoginMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    const { tab, url } = sender;
    if (tab?.id !== this.currentAutoSubmitHostData.tabId || !this.isValidAutoSubmitHost(url)) {
      return;
    }

    const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
    if (!handler) {
      return null;
    }

    const messageResponse = handler({ message, sender });
    if (typeof messageResponse === "undefined") {
      return null;
    }

    Promise.resolve(messageResponse)
      .then((response) => sendResponse(response))
      .catch(this.logService.error);
    return true;
  };

  private async initSafari() {
    const currentTab = await BrowserApi.getTabFromCurrentWindow();
    this.setMostRecentIdpHost(currentTab.url, currentTab.id);

    chrome.tabs.onActivated.addListener(this.handleSafariTabOnActivated);
    chrome.tabs.onUpdated.addListener(this.handleSafariTabOnUpdated);
    chrome.webNavigation.onCompleted.addListener(this.handleSafariWebNavigationOnCompleted);
  }

  private setMostRecentIdpHost(url: string, tabId: number) {
    if (this.isValidIdpHost(url)) {
      this.mostRecentIdpHost = { url, tabId };
    }
  }

  private handleSafariTabOnActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    const tab = await BrowserApi.getTab(activeInfo.tabId);
    this.setMostRecentIdpHost(tab.url, tab.id);
  };

  private handleSafariTabOnUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    this.setMostRecentIdpHost(changeInfo.url, tabId);
  };

  private handleSafariWebNavigationOnCompleted = (
    details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
  ) => {
    if (details.frameId !== 0) {
      return;
    }

    if (this.isValidIdpHost(details.url)) {
      this.validAutoSubmitHosts.clear();
      this.mostRecentIdpHost = {
        url: details.url,
        tabId: details.tabId,
      };
      chrome.tabs.onRemoved.addListener(this.handleSafariTabOnRemoved);
    }
  };

  private handleSafariTabOnRemoved = (tabId: number) => {
    if (this.currentAutoSubmitHostData.tabId === tabId) {
      this.clearAutoSubmitHostData();
      chrome.tabs.onRemoved.removeListener(this.handleSafariTabOnRemoved);
    }
  };

  private triggerAutoSubmitAfterRedirectOnSafari = (url: string) => {
    return this.isSafariBrowser && this.isValidAutoSubmitHost(url);
  };

  private destroy() {
    BrowserApi.removeListener(chrome.runtime.onMessage, this.handleExtensionMessage);
    chrome.webRequest.onBeforeRequest.removeListener(this.handleOnBeforeRequest);
    chrome.webRequest.onBeforeRedirect.removeListener(this.handleWebRequestOnBeforeRedirect);
    chrome.webNavigation.onCompleted.removeListener(this.handleAutoSubmitHostNavigationCompleted);
    chrome.tabs.onActivated.removeListener(this.handleSafariTabOnActivated);
    chrome.tabs.onUpdated.removeListener(this.handleSafariTabOnUpdated);
    chrome.webNavigation.onCompleted.removeListener(this.handleSafariWebNavigationOnCompleted);
    chrome.tabs.onRemoved.removeListener(this.handleSafariTabOnRemoved);
  }
}
