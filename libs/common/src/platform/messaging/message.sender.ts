import { CommandDefinition } from "./types";

export abstract class MessageSender {
  /**
   *
   * @param commandDefinition
   * @param payload
   */
  abstract send<T extends object>(commandDefinition: CommandDefinition<T>, payload: T): void;

  /**
   * A legacy method for sending messages in a non-type safe way.
   * @param command The string based command of your message.
   * @param payload Extra contextual information regarding the message. Be aware that this payload may
   *   be serialized and lose all prototype information.
   */
  abstract send(command: string, payload?: object): void;

  /** Implementation of the other two overloads, read their docs instead. */
  abstract send<T extends object>(
    commandDefinition: CommandDefinition<T> | string,
    payload: T | object,
  ): void;

  /**
   * A helper method for combine multiple {@link MessageSender}'s.
   * @param messageSenders The message senders that should be combined.
   * @returns A message sender that will relay all messages to the given message senders.
   */
  static combine(...messageSenders: MessageSender[]) {
    return new MultiMessageSender(messageSenders);
  }
}

class MultiMessageSender implements MessageSender {
  constructor(private readonly innerMessageSenders: MessageSender[]) {}

  send<T extends object>(
    commandDefinition: string | CommandDefinition<T>,
    payload: object | T = {},
  ): void {
    for (const messageSender of this.innerMessageSenders) {
      messageSender.send(commandDefinition, payload);
    }
  }
}
