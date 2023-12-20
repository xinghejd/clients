import { of } from "rxjs";

import { ApplicationLifetimeService } from "../abstractions/application-lifetime.service";

import { ApplicationLifetimeHandler } from "./application-lifetime.handler";

class SubscriptionLifetime implements ApplicationLifetimeService {
  ran = false;
  onStart() {
    this.ran = true;
    return of(1, 2, 3, 4, 5).subscribe();
  }
}

class PromiseLifetime implements ApplicationLifetimeService {
  ran = false;
  async onStart() {
    await Promise.resolve();
    this.ran = true;
  }
}

describe("ApplicationLifetimeHandler", () => {
  describe("runOnStart", () => {
    it("runs all methods to completion", async () => {
      const subscriptionLifetime = new SubscriptionLifetime();
      const promiseLifetime = new PromiseLifetime();

      const handler = new ApplicationLifetimeHandler([subscriptionLifetime, promiseLifetime]);

      await handler.runOnStart();

      expect(subscriptionLifetime.ran).toBe(true);
      expect(promiseLifetime.ran).toBe(true);
    });
  });
});
