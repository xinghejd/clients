import { FieldType, LinkedIdType } from "../../../../enums";
import { FieldApiV1 } from "../../api/v1/field.api";

export class FieldDataV1 {
  type: FieldType;
  name: string;
  value: string;
  linkedId: LinkedIdType;

  constructor(response?: FieldApiV1) {
    if (response == null) {
      return;
    }
    this.type = response.type;
    this.name = response.name;
    this.value = response.value;
    this.linkedId = response.linkedId;
  }
}
