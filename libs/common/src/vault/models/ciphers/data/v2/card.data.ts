import { CardApiV2 } from "../../api/v2/card.api";

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
}
