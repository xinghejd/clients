import { ClientType, DeviceType } from "@bitwarden/common/enums";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { SafariApp } from "../../browser/safariApp";
import { BrowserApi } from "../browser/browser-api";

import BrowserClipboardService from "./browser-clipboard.service";

export default class BrowserPlatformUtilsService implements PlatformUtilsService {
  private static deviceCache: DeviceType = null;

  constructor(
    private messagingService: MessagingService,
    private clipboardWriteCallback: (clipboardValue: string, clearMs: number) => void,
    private biometricCallback: () => Promise<boolean>,
    private globalContext: Window & typeof globalThis,
  ) {}

  static getDevice(win: Window & typeof globalThis): DeviceType {
    if (this.deviceCache) {
      return this.deviceCache;
    }

    if (BrowserPlatformUtilsService.isFirefox()) {
      this.deviceCache = DeviceType.FirefoxExtension;
    } else if (BrowserPlatformUtilsService.isOpera(win)) {
      this.deviceCache = DeviceType.OperaExtension;
    } else if (BrowserPlatformUtilsService.isEdge()) {
      this.deviceCache = DeviceType.EdgeExtension;
    } else if (BrowserPlatformUtilsService.isVivaldi()) {
      this.deviceCache = DeviceType.VivaldiExtension;
    } else if (BrowserPlatformUtilsService.isChrome(win)) {
      this.deviceCache = DeviceType.ChromeExtension;
    } else if (BrowserPlatformUtilsService.isSafari(win)) {
      this.deviceCache = DeviceType.SafariExtension;
    }

    return this.deviceCache;
  }

  getDevice(): DeviceType {
    return BrowserPlatformUtilsService.getDevice(this.globalContext);
  }

  getDeviceString(): string {
    const device = DeviceType[this.getDevice()].toLowerCase();
    return device.replace("extension", "");
  }

  getClientType(): ClientType {
    return ClientType.Browser;
  }

  /**
   * @deprecated Do not call this directly, use getDevice() instead
   */
  static isFirefox(): boolean {
    return (
      navigator.userAgent.indexOf(" Firefox/") !== -1 ||
      navigator.userAgent.indexOf(" Gecko/") !== -1
    );
  }

  isFirefox(): boolean {
    return this.getDevice() === DeviceType.FirefoxExtension;
  }

  /**
   * @deprecated Do not call this directly, use getDevice() instead
   */
  private static isChrome(win: Window & typeof globalThis): boolean {
    return win.chrome && navigator.userAgent.indexOf(" Chrome/") !== -1;
  }

  isChrome(): boolean {
    return this.getDevice() === DeviceType.ChromeExtension;
  }

  /**
   * @deprecated Do not call this directly, use getDevice() instead
   */
  private static isEdge(): boolean {
    return navigator.userAgent.indexOf(" Edg/") !== -1;
  }

  isEdge(): boolean {
    return this.getDevice() === DeviceType.EdgeExtension;
  }

  /**
   * @deprecated Do not call this directly, use getDevice() instead
   */
  private static isOpera(win: Window & typeof globalThis): boolean {
    return (
      (!!win.opr && !!win.opr.addons) || !!win.opera || navigator.userAgent.indexOf(" OPR/") >= 0
    );
  }

  isOpera(): boolean {
    return this.getDevice() === DeviceType.OperaExtension;
  }

  /**
   * @deprecated Do not call this directly, use getDevice() instead
   */
  private static isVivaldi(): boolean {
    return navigator.userAgent.indexOf(" Vivaldi/") !== -1;
  }

  isVivaldi(): boolean {
    return this.getDevice() === DeviceType.VivaldiExtension;
  }

  /**
   * @deprecated Do not call this directly, use getDevice() instead
   */
  static isSafari(win: Window & typeof globalThis): boolean {
    // Opera masquerades as Safari, so make sure we're not there first
    return (
      !BrowserPlatformUtilsService.isOpera(win) && navigator.userAgent.indexOf(" Safari/") !== -1
    );
  }

  private static safariVersion(): string {
    return navigator.userAgent.match("Version/([0-9.]*)")?.[1];
  }

  /**
   * Safari previous to version 16.1 had a bug which caused artifacts on hover in large extension popups.
   * https://bugs.webkit.org/show_bug.cgi?id=218704
   */
  static shouldApplySafariHeightFix(win: Window & typeof globalThis): boolean {
    if (BrowserPlatformUtilsService.getDevice(win) !== DeviceType.SafariExtension) {
      return false;
    }

    const version = BrowserPlatformUtilsService.safariVersion();
    const parts = version?.split(".")?.map((v) => Number(v));
    return parts?.[0] < 16 || (parts?.[0] === 16 && parts?.[1] === 0);
  }

