import { FieldType, LinkedIdType } from "../../../../enums";
import { FieldApiV2 } from "../../api/v2/field.api";

export class FieldDataV2 {
  type: FieldType;
  name: string;
  value: string;
  linkedId: LinkedIdType;

  constructor(response?: FieldApiV2) {
    if (response == null) {
      return;
    }
    this.type = response.type;
    this.name = response.name;
    this.value = response.value;
    this.linkedId = response.linkedId;
  }
}
