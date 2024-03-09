import { BrowserApi } from "../browser/browser-api";

import { BrowserMessagingService as BrowserMessagingServiceInterface } from "./abstractions/browser-messaging.service";

export default class BrowserMessagingService implements BrowserMessagingServiceInterface {
  private subscribers: Record<string, CallableFunction> = {};

  send(subscriber: string, message: any = {}) {
    return BrowserApi.sendMessage(subscriber, message);
  }

  sendTabMessage() {
    // TODO
  }
  subscribe(subscriber: string, callback: CallableFunction) {
    // TODO
  }

  registerSubscribers(subscribers: Record<string, CallableFunction>) {
    // TODO
  }

  unsubscribeAll(subscribers: string[]) {
    // TODO
  }

  deregisterSubscribers(subscriber: string) {
    // TODO
  }

  destroy() {
    // TODO
  }
}
