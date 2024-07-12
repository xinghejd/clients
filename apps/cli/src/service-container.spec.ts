import { ServiceContainer } from "./service-container.js";

describe("ServiceContainer", () => {
  it("instantiates", async () => {
    expect(() => new ServiceContainer()).not.toThrow();
  });
});
