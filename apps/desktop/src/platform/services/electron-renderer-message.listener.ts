import { fromEventPattern, share } from "rxjs";

import { Message, MessageListener } from "@bitwarden/common/platform/messaging";
import { tagAsExternal } from "@bitwarden/common/platform/messaging/internal";

export class ElectronRendererMessageListener extends MessageListener {
  constructor() {
    super(
      fromEventPattern<Message<object>>(
        (handler) => ipc.platform.onMessage.addListener(handler),
        (handler) => ipc.platform.onMessage.removeListener(handler),
      ).pipe(tagAsExternal, share()),
    );
  }
}
