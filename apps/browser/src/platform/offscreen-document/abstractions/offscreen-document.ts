type OffscreenDocumentExtensionMessage = {
  [key: string]: any;
  command: string;
  text?: string;
};

type OffscreenExtensionMessageEventParams = {
  message: OffscreenDocumentExtensionMessage;
  sender: chrome.runtime.MessageSender;
};

type OffscreenDocumentExtensionMessageHandlers = {
  [key: string]: ({ message, sender }: OffscreenExtensionMessageEventParams) => any;
  offscreenCopyToClipboard: ({ message }: OffscreenExtensionMessageEventParams) => any;
  offscreenReadFromClipboard: () => any;
};
export { OffscreenDocumentExtensionMessage, OffscreenDocumentExtensionMessageHandlers };
