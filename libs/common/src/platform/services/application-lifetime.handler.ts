import { Subscription } from "rxjs";

import { ApplicationLifetimeService } from "../abstractions/application-lifetime.service";

export class ApplicationLifetimeHandler {
  constructor(private readonly applicationLifetimeServices: ApplicationLifetimeService[]) {}

  runOnStart(): Subscription {
    // Create a main subscription that can unsubscribe from all the sub tasks
    const subscription = new Subscription();

    for (const applicationLifetimeService of this.applicationLifetimeServices) {
      const serviceSubscription = applicationLifetimeService.onStart();
      subscription.add(serviceSubscription);
    }

    return subscription;
  }
}
