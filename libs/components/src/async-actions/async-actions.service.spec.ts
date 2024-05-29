import { MockProxy, mock } from "jest-mock-extended";
import {
  Observable,
  Subject,
  bufferCount,
  firstValueFrom,
  lastValueFrom,
  map,
  merge,
  take,
} from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { AsyncActionsService } from "./async-actions.service";

describe("AsyncActionsService", () => {
  let validationService!: MockProxy<ValidationService>;
  let logService!: MockProxy<LogService>;
  let service!: AsyncActionsService;

  beforeEach(() => {
    validationService = mock();
    logService = mock();
    service = new AsyncActionsService(validationService, logService);
  });

  describe("state$", () => {
    it("emits 'inactive' when no action has been executed", async () => {
      const state = await firstValueFrom(service.state$("context"));

      expect(state).toEqual({ status: "inactive" });
    });

    it("emits 'active' when an action has been executed but not yet completed", async () => {
      const action = new Subject();
      const origin = Symbol();
      void service.execute("context", origin, () => action);

      const state = await firstValueFrom(service.state$("context"));

      expect(state).toEqual({ status: "active", origin });
    });

    it("emits 'inactive' when an action has been executed and completed", async () => {
      const action = new Subject();
      const origin = Symbol();
      const execution = service.execute("context", origin, () => action);
      action.next(undefined);
      await execution;

      const state = await firstValueFrom(service.state$("context"));

      expect(state).toEqual({ status: "inactive" });
    });

    it("emits 'inactive' when an action has been executed and thrown an error", async () => {
      const action = new Subject();
      const origin = Symbol();
      const execution = service.execute("context", origin, () => action);
      action.error(new Error("test"));
      await execution.catch(() => {});

      const state = await firstValueFrom(service.state$("context"));

      expect(state).toEqual({ status: "inactive" });
    });

    it("tracks and emits status of multiple contexts", async () => {
      const a = { action: new Subject(), origin: Symbol("a") };
      const b = { action: new Subject(), origin: Symbol("b") };
      const merged_states = merge(
        service.state$("context_a").pipe(map((state) => ({ context: "context_a", state }))),
        service.state$("context_b").pipe(map((state) => ({ context: "context_b", state }))),
      );
      const emissions = firstNValuesFrom(6, merged_states);

      const execution_a = service.execute("context_a", a.origin, () => a.action);
      const execution_b = service.execute("context_b", b.origin, () => b.action);
      b.action.next(undefined);
      await execution_b;
      a.action.next(undefined);
      await execution_a;

      const output = await emissions;
      expect(output).toEqual([
        { context: "context_a", state: { status: "inactive" } },
        { context: "context_b", state: { status: "inactive" } },
        { context: "context_a", state: { status: "active", origin: a.origin } },
        { context: "context_b", state: { status: "active", origin: b.origin } },
        { context: "context_b", state: { status: "inactive" } },
        { context: "context_a", state: { status: "inactive" } },
      ]);
    });
  });

  describe("execute", () => {
    it("catches and handles all errors using the supplied log and validation services", async () => {
      const error = new Error("example");

      await service.execute("context", Symbol(), () => Promise.reject(error));

      expect(logService.error).toHaveBeenCalledWith(expect.anything(), error);
      expect(validationService.showError).toHaveBeenCalledWith(error);
    });

    it("unsubscribes from the observable when the service is destroyed", async () => {
      const action = new Subject();
      const origin = Symbol();
      void service.execute("context", origin, () => action);

      service.ngOnDestroy();

      expect(action.observed).toBe(false);
    });

    it("unsubscribes from the observable when 'until' emits", async () => {
      const action = new Subject();
      const until = new Subject();
      const origin = Symbol();
      void service.execute("context", origin, () => action, until);

      until.next(undefined);

      expect(action.observed).toBe(false);
    });

    it("does not execute the handler if another action is already active in the same context", async () => {
      const first_action = new Subject();
      const second_action = new Subject();
      const origin = Symbol();

      void service.execute("context", origin, () => first_action);
      void service.execute("context", origin, () => second_action);

      expect(first_action.observed).toBe(true);
      expect(second_action.observed).toBe(false);
    });
  });
});

function firstNValuesFrom<T>(count: number, observable: Observable<T>): Promise<T[]> {
  return lastValueFrom(observable.pipe(bufferCount(count), take(1)));
}
