import { lastValueFrom, take, timer } from "rxjs";
import { TestScheduler } from "rxjs/testing";

import { emitBy } from "./emit-by.operator";

describe("warnOn", () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test("documentation example", async () => {
    const log = jest.fn();

    await lastValueFrom(
      timer(2, 1).pipe(
        take(5),
        emitBy(timer(1, 2), () => log("source did not emit")),
      ),
    );

    expect(log).toHaveBeenCalledTimes(1);
  });

  it("is transparent to the source observable", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const e1 = cold("           -a--b--c---|");
      const triggerSource = cold("-----------|");
      const expected = "          -a--b--c---|";
      const callback = jest.fn();

      expectObservable(e1.pipe(emitBy(triggerSource, callback))).toBe(expected);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  it("calls the callback when the trigger emits before the source", () => {
    testScheduler.run((helpers) => {
      const { cold, flush } = helpers;
      const e1 = cold("           -a--b--c---|");
      const triggerSource = cold("1----23----|");
      const callback = jest.fn();

      e1.pipe(emitBy(triggerSource, callback)).subscribe();

      flush();

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  it("does not call the callback when the source has emitted between two triggers", () => {
    testScheduler.run((helpers) => {
      const { cold, flush } = helpers;
      const e1 = cold("           -a--b--c---|");
      const triggerSource = cold("--1--2--3--|");
      const callback = jest.fn();

      e1.pipe(emitBy(triggerSource, callback)).subscribe();

      flush();

      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  it("subscribes and unsubscribes to the trigger at start of subscribe and on complete", () => {
    testScheduler.run((helpers) => {
      const { cold, expectSubscriptions } = helpers;
      const e1 = cold("           -a--b--c---|");
      const triggerSource = cold("1---2---3--|");
      const triggerSubs = "            ^----------!";

      e1.pipe(emitBy(triggerSource, jest.fn())).subscribe();

      expectSubscriptions(triggerSource.subscriptions).toBe(triggerSubs);
    });
  });

  it("unsubscribes from the trigger when the source emits an error", () => {
    testScheduler.run((helpers) => {
      const { cold, flush, expectSubscriptions } = helpers;
      const e1 = cold("           -a--#--c---|");
      const triggerSource = cold("-----------|");
      const triggerSubs = "       ^---!";
      const callback = jest.fn();

      e1.pipe(emitBy(triggerSource, callback)).subscribe();

      expect(() => flush()).toThrow();
      expectSubscriptions(triggerSource.subscriptions).toBe(triggerSubs);
    });
  });

  it("unsubscribes from the trigger when the source completes", () => {
    testScheduler.run((helpers) => {
      const { cold, expectSubscriptions } = helpers;
      const e1 = cold("           -a--|");
      const triggerSource = cold("-----------|");
      const triggerSubs = "       ^---!";
      const callback = jest.fn();

      e1.pipe(emitBy(triggerSource, callback)).subscribe();

      expectSubscriptions(triggerSource.subscriptions).toBe(triggerSubs);
    });
  });
});
