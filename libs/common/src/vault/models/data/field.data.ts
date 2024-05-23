import { FieldType, LinkedIdType } from "../../enums";
import { FieldApiLatest } from "../ciphers/api/latest";

export class FieldData {
  type: FieldType;
  name: string;
  value: string;
  linkedId: LinkedIdType;

  // TODO: Implement version support
  constructor(response?: FieldApiLatest) {
    if (response == null) {
      return;
    }
    this.type = response.type;
    this.name = response.name;
    this.value = response.value;
    this.linkedId = response.linkedId;
  }
}
