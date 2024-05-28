import { lastValueFrom } from "rxjs";

import { AsyncActionsService } from "./async-actions.service";

describe("AsyncActionsService", () => {
  let service!: AsyncActionsService;

  beforeEach(() => {
    service = new AsyncActionsService();
  });

  describe("state$", () => {
    it("emits 'inactive' when no action has been executed", async () => {
      const state = await lastValueFrom(service.state$("context"));

      expect(state).toEqual({ status: "inactive" });
    });
  });
});
