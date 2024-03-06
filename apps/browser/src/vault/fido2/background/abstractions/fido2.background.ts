type Fido2ExtensionMessage = {
  [key: string]: any;
  command: string;
  hostname?: string;
  origin?: string;
  requestId?: string;
  abortedRequestId?: string;
};

type Fido2ExtensionMessageEventParams = {
  message: Fido2ExtensionMessage;
  sender: chrome.runtime.MessageSender;
};

type Fido2BackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  triggerFido2ContentScriptInjection: ({
    message,
    sender,
  }: Fido2ExtensionMessageEventParams) => any;
  reloadFido2ContentScripts: () => any;
  fido2AbortRequest: ({ message }: Fido2ExtensionMessageEventParams) => any;
};

interface Fido2Background {
  loadAutofillScriptsOnInstall: () => Promise<void>;
  injectFido2ContentScripts: (
    hostname: string,
    origin: string,
    tab: chrome.tabs.Tab,
    frameId?: chrome.runtime.MessageSender["frameId"],
  ) => Promise<void>;
}

export { Fido2ExtensionMessage, Fido2BackgroundExtensionMessageHandlers, Fido2Background };
