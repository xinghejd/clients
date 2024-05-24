import { CardApiV2 } from "../../api/v2/card.api";
import { CardDataV1 } from "../v1/card.data";

export class CardDataV2 {
  cardholderName: string;
  brand: string;
  number: string;
  expMonth: string;
  expYear: string;
  code: string;

  constructor(data?: CardApiV2) {
    if (data == null) {
      return;
    }

    this.cardholderName = data.cardholderName;
    this.brand = data.brand;
    this.number = data.number;
    this.expMonth = data.expMonth;
    this.expYear = data.expYear;
    this.code = data.code;
  }

  static migrate(old: CardDataV1): CardDataV2 {
    const migrated = new CardDataV2();

    migrated.cardholderName = old.cardholderName;
    migrated.brand = old.brand;
    migrated.number = old.number;
    migrated.expMonth = old.expMonth;
    migrated.expYear = old.expYear;
    migrated.code = old.code;

    return migrated;
  }
}
