import { Message, MessageType } from "./message";

const SENDER = "bitwarden-webauthn";

type PostMessageFunction = (message: MessageWithMetadata, remotePort: MessagePort) => void;

export type Channel = {
  addEventListener: (listener: (message: MessageEvent<MessageWithMetadata>) => void) => void;
  removeEventListener: (listener: (message: MessageEvent<MessageWithMetadata>) => void) => void;
  postMessage: PostMessageFunction;
};

export type Metadata = { SENDER: typeof SENDER };
export type MessageWithMetadata = Message & Metadata;
type Handler = (
  message: MessageWithMetadata,
  abortController?: AbortController
) => void | Promise<Message | undefined>;

/**
 * A class that handles communication between the page and content script. It converts
 * the browser's broadcasting API into a request/response API with support for seamlessly
 * handling aborts and exceptions across separate execution contexts.
 */
export class Messenger {
  private messageEventListener: (event: MessageEvent<MessageWithMetadata>) => void | null = null;

  /**
   * Creates a messenger that uses the browser's `window.postMessage` API to initiate
   * requests in the content script. Every request will then create it's own
   * `MessageChannel` through which all subsequent communication will be sent through.
   *
   * @param window the window object to use for communication
   * @returns a `Messenger` instance
   */
  static forDOMCommunication(window: Window) {
    const windowOrigin = window.location.origin;

    return new Messenger({
      postMessage: (message, port) => window.postMessage(message, windowOrigin, [port]),
      addEventListener: (listener) => window.addEventListener("message", listener),
      removeEventListener: (listener) => window.removeEventListener("message", listener),
    });
  }

  /**
   * The handler that will be called when a message is recieved. The handler should return
   * a promise that resolves to the response message. If the handler throws an error, the
   * error will be sent back to the sender.
   */
  handler?: Handler;

  constructor(private broadcastChannel: Channel) {
    this.messageEventListener = async (event) => {
      const windowOrigin = window.location.origin;
      if (event.origin !== windowOrigin) {
        return;
      }

      if (this.handler === undefined) {
        return;
      }

      const message = event.data;
      const port = event.ports?.[0];
      if (message?.SENDER !== SENDER || message == null || port == null) {
        return;
      }

      const abortController = new AbortController();
      port.onmessage = (event: MessageEvent<MessageWithMetadata>) => {
        if (event.data.type === MessageType.AbortRequest) {
          abortController.abort();
        }
      };

      try {
        const handlerResponse = await this.handler(message, abortController);
        port.postMessage({ ...handlerResponse, SENDER });
      } catch (error) {
        port.postMessage({
          SENDER,
          type: MessageType.ErrorResponse,
          error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
      } finally {
        port.close();
      }
    };

    this.broadcastChannel.addEventListener(this.messageEventListener);
  }

  /**
   * Sends a request to the content script and returns the response.
   * AbortController signals will be forwarded to the content script.
   *
   * @param request data to send to the content script
   * @param abortController the abort controller that might be used to abort the request
   * @returns the response from the content script
   */
  async request(request: Message, abortController?: AbortController): Promise<Message> {
    const requestChannel = new MessageChannel();
    const { port1: localPort, port2: remotePort } = requestChannel;

    try {
      const promise = new Promise<Message>((resolve) => {
        localPort.onmessage = (event: MessageEvent<MessageWithMetadata>) => resolve(event.data);
      });

      const abortListener = () =>
        localPort.postMessage({
          metadata: { SENDER },
          type: MessageType.AbortRequest,
        });
      abortController?.signal.addEventListener("abort", abortListener);

      this.broadcastChannel.postMessage({ ...request, SENDER }, remotePort);
      const response = await promise;

      abortController?.signal.removeEventListener("abort", abortListener);

      if (response.type === MessageType.ErrorResponse) {
        const error = new Error();
        Object.assign(error, JSON.parse(response.error));
        throw error;
      }

      return response;
    } finally {
      localPort.close();
    }
  }

  async sendReconnectCommand() {
    await this.request({ type: MessageType.ReconnectRequest });
  }

  private async sendDisconnectCommand() {
    await this.request({ type: MessageType.DisconnectRequest });
  }

  /**
   * Cleans up the messenger by removing the message event listener
   */
  async destroy() {
    if (this.messageEventListener) {
      await this.sendDisconnectCommand();
      this.broadcastChannel.removeEventListener(this.messageEventListener);
      this.messageEventListener = null;
    }
  }
}
