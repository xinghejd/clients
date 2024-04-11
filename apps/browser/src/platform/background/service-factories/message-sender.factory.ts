import { MessageSender } from "@bitwarden/common/platform/messaging";

import { CachedServices, factory, FactoryOptions } from "./factory-options";

type MessagingServiceFactoryOptions = FactoryOptions;

export type MessageSenderInitOptions = MessagingServiceFactoryOptions;

export function messageSenderFactory(
  cache: { messageSender?: MessageSender } & CachedServices,
  opts: MessageSenderInitOptions,
): Promise<MessageSender> {
  // TODO: Implement this
  return factory(cache, "messageSender", opts, () => MessageSender.combine());
}
