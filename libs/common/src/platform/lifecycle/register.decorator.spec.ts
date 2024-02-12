import { REGISTERED_TARGETS, register } from "./register.decorator";

describe("register", () => {
  afterEach(() => {
    clearRegisteredTargets();
  });

  it("should register a class for onLock", () => {
    @register("lock")
    class TestClass {
      onLock() {}
    }
    const testClass = new TestClass();
    expect(REGISTERED_TARGETS.lock).toEqual([testClass]);
  });

  it("should register a class for onLogout", () => {
    @register("logout")
    class TestClass {
      onLogout() {}
    }
    const testClass = new TestClass();
    expect(REGISTERED_TARGETS.logout).toEqual([testClass]);
  });

  it("should register for both onLock and onLogout", () => {
    @register("logout")
    @register("lock")
    class TestClass {
      onLock() {}
      onLogout() {}
    }
    const testClass = new TestClass();
    expect(REGISTERED_TARGETS.lock).toEqual([testClass]);
    expect(REGISTERED_TARGETS.logout).toEqual([testClass]);
  });

  it("should register multiple instances of a class", () => {
    @register("lock")
    class TestClass {
      onLock() {}
    }
    const testClass1 = new TestClass();
    const testClass2 = new TestClass();
    expect(REGISTERED_TARGETS.lock).toEqual([testClass1, testClass2]);
  });
});

export function clearRegisteredTargets() {
  REGISTERED_TARGETS.lock.splice(0, REGISTERED_TARGETS.lock.length);
  REGISTERED_TARGETS.logout.splice(0, REGISTERED_TARGETS.logout.length);
}
