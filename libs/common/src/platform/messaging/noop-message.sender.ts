import { MessageSender } from "./message.sender";
import { MessageDefinition } from "./types";

export class NoopMessageSender implements MessageSender {
  send<T extends object>(
    _messageDefinition: string | MessageDefinition<T>,
    _payload: object | T,
  ): void {
    // Do nothing
  }
}
