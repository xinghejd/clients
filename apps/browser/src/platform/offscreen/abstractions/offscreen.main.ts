type OffscreenMainExtensionMessage = {
  [key: string]: any;
  command: string;
};

type OffscreenExtensionMessageEventParams = {
  message: OffscreenMainExtensionMessage;
  sender: chrome.runtime.MessageSender;
};

type OffscreenMainExtensionMessageHandlers = {
  [key: string]: ({ message, sender }: OffscreenExtensionMessageEventParams) => any;
};
export { OffscreenMainExtensionMessage, OffscreenMainExtensionMessageHandlers };
