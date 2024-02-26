import MainBackground from "../background/main.background";

// import { onAlarmListener } from "./alarms/on-alarm-listener";
// import { registerAlarms } from "./alarms/register-alarms";
import { BrowserApi } from "./browser/browser-api";
// import {
//   contextMenusClickedListener,
//   onCommandListener,
//   onInstallListener,
//   runtimeMessageListener,
//   windowsOnFocusChangedListener,
//   tabsOnActivatedListener,
//   tabsOnReplacedListener,
//   tabsOnUpdatedListener,
// } from "./listeners";

if (BrowserApi.isManifestVersion(3)) {
  const bitwardenMain = ((self as any).bitwardenMain = new MainBackground());
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  bitwardenMain
    .bootstrap()
    .then(() => {
      // Finished bootstrapping
      startHeartbeat().catch(() => {});
    })
    .catch(() => {});

  // chrome.commands.onCommand.addListener(onCommandListener);
  // chrome.runtime.onInstalled.addListener(onInstallListener);
  // chrome.alarms.onAlarm.addListener(onAlarmListener);
  // registerAlarms();
  // chrome.windows.onFocusChanged.addListener(windowsOnFocusChangedListener);
  // chrome.tabs.onActivated.addListener(tabsOnActivatedListener);
  // chrome.tabs.onReplaced.addListener(tabsOnReplacedListener);
  // chrome.tabs.onUpdated.addListener(tabsOnUpdatedListener);
  // chrome.contextMenus.onClicked.addListener(contextMenusClickedListener);
  // BrowserApi.messageListener(
  //   "runtime.background",
  //   (message: { command: string }, sender, sendResponse) => {
  //     // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
  //     // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //     runtimeMessageListener(message, sender);
  //   },
  // );
} else {
  const bitwardenMain = ((self as any).bitwardenMain = new MainBackground());
  // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  bitwardenMain.bootstrap().then(() => {
    // Finished bootstrapping
  });
}

/**
 * Tracks when a service worker was last alive and extends the service worker
 * lifetime by writing the current time to extension storage every 20 seconds.
 * You should still prepare for unexpected termination - for example, if the
 * extension process crashes or your extension is manually stopped at
 * chrome://serviceworker-internals.
 */
// let heartbeatInterval: NodeJS.Timeout;

async function runHeartbeat() {
  await chrome.storage.local.set({ "last-heartbeat": new Date().getTime() });
}

/**
 * Starts the heartbeat interval which keeps the service worker alive. Call
 * this sparingly when you are doing work which requires persistence, and call
 * stopHeartbeat once that work is complete.
 */
async function startHeartbeat() {
  // Run the heartbeat once at service worker startup.
  runHeartbeat()
    .then(() => {
      // Then again every 20 seconds.
      setInterval(runHeartbeat, 20 * 1000);
    })
    .catch(() => {});
}
