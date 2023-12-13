import RuntimeOnMessageListenerService from "../shared/services/runtime-on-message-listener/runtime-on-message-listener.service";

const runtimeOnMessageListenerService = new RuntimeOnMessageListenerService();
runtimeOnMessageListenerService.registerHandlers({
  thisCommand: () => {},
});
