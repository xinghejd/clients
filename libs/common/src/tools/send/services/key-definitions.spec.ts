import { SEND_USER_ENCRYPTED, SEND_USER_DECRYPTED } from "./key-definitions";

describe("Key definitions", () => {
  describe("SEND_USER_ENCRYPTED", () => {
    it("should pass through deserialization", () => {
      const value: any = {};
      const result = SEND_USER_ENCRYPTED.deserializer(value);
      expect(result).toStrictEqual(value);
    });
  });

  describe("SEND_USER_DECRYPTED", () => {
    it("should pass through deserialization", () => {
      const value: any = {};
      const result = SEND_USER_DECRYPTED.deserializer(value);
      expect(result).toStrictEqual(value);
    });
  });
});
