import { Observable, filter, firstValueFrom, tap } from "rxjs";

import { AppIdService as AppIdServiceAbstraction } from "../abstractions/app-id.service";
import { Utils } from "../misc/utils";
import { APPLICATION_ID_DISK, GlobalStateProvider, KeyDefinition } from "../state";

export const APP_ID_KEY = new KeyDefinition(APPLICATION_ID_DISK, "appId", {
  deserializer: (value: string) => value,
});
export const ANONYMOUS_APP_ID_KEY = new KeyDefinition(APPLICATION_ID_DISK, "anonymousAppId", {
  deserializer: (value: string) => value,
});

export class AppIdService implements AppIdServiceAbstraction {
  appId$: Observable<string>;
  anonymousAppId$: Observable<string>;

  constructor(globalStateProvider: GlobalStateProvider) {
    const appIdState = globalStateProvider.get(APP_ID_KEY);
    const anonymousAppIdState = globalStateProvider.get(ANONYMOUS_APP_ID_KEY);
    this.appId$ = appIdState.state$.pipe(
      tap(async (appId) => {
        if (!appId) {
          const newAppId = Utils.newGuid();
          const appIdLog = await chrome.storage.local.get("APP_ID_LOG");
          if (!appIdLog || Object.keys(appIdLog).length === 0) {
            await chrome.storage.local.set({
              APP_ID_LOG: [{ appId: newAppId, timestamp: new Date().toString() }],
            });
          } else {
            appIdLog["APP_ID_LOG"].push({ appId: newAppId, timestamp: new Date().toString() });
            await chrome.storage.local.set({ APP_ID_LOG: appIdLog["APP_ID_LOG"] });
          }
          await appIdState.update(() => newAppId);
        }
      }),
      filter((appId) => !!appId),
    );
    this.anonymousAppId$ = anonymousAppIdState.state$.pipe(
      tap(async (appId) => {
        if (!appId) {
          await anonymousAppIdState.update(() => Utils.newGuid());
        }
      }),
      filter((appId) => !!appId),
    );
  }

  async getAppId(): Promise<string> {
    return await firstValueFrom(this.appId$);
  }

  async getAnonymousAppId(): Promise<string> {
    return await firstValueFrom(this.anonymousAppId$);
  }
}
