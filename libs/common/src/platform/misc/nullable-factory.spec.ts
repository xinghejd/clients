import { nullableFactory } from "./nullable-factory";

describe("nullable factory", () => {
  class TestClass {
    constructor(public arg: string) {}
  }

  it("should return null when argument is null", () => {
    const actual = nullableFactory(TestClass, null);
    expect(actual).toBeNull();
  });

  it("should instantiate class when argument is not null", () => {
    const arg = "not null";
    const actual = nullableFactory(TestClass, arg);
    expect(actual).toBeInstanceOf(TestClass);
    expect(actual.arg).toBe(arg);
  });
});
