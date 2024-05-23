import { CardApiV1 } from "../../api/v1/card.api";

export class CardDataV1 {
  cardholderName: string;
  brand: string;
  number: string;
  expMonth: string;
  expYear: string;
  code: string;

  constructor(data?: CardApiV1) {
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
