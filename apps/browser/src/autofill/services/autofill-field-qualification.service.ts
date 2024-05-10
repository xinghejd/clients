import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillConstants } from "./autofill-constants";

export class AutofillFieldQualificationService {
  private searchFieldNamesSet = new Set(AutoFillConstants.SearchFieldNames);
  private excludedAutofillLoginTypesSet = new Set(AutoFillConstants.ExcludedAutofillLoginTypes);
  private usernameFieldTypes = new Set(["text", "email", "tel"]);
  private fieldIgnoreListString = AutoFillConstants.FieldIgnoreList.join(",");
  private passwordFieldExcludeListString = AutoFillConstants.PasswordFieldExcludeList.join(",");
  private autofillFieldKeywordsMap: WeakMap<AutofillField, string> = new WeakMap();

  isFieldForLoginForm(field: AutofillField, pageDetails: AutofillPageDetails): boolean {
    // Check if the field
    return false;
  }

  isUsernameField(field: AutofillField): boolean {
    if (
      !this.usernameFieldTypes.has(field.type) ||
      this.isExcludedFieldType(field, this.excludedAutofillLoginTypesSet)
    ) {
      return false;
    }

    return this.keywordsFoundInFieldData(field, AutoFillConstants.UsernameFieldNames);
  }

  isExistingPasswordField(field: AutofillField): boolean {
    if (field.autoComplete === "new-password") {
      return false;
    }

    return this.isPasswordField(field);
  }

  isPasswordField(field: AutofillField): boolean {
    const isInputPasswordType = field.type === "password";
    if (
      !isInputPasswordType ||
      this.isExcludedFieldType(field, this.excludedAutofillLoginTypesSet) ||
      this.fieldHasDisqualifyingAttributeValue(field)
    ) {
      return false;
    }

    return isInputPasswordType || this.isLikePasswordField(field);
  }

  private isLikePasswordField(field: AutofillField): boolean {
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

  private keywordsFoundInFieldData(autofillFieldData: AutofillField, keywords: string[]) {
    const searchedString = this.getAutofillFieldDataKeywords(autofillFieldData);
    return keywords.some((keyword) => searchedString.includes(keyword));
  }

  private getAutofillFieldDataKeywords(autofillFieldData: AutofillField) {
    if (this.autofillFieldKeywordsMap.has(autofillFieldData)) {
      return this.autofillFieldKeywordsMap.get(autofillFieldData);
    }

    const keywordValues = [
      autofillFieldData.htmlID,
      autofillFieldData.htmlName,
      autofillFieldData.htmlClass,
      autofillFieldData.type,
      autofillFieldData.title,
      autofillFieldData.placeholder,
      autofillFieldData.autoCompleteType,
      autofillFieldData["label-data"],
      autofillFieldData["label-aria"],
      autofillFieldData["label-left"],
      autofillFieldData["label-right"],
      autofillFieldData["label-tag"],
      autofillFieldData["label-top"],
    ]
      .join(",")
      .toLowerCase();
    this.autofillFieldKeywordsMap.set(autofillFieldData, keywordValues);

    return keywordValues;
  }
}
