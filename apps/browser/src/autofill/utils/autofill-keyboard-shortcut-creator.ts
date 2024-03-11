import { Observable, defer, map, of, switchMap } from "rxjs";

import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

const mapToAutofillShortcut = map<(chrome.commands.Command | browser.commands.Command)[], string>(
  (commands) => commands.find((c) => c.name === "autofill_login").shortcut,
);

const fromFirefoxSetting = () => {
  return defer(() => browser.commands.getAll()).pipe(
    mapToAutofillShortcut,
    switchMap((commandShortcut) => {
      if (commandShortcut === "Ctrl+Shift+L") {
        // If they give us the "default" command shortcut and they are on mac, then
        // we should override it to have `Cmd` instead
        return defer(() => browser.runtime.getPlatformInfo()).pipe(
          map((platformInfo) => (platformInfo.os === "mac" ? "Cmd+Shift+L" : commandShortcut)),
        );
      }

      // It's not the default shortcut, so there is no extra work to do, return it.
      return of(commandShortcut);
    }),
  );
};

const fromChromeSetting = () => {
  return defer(
    () =>
      new Promise<chrome.commands.Command[]>((resolve) =>
        chrome.commands.getAll((commands) => resolve(commands)),
      ),
  ).pipe(mapToAutofillShortcut);
};

/**
 * Create a platform aware observable stream for the keyboard shortcut for autofill.
 * @param platformUtilsService
 * @returns
 */
export const fromBrowserSetting = (
  platformUtilsService: PlatformUtilsService,
): Observable<string> => {
  // We return an observable but none of the observables currently will emit
  // more than a single value, but if any browser were to expose the ability
  // to be notified of when a shortcut changes we could tap into that and return
  // a true stream.

  // A future enhancement could be made where all the observables that go to the browser to get information
  // could include a `shareReplay` on them since one of the screens that show this shortcut links to another page
  // that shows this values. It could be given a very short cache with a `timer` to avoid having to go
  // to the browser for the value on that navigation. But in reality, going to the browser for this
  // information is quite speedy.

  if (platformUtilsService.isSafari()) {
    // You can not change the command in Safari or obtain it programmatically
    return of("Cmd+Shift+L");
  }

  if (platformUtilsService.isFirefox()) {
    return fromFirefoxSetting();
  }

  return fromChromeSetting();
};
