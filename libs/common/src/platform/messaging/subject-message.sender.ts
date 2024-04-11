import { Subject } from "rxjs";

import { getCommand } from "./internal";
import { MessageSender } from "./message.sender";
import { Message, MessageDefinition } from "./types";

export class SubjectMessageSender implements MessageSender {
  constructor(private readonly messagesSubject: Subject<Message<object>>) {}

  send<T extends object>(
    messageDefinition: string | MessageDefinition<T>,
    payload: object | T = {},
  ): void {
    const command = getCommand(messageDefinition);
    this.messagesSubject.next(Object.assign(payload ?? {}, { command: command }));
  }
}
