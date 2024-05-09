import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillConstants } from "./autofill-constants";

export class AutofillFieldQualificationService {
  autofillPageDetails: AutofillPageDetails;
  private searchFieldNamesSet = new Set(AutoFillConstants.SearchFieldNames);
  private excludedAutofillLoginTypesSet = new Set(AutoFillConstants.ExcludedAutofillLoginTypes);
  private fieldIgnoreListString = AutoFillConstants.FieldIgnoreList.join(",");
  private passwordFieldExcludeListString = AutoFillConstants.PasswordFieldExcludeList.join(",");

  setAutofillPageDetails(autofillPageDetails: AutofillPageDetails): void {
    this.autofillPageDetails = autofillPageDetails;
  }

  isLoginUsernameField(field: AutofillField): boolean {
    return false;
  }

  isLoginPasswordField(field: AutofillField): boolean {
    if (
      field.type !== "password" ||
      field.autoComplete === "new-password" ||
      this.isExcludedFieldType(field, this.excludedAutofillLoginTypesSet)
    ) {
      return false;
    }

    if (this.fieldHasDisqualifyingAttributeValue(field)) {
      return false;
    }

    if (field.type === "password") {
      return true;
    }

    return this.isPseudoPasswordField(field);
  }

  private isPseudoPasswordField(field: AutofillField): boolean {
    if (field.type !== "text") {
      return false;
    }

    const testedValues = [field.htmlID, field.htmlName, field.placeholder];
    for (let i = 0; i < testedValues.length; i++) {
      if (this.valueIsLikePassword(testedValues[i])) {
        return true;
      }
    }

    return false;
  }

  private valueIsLikePassword(value: string): boolean {
    if (value == null) {
      return false;
    }
    // Removes all whitespace, _ and - characters
    const cleanedValue = value.toLowerCase().replace(/[\s_-]/g, "");

    if (cleanedValue.indexOf("password") < 0) {
      return false;
    }

    return !(this.passwordFieldExcludeListString.indexOf(cleanedValue) > -1);
  }

  private fieldHasDisqualifyingAttributeValue(field: AutofillField): boolean {
    const checkedAttributeValues = [field.htmlID, field.htmlName, field.placeholder];

    for (let i = 0; i < checkedAttributeValues.length; i++) {
      const checkedAttributeValue = checkedAttributeValues[i];
      const cleanedValue = checkedAttributeValue?.toLowerCase().replace(/[\s_-]/g, "");

      if (cleanedValue && this.fieldIgnoreListString.indexOf(cleanedValue) > -1) {
        return true;
      }
    }

    return false;
  }

  private isExcludedFieldType(field: AutofillField, excludedTypes: Set<string>): boolean {
    if (excludedTypes.has(field.type)) {
      return true;
    }

    return this.isSearchField(field);
  }

  private isSearchField(field: AutofillField): boolean {
    const matchFieldAttributeValues = [field.type, field.htmlName, field.htmlID, field.placeholder];
    for (let attrIndex = 0; attrIndex < matchFieldAttributeValues.length; attrIndex++) {
      if (!matchFieldAttributeValues[attrIndex]) {
        continue;
      }

      // Separate camel case words and case them to lower case values
      const camelCaseSeparatedFieldAttribute = matchFieldAttributeValues[attrIndex]
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();
      // Split the attribute by non-alphabetical characters to get the keywords
      const attributeKeywords = camelCaseSeparatedFieldAttribute.split(/[^a-z]/gi);

      for (let keywordIndex = 0; keywordIndex < attributeKeywords.length; keywordIndex++) {
        if (this.searchFieldNamesSet.has(attributeKeywords[keywordIndex])) {
          return true;
        }
      }
    }

    return false;
  }
}
