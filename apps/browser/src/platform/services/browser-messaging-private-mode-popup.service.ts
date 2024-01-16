import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

export default class BrowserMessagingPrivateModePopupService implements MessagingService {
  send(subscriber: string, arg: any = {}) {
    chrome.runtime.sendMessage({ command: subscriber, ...arg }); // TODO CG - This needs to be investigated, currently it sends in a local capacity, not sure if that's valid.

    // const message = Object.assign({}, { command: subscriber }, arg);
    // (globalThis as any).bitwardenBackgroundMessageListener(message);
  }
}
