import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

import { BrowserApi } from "../browser/browser-api";

export default class BrowserMessagingPrivateModeBackgroundService implements MessagingService {
  send(subscriber: string, arg: any = {}) {
    const message = Object.assign({}, { command: subscriber }, arg);
    // (window as any).bitwardenPopupMainMessageListener(message);
    if (typeof (self as any).bitwardenPopupMainMessageListener === "function") {
      (self as any).bitwardenPopupMainMessageListener(message);
    } else {
      return BrowserApi.sendMessage(subscriber, arg);
    }
  }
}
