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

describe("ApplicationLifetimeHandler", () => {
  describe("runOnStart", () => {
    it("runs all methods to completion", async () => {
      const subscriptionLifetime = new SubscriptionLifetime();

      const handler = new ApplicationLifetimeHandler([subscriptionLifetime]);

      handler.runOnStart();

      expect(subscriptionLifetime.ran).toBe(true);
    });
  });
});
