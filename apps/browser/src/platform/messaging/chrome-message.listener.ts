import { MonoTypeOperatorFunction, identity, map, share } from "rxjs";

import { Message, MessageListener } from "@bitwarden/common/platform/messaging";
import { tagAsExternal } from "@bitwarden/common/platform/messaging/internal";

import { fromChromeEvent } from "../browser/from-chrome-event";

export class ChromeMessageListener extends MessageListener {
  constructor(pipeCustomizer: MonoTypeOperatorFunction<Message<object>> = identity) {
    super(
      fromChromeEvent(chrome.runtime.onMessage).pipe(
        map(([message, sender]) => {
          message ??= {};

          // Force the sender onto the message as long as we won't overwrite anything
          if (!("webExtSender" in message)) {
            message.webExtSender = sender;
          }

          return message;
        }),
        tagAsExternal,
        // TODO: This pipeCustomizer is mostly so the angular context can put runInsideAngular on it
        // should that customization happen before or after the share()? Is there any difference?
        pipeCustomizer,
        share(),
      ),
    );
  }
}
