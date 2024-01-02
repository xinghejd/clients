/**
 * need to update test environment so structuredClone works appropriately
 * @jest-environment ../shared/test.environment.ts
 */

import { MemoryStorageService } from "./memory-storage.service";

describe("MemoryStorageService", () => {
  let sut: MemoryStorageService;

  beforeEach(() => {
    sut = new MemoryStorageService();
  });

  describe("stored objects cloning", () => {
    class Root {
      number = 1;
      string = "string";
      date = new Date();
      array = [1, 2, 3];
      nested: Root;
      selfRef = this;

      constructor(nest = true) {
        this.nested = nest ? new Root(false) : null;
      }

      method() {
        return "method";
      }
    }

    it("should clone root object", async () => {
      const root = new Root();
      await sut.save("root", root);
      const clone = await sut.get<Root>("root");
      expect(clone).toEqual(root);
      expect(clone).not.toBe(root);
      expect(clone.method()).toEqual(root.method());
    });
  });
});