  isSafari(): boolean {
    return this.getDevice() === DeviceType.SafariExtension;
  }

  isIE(): boolean {
    return false;
  }

  isMacAppStore(): boolean {
    return false;
  }

  async isViewOpen(): Promise<boolean> {
    if (await BrowserApi.isPopupOpen()) {
      return true;
    }

    if (this.isSafari()) {
      return false;
    }

    // Opera has "sidebar_panel" as a ViewType but doesn't currently work
    if (this.isFirefox() && BrowserApi.getExtensionViews({ type: "sidebar" }).length > 0) {
      return true;
    }

    // Opera sidebar has type of "tab" (will stick around for a while after closing sidebar)
    const tabOpen = BrowserApi.getExtensionViews({ type: "tab" }).length > 0;
    return tabOpen;
  }

  lockTimeout(): number {
    return null;
  }

  launchUri(uri: string, options?: any): void {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BrowserApi.createNewTab(uri, options && options.extensionPage === true);
  }

  getApplicationVersion(): Promise<string> {
    return Promise.resolve(BrowserApi.getApplicationVersion());
  }

  async getApplicationVersionNumber(): Promise<string> {
    return (await this.getApplicationVersion()).split(RegExp("[+|-]"))[0].trim();
  }

  supportsWebAuthn(win: Window): boolean {
    return typeof PublicKeyCredential !== "undefined";
  }

  supportsDuo(): boolean {
    return true;
  }

  showToast(
    type: "error" | "success" | "warning" | "info",
    title: string,
    text: string | string[],
    options?: any,
  ): void {
    this.messagingService.send("showToast", {
      text: text,
      title: title,
      type: type,
      options: options,
    });
  }

  isDev(): boolean {
    return process.env.ENV === "development";
  }

  isSelfHost(): boolean {
    return false;
  }

  copyToClipboard(text: string, options?: any): void {
    let win = this.globalContext;
    if (options && (options.window || options.win)) {
      win = options.window || options.win;
    }
    const clearing = options ? !!options.clearing : false;
    const clearMs: number = options && options.clearMs ? options.clearMs : null;

    if (this.isSafari()) {
      SafariApp.sendMessageToApp("copyToClipboard", text)
        .then(() => {
          if (!clearing && this.clipboardWriteCallback != null) {
            this.clipboardWriteCallback(text, clearMs);
          }
        })
        .catch(() => {});
      return;
    }

    if (this.isChrome() && text === "") {
      text = "\u0000";
    }

    BrowserClipboardService.copy(win, text)
      .then(() => {
        if (!clearing && this.clipboardWriteCallback != null) {
          this.clipboardWriteCallback(text, clearMs);
        }
      })
      .catch(() => {});
  }

  async readFromClipboard(options?: any): Promise<string> {
    let win = this.globalContext;
    if (options && (options.window || options.win)) {
      win = options.window || options.win;
    }

    if (this.isSafari()) {
      return await SafariApp.sendMessageToApp("readFromClipboard");
    }

    return await BrowserClipboardService.read(win);
  }

  async supportsBiometric() {
    const platformInfo = await BrowserApi.getPlatformInfo();
    if (platformInfo.os === "android") {
      return false;
    }

    return true;
  }

  authenticateBiometric() {
    return this.biometricCallback();
  }

  supportsSecureStorage(): boolean {
    return false;
  }

  async getAutofillKeyboardShortcut(): Promise<string> {
    let autofillCommand: string;
    // You can not change the command in Safari or obtain it programmatically
    if (this.isSafari()) {
      autofillCommand = "Cmd+Shift+L";
    } else if (this.isFirefox()) {
      autofillCommand = (await browser.commands.getAll()).find(
        (c) => c.name === "autofill_login",
      ).shortcut;
      // Firefox is returning Ctrl instead of Cmd for the modifier key on macOS if
      // the command is the default one set on installation.
      if (
        (await browser.runtime.getPlatformInfo()).os === "mac" &&
        autofillCommand === "Ctrl+Shift+L"
      ) {
        autofillCommand = "Cmd+Shift+L";
      }
    } else {
      await new Promise((resolve) =>
        chrome.commands.getAll((c) =>
          resolve((autofillCommand = c.find((c) => c.name === "autofill_login").shortcut)),
        ),
      );
    }
    return autofillCommand;
  }
}
