export abstract class Fido2Service {
  injectFido2ContentScripts: (sender: chrome.runtime.MessageSender) => Promise<void>;
}
