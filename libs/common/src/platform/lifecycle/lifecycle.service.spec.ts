import { mockAccountServiceWith } from "../../../spec";
import { UserId } from "../../types/guid";

import { DefaultLifeCycleService, LifeCycleService } from "./lifecycle.service";
import {
  respondsTo,
  REGISTERED_EVENT_HANDLERS,
  LifeCycleInterface,
  LifeCycleEvent,
} from "./responds-to.decorator";
import { clearRegisteredTargets } from "./responds-to.decorator.spec";

describe("LifeCycleService", () => {
  let sut: LifeCycleService;
  let onLogouts: LifeCycleInterface<"logout">[];
  let onLocks: LifeCycleInterface<"lock">[];
  const userId = "userId" as UserId;
  const accountService = mockAccountServiceWith(userId);

  beforeEach(() => {
    @respondsTo("logout")
    @respondsTo("lock")
    class TestClass {
      onLogout = jest.fn();
      onLock = jest.fn();
    }
    onLocks = onLogouts = [new TestClass(), new TestClass(), new TestClass()];

    // Update a test class to exercise promise handling
    const promiseTest = onLocks[0] as TestClass;
    promiseTest.onLock.mockImplementation(() => Promise.resolve());
    promiseTest.onLogout.mockImplementation(() => Promise.resolve());

    sut = new DefaultLifeCycleService(accountService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    clearRegisteredTargets();
  });

  describe("logout", () => {
    it("should logout all services", async () => {
      await sut.logout(userId);

      onLogouts.forEach((service) => {
        expect(service.onLogout).toHaveBeenCalledWith(userId);
      });
    });

    it("should logout the provided userId, if available", async () => {
      const userIdForTest = "userIdForTest" as UserId;

      await sut.logout(userIdForTest);

      onLogouts.forEach((service) => {
        expect(service.onLogout).toHaveBeenCalledWith(userIdForTest);
      });
    });

    it("should use the active user id if no userId is provided", async () => {
      await sut.logout();

      onLogouts.forEach((service) => {
        expect(service.onLogout).toHaveBeenCalledWith(userId);
      });
    });

    it("should throw an error if no userId is provided and no active account is available", async () => {
      accountService.activeAccountSubject.next(undefined);

      await expect(sut.logout()).rejects.toThrow(
        "Cannot resolve user id: No user id provided and unable to resolve an active account.",
      );
      await expect(sut.lock()).rejects.toThrow(
        "Cannot resolve user id: No user id provided and unable to resolve an active account.",
      );
    });
  });

  describe("register", () => {
    it.each([
      ["lock" as LifeCycleEvent, {}],
      ["logout" as LifeCycleEvent, {}],
    ])("should register the target", (target, service) => {
      if (target === "lock") {
        LifeCycleService.register(target, service as LifeCycleInterface<"lock">);
        expect(REGISTERED_EVENT_HANDLERS.lock).toEqual([...onLocks, service]);
      } else if (target === "logout") {
        LifeCycleService.register(target, service as LifeCycleInterface<"logout">);
        expect(REGISTERED_EVENT_HANDLERS.logout).toEqual([...onLogouts, service]);
      } else {
        throw new Error("Invalid target");
      }
    });
  });
});
