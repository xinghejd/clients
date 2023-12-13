type OnMessageHandlers = Record<string, CallableFunction>;

type ExtensionRuntimeMessage = {
  command: string;
  data?: Record<string, any>;
};

interface RuntimeOnMessageListenerService {
  registerHandlers(handlers: OnMessageHandlers): void;
  deregisterHandlers(handlers: OnMessageHandlers): void;
  addHandler(command: string, handler: CallableFunction): void;
  removeHandler(command: string): void;
}

export { OnMessageHandlers, ExtensionRuntimeMessage, RuntimeOnMessageListenerService };
