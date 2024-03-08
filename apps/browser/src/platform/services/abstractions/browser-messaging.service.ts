import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

export interface BrowserMessagingService extends MessagingService {
  subscribe(subscriber: string, callback: CallableFunction): void;
  subscribeAll(subscribers: Record<string, CallableFunction>): void;
  unsubscribe(subscriber: string): void;
  unsubscribeAll(subscribers: string[]): void;
  destroy(): void;
}
