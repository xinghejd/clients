import { MonoTypeOperatorFunction, map } from "rxjs";

import { Message, MessageDefinition } from "./types";

export const getCommand = (messageDefinition: MessageDefinition<object> | string) => {
  if (typeof messageDefinition === "string") {
    return messageDefinition;
  } else {
    return messageDefinition.command;
  }
};

export const EXTERNAL_SOURCE_TAG = Symbol("externalSource");

export const isExternalMessage = (message: Message<object>) => {
  return (message as Record<PropertyKey, unknown>)?.[EXTERNAL_SOURCE_TAG] === true;
};

export const tagAsExternal: MonoTypeOperatorFunction<Message<object>> = map(
  (message: Message<object>) => {
    return Object.assign(message, { [EXTERNAL_SOURCE_TAG]: true });
  },
);
