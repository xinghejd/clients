import { ApplicationLifetimeService } from "../abstractions/application-lifetime.service";

export class ApplicationLifetimeHandler {
  constructor(private applicationLifetimeServices: ApplicationLifetimeService[]) {}

  async runOnStart(): Promise<void> {
    for (const applicationLifetimeService of this.applicationLifetimeServices) {
      const subscriptionOrPromise = applicationLifetimeService.onStart();
      if (subscriptionOrPromise instanceof Promise) {
        await subscriptionOrPromise;
      }
    }
  }
}
