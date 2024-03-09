import { BrowserApi } from "../../platform/browser/browser-api";
import { ContextMenuClickedHandler } from "../browser/context-menu-clicked-handler";

import { LockedVaultPendingNotificationsData } from "./abstractions/notification.background";

export default class ContextMenusBackground {
  private contextMenus: typeof chrome.contextMenus;

  constructor(private contextMenuClickedHandler: ContextMenuClickedHandler) {
    this.contextMenus = chrome.contextMenus;
  }

  init() {
    if (!this.contextMenus) {
      return;
    }

    this.contextMenus.onClicked.addListener((info, tab) =>
      this.contextMenuClickedHandler.run(info, tab),
    );

    BrowserApi.messageListener(
      "contextmenus.background",
      (
        msg: { command: string } & LockedVaultPendingNotificationsData,
        sender: chrome.runtime.MessageSender,
      ) => {
        if (msg.command === "unlockCompleted" && msg.target === "contextmenus.background") {
          // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.contextMenuClickedHandler
            .cipherAction(
              msg.commandToRetry.message.contextMenuOnClickData,
              msg.commandToRetry.sender.tab,
            )
            .then(() => {
              void BrowserApi.sendTabMessage(sender.tab.id, "closeNotificationBar");
            });
        }
      },
    );
  }
}
