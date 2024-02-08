import { Injectable, NgZone } from "@angular/core";
import { Observable } from "rxjs";

import { runInsideAngular } from "@bitwarden/angular/platform/rx-operators/run-inside-angular.operator";

import { BrowserApi } from "./browser-api";

/**
 * This service is used for listening to messages from the background script.
 * It automatically runs all callbacks inside the Angular zone.
 * This should be used instead of `BrowserApi.messageListener` in all popup-components.
 * Not needed for services running in the background script.
 */
@Injectable({ providedIn: "root" })
export class ZonedMessageListenerService {
  constructor(private ngZone: NgZone) {}

  messageListener(
    name: string,
    callback: (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: any,
    ) => boolean | void,
  ) {
    BrowserApi.messageListener(name, (message, sender, sendResponse) => {
      return this.ngZone.run(() => callback(message, sender, sendResponse));
    });
  }

  messageListener$(): Observable<unknown> {
    return BrowserApi.messageListener$().pipe(runInsideAngular(this.ngZone));
  }
}
