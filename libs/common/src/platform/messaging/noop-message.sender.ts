import { MessageSender } from "./message.sender";
import { CommandDefinition } from "./types";

export class NoopMessageSender implements MessageSender {
  send<T extends object>(
    _commandDefinition: string | CommandDefinition<T>,
    _payload: object | T,
  ): void {
    // Do nothing
  }
}
