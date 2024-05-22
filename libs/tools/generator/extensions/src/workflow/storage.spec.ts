import { mock } from "jest-mock-extended";

import { GeneratedCredential } from "./history";
import {
  GENERATOR_SETTINGS,
} from "./key-definitions";
import { GeneratedPasswordHistory } from "./password";

describe("Key definitions", () => {
  describe("GENERATOR_SETTINGS", () => {
    it("should pass through deserialization", () => {
      const value = {};
      const result = GENERATOR_SETTINGS.deserializer(value);
      expect(result).toBe(value);
    });
  });
});
