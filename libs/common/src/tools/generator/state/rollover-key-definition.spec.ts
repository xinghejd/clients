import { GENERATOR_DISK, UserKeyDefinition } from "../../../platform/state";

import { RolloverKeyDefinition } from "./rollover-key-definition";

describe("RolloverKeyDefinition", () => {
  const deserializer = (jsonValue: number) => jsonValue + 1;

  describe("toKeyDefinition", () => {
    it("should create a key definition", () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        cleanupDelayMs: 5,
        clearOn: [],
      });

      const result = key.toKeyDefinition();

      expect(result).toBeInstanceOf(UserKeyDefinition);
      expect(result.stateDefinition).toBe(GENERATOR_DISK);
      expect(result.key).toBe("test");
      expect(result.deserializer(1)).toEqual(2);
      expect(result.cleanupDelayMs).toEqual(5);
    });
  });

  describe("shouldRollover", () => {
    it("should call the shouldRollover function when its defined", async () => {
      const shouldRollover = jest.fn(() => true);
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        shouldRollover,
        clearOn: [],
      });

      const result = await key.shouldRollover(true);

      expect(shouldRollover).toHaveBeenCalledWith(true);
      expect(result).toStrictEqual(true);
    });

    it("should return true when shouldRollover is not defined and the input is truthy", async () => {
      const key = new RolloverKeyDefinition<number, number, number>(GENERATOR_DISK, "test", {
        deserializer,
        clearOn: [],
      });

      const result = await key.shouldRollover(1);

      expect(result).toStrictEqual(true);
    });

    it("should return false when shouldRollover is not defined and the input is falsy", async () => {
      const key = new RolloverKeyDefinition<number, number, number>(GENERATOR_DISK, "test", {
        deserializer,
        clearOn: [],
      });

      const result = await key.shouldRollover(0);

      expect(result).toStrictEqual(false);
    });
  });

  describe("map", () => {
    it("should call the map function when its defined", async () => {
      const map = jest.fn((value: number) => Promise.resolve(`${value}`));
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        map,
        clearOn: [],
      });

      const result = await key.map(1, true);

      expect(map).toHaveBeenCalledWith(1, true);
      expect(result).toStrictEqual("1");
    });

    it("should fall back to an identity function when map is not defined", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", { deserializer, clearOn: [] });

      const result = await key.map(1, null);

      expect(result).toStrictEqual(1);
    });
  });

  describe("isValid", () => {
    it("should call the isValid function when its defined", async () => {
      const isValid = jest.fn(() => Promise.resolve(true));
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        isValid,
        clearOn: [],
      });

      const result = await key.isValid(1, true);

      expect(isValid).toHaveBeenCalledWith(1, true);
      expect(result).toStrictEqual(true);
    });

    it("should return true when isValid is not defined and the input is truthy", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", { deserializer, clearOn: [] });

      const result = await key.isValid(1, null);

      expect(result).toStrictEqual(true);
    });

    it("should return false when isValid is not defined and the input is falsy", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", { deserializer, clearOn: [] });

      const result = await key.isValid(0, null);

      expect(result).toStrictEqual(false);
    });
  });
});
