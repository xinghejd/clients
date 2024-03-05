export abstract class Fido2Background {
  init: () => Promise<void>;
  injectFido2ContentScripts: (
    hostname: string,
    origin: string,
    tab: chrome.tabs.Tab,
    frameId?: chrome.runtime.MessageSender["frameId"],
  ) => Promise<void>;
  reloadFido2ContentScripts: () => void;
}
