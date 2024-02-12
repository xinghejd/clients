import { mockAccountServiceWith } from "../../../spec";
import { UserId } from "../../types/guid";

import { DefaultLifecycleService, LifecycleService } from "./lifecycle.service";
import {
  register,
  REGISTERED_TARGETS,
  LifecycleInterface,
  RegistrationTarget,
} from "./register.decorator";
import { clearRegisteredTargets } from "./register.decorator.spec";

describe("LifecycleService", () => {
  let sut: LifecycleService;
  let onLogouts: LifecycleInterface<"logout">[];
  let onLocks: LifecycleInterface<"lock">[];
  const userId = "userId" as UserId;
  const accountService = mockAccountServiceWith(userId);

  beforeEach(() => {
    @register("logout")
    @register("lock")
    class TestLogout {
      onLogout = jest.fn();
      onLock = jest.fn();
    }
    onLocks = onLogouts = [new TestLogout(), new TestLogout(), new TestLogout()];

    sut = new DefaultLifecycleService(accountService);
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
      ["lock" as RegistrationTarget, {}],
      ["logout" as RegistrationTarget, {}],
    ])("should register the target", (target, service) => {
      if (target === "lock") {
        LifecycleService.register(target, service as LifecycleInterface<"lock">);
        expect(REGISTERED_TARGETS.lock).toEqual([...onLocks, service]);
      } else if (target === "logout") {
        LifecycleService.register(target, service as LifecycleInterface<"logout">);
        expect(REGISTERED_TARGETS.logout).toEqual([...onLogouts, service]);
      } else {
        throw new Error("Invalid target");
      }
    });
  });
});
