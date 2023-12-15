import "reflect-metadata";
import RuntimeOnMessageListenerService from "../../../shared/platform/services/runtime-on-message-listener/runtime-on-message-listener.service";

class MainBackground {
  constructor(_runtimeOnMessageListenerService: RuntimeOnMessageListenerService) {}
}

const runtimeOnMessageListenerService = new RuntimeOnMessageListenerService();

new MainBackground(runtimeOnMessageListenerService);
