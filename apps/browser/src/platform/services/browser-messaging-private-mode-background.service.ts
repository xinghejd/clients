import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

import { BrowserApi } from "../browser/browser-api";

export default class BrowserMessagingPrivateModeBackgroundService implements MessagingService {
  send(subscriber: string, arg: any = {}) {
    const message = Object.assign({}, { command: subscriber }, arg);
    if ((this.getGlobalContext() as any).bitwardenPopupMainMessageListener) {
      (this.getGlobalContext() as any).bitwardenPopupMainMessageListener(message); // CG - This might not work
    }
  }

  private isManifestV3(): boolean {
    return BrowserApi.manifestVersion === 3;
  }

  private getGlobalContext(): Window & typeof globalThis {
    return (this.isManifestV3() ? globalThis : window) as Window & typeof globalThis;
  }
}
