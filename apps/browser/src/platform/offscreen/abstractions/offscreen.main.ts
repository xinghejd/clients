type OffscreenMainExtensionMessage = {
  [key: string]: any;
  command: string;
  text?: string;
};

type OffscreenExtensionMessageEventParams = {
  message: OffscreenMainExtensionMessage;
  sender: chrome.runtime.MessageSender;
};

type OffscreenMainExtensionMessageHandlers = {
  [key: string]: ({ message, sender }: OffscreenExtensionMessageEventParams) => any;
  offscreenCopyToClipboard: ({ message }: OffscreenExtensionMessageEventParams) => any;
  offscreenReadFromClipboard: () => any;
};
export { OffscreenMainExtensionMessage, OffscreenMainExtensionMessageHandlers };
