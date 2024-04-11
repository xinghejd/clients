import { MessageSender, MessageDefinition } from "@bitwarden/common/platform/messaging";
import { getCommand } from "@bitwarden/common/platform/messaging/internal";

export class ElectronRendererMessageSender implements MessageSender {
  send<T extends object>(
    messageDefinition: MessageDefinition<T> | string,
    payload: object | T = {},
  ): void {
    const command = getCommand(messageDefinition);
    ipc.platform.sendMessage(Object.assign({}, { command: command }, payload));
  }
}
