import { GENERATOR_DISK, KeyDefinition } from "../../../platform/state";

import { RolloverKeyDefinition } from "./rollover-key-definition";

describe("RolloverKeyDefinition", () => {
  const deserializer = (jsonValue: number) => jsonValue + 1;

  describe("toKeyDefinition", () => {
    it("should create a key definition", () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        cleanupDelayMs: 5,
      });

      const result = key.toKeyDefinition();

      expect(result).toBeInstanceOf(KeyDefinition);
      expect(result.stateDefinition).toBe(GENERATOR_DISK);
      expect(result.key).toBe("test");
      expect(result.deserializer(1)).toEqual(2);
      expect(result.cleanupDelayMs).toEqual(5);
    });
  });

  describe("map", () => {
    it("should call the map function when its defined", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        map: (value: number) => Promise.resolve(`${value}`),
      });

      const result = await key.map(1);

      expect(result).toStrictEqual("1");
    });

    it("should fall back to an identity function when map is not defined", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", { deserializer });

      const result = await key.map(1);

      expect(result).toStrictEqual(1);
    });
  });

  describe("isValid", () => {
    it("should call the isValid function when its defined", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", {
        deserializer,
        isValid: () => Promise.resolve(true),
      });

      const result = await key.isValid(1);

      expect(result).toStrictEqual(true);
    });

    it("should return true when isValid is not defined and the input is truthy", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", { deserializer });

      const result = await key.isValid(1);

      expect(result).toStrictEqual(true);
    });

    it("should return false when isValid is not defined and the input is falsy", async () => {
      const key = new RolloverKeyDefinition(GENERATOR_DISK, "test", { deserializer });

      const result = await key.isValid(0);

      expect(result).toStrictEqual(false);
    });
  });
});
