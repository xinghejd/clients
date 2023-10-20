import { Injectable, NgZone } from "@angular/core";
import { Observable } from "rxjs";

import { BrowserApi } from "./browser-api";
import { runInsideAngular } from "./run-inside-angular.operator";

@Injectable({ providedIn: "root" })
export class BrowserMessagingApiService {
  constructor(private ngZone: NgZone) {}

  messageListener(
    name: string,
    callback: (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: any
    ) => boolean | void
  ) {
    BrowserApi.messageListener(name, (message, sender, sendResponse) => {
      return this.ngZone.run(() => callback(message, sender, sendResponse));
    });
  }

  messageListener$(): Observable<unknown> {
    return BrowserApi.messageListener$().pipe(runInsideAngular(this.ngZone));
  }
}
