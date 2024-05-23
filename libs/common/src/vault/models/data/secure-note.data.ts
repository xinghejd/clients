import { SecureNoteType } from "../../enums";
import { SecureNoteApiLatest } from "../ciphers/api/latest";

export class SecureNoteData {
  type: SecureNoteType;

  constructor(data?: SecureNoteApiLatest) {
    if (data == null) {
      return;
    }

    this.type = data.type;
  }
}
