import AutofillField from "../../models/autofill-field";
import AutofillPageDetails from "../../models/autofill-page-details";

export interface InlineMenuFieldQualificationService {
  isFieldForLoginForm(field: AutofillField, pageDetails: AutofillPageDetails): boolean;
  isFieldForCreditCardForm(field: AutofillField): boolean;
  isFieldForCardholderName(field: AutofillField): boolean;
  isFieldForCardNumber(field: AutofillField): boolean;
  isFieldForCardExpirationDate(field: AutofillField): boolean;
  isFieldForCardExpirationMonth(field: AutofillField): boolean;
  isFieldForCardExpirationYear(field: AutofillField): boolean;
  isFieldForCardCvv(field: AutofillField): boolean;
  isFieldForCardBrand(field: AutofillField): boolean;
}
