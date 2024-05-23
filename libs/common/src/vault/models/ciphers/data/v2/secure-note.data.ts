import { SecureNoteType } from "../../../../enums";
import { SecureNoteApiV2 } from "../../api/v2/secure-note.api";

export class SecureNoteDataV2 {
  type: SecureNoteType;

  constructor(data?: SecureNoteApiV2) {
    if (data == null) {
      return;
    }

    this.type = data.type;
  }
}
