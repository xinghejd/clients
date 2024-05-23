import { SecureNoteType } from "../../../../enums";
import { SecureNoteApiV1 } from "../../api/v1/secure-note.api";

export class SecureNoteDataV1 {
  type: SecureNoteType;

  constructor(data?: SecureNoteApiV1) {
    if (data == null) {
      return;
    }

    this.type = data.type;
  }
}
