import { REGISTERED_EVENT_HANDLERS, respondsTo } from "./respondsTo.decorator";

describe("register", () => {
  afterEach(() => {
    clearRegisteredTargets();
  });

  it("should register a class for onLock", () => {
    @respondsTo("lock")
    class TestClass {
      onLock() {}
    }
    const testClass = new TestClass();
    expect(REGISTERED_EVENT_HANDLERS.lock).toEqual([testClass]);
  });

  it("should register a class for onLogout", () => {
    @respondsTo("logout")
    class TestClass {
      onLogout() {}
    }
    const testClass = new TestClass();
    expect(REGISTERED_EVENT_HANDLERS.logout).toEqual([testClass]);
  });

  it("should register for both onLock and onLogout", () => {
    @respondsTo("logout")
    @respondsTo("lock")
    class TestClass {
      onLock() {}
      onLogout() {}
    }
    const testClass = new TestClass();
    expect(REGISTERED_EVENT_HANDLERS.lock).toEqual([testClass]);
    expect(REGISTERED_EVENT_HANDLERS.logout).toEqual([testClass]);
  });

  it("should register multiple instances of a class", () => {
    @respondsTo("lock")
    class TestClass {
      onLock() {}
    }
    const testClass1 = new TestClass();
    const testClass2 = new TestClass();
    expect(REGISTERED_EVENT_HANDLERS.lock).toEqual([testClass1, testClass2]);
  });
});

export function clearRegisteredTargets() {
  REGISTERED_EVENT_HANDLERS.lock.splice(0, REGISTERED_EVENT_HANDLERS.lock.length);
  REGISTERED_EVENT_HANDLERS.logout.splice(0, REGISTERED_EVENT_HANDLERS.logout.length);
}
