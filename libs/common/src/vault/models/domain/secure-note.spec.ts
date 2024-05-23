import { SecureNoteType } from "../../enums";
import { SecureNoteDataLatest } from "../ciphers/data/latest";

import { SecureNote } from "./secure-note";

describe("SecureNote", () => {
  let data: SecureNoteDataLatest;

  beforeEach(() => {
    data = {
      type: SecureNoteType.Generic,
    };
  });

  it("Convert from empty", () => {
    const data = new SecureNoteDataLatest();
    const secureNote = new SecureNote(data);

    expect(secureNote).toEqual({
      type: undefined,
    });
  });

  it("Convert", () => {
    const secureNote = new SecureNote(data);

    expect(secureNote).toEqual({
      type: 0,
    });
  });

  it("toSecureNoteData", () => {
    const secureNote = new SecureNote(data);
    expect(secureNote.toSecureNoteData()).toEqual(data);
  });

  it("Decrypt", async () => {
    const secureNote = new SecureNote();
    secureNote.type = SecureNoteType.Generic;

    const view = await secureNote.decrypt(null);

    expect(view).toEqual({
      type: 0,
    });
  });

  describe("fromJSON", () => {
    it("returns null if object is null", () => {
      expect(SecureNote.fromJSON(null)).toBeNull();
    });
  });
});
