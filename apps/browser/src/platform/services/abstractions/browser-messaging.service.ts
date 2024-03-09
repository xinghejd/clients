import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

export interface BrowserMessagingService extends MessagingService {
  subscribe(subscriber: string, callback: CallableFunction): void;
  registerSubscribers(subscribers: Record<string, CallableFunction>): void;
  unsubscribe(subscriber: string): void;
  deregisterSubscribers(subscribers: string[]): void;
  destroy(): void;
}
