import { ipcMain } from "electron";
import { fromEventPattern, share } from "rxjs";

import { Message } from "@bitwarden/common/platform/messaging";
import { tagAsExternal } from "@bitwarden/common/platform/messaging/internal";

type Handler = (message: Message<object>) => void;
type EventHandler = (event: Electron.IpcMainEvent, message: Message<object>) => void;
const handlers = new Map<Handler, EventHandler>();

export const fromIpcMainMessaging = () => {
  return fromEventPattern<Message<object>>(
    (handler) => ipcMain.addListener("messagingService", eventHandlerFor(handler)),
    (handler) => ipcMain.removeListener("messagingService", eventHandlerFor(handler)),
  ).pipe(tagAsExternal, share());
};

function eventHandlerFor<T extends Message<object>>(handler: (message: T) => void) {
  const eventHandler = (_event: Electron.IpcMainEvent, message: T) => {
    if (message.command) {
      handler(message);
    }
  };
  handlers.set(handler, eventHandler);
  return eventHandler;
}
