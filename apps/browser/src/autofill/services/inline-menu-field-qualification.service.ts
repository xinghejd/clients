import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillConstants } from "./autofill-constants";

export class InlineMenuFieldQualificationService {
  private searchFieldNamesSet = new Set(AutoFillConstants.SearchFieldNames);
  private excludedAutofillLoginTypesSet = new Set(AutoFillConstants.ExcludedAutofillLoginTypes);
  private usernameFieldTypes = new Set(["text", "email", "tel"]);
  private fieldIgnoreListString = AutoFillConstants.FieldIgnoreList.join(",");
  private passwordFieldExcludeListString = AutoFillConstants.PasswordFieldExcludeList.join(",");
  private autofillFieldKeywordsMap: WeakMap<AutofillField, string> = new WeakMap();
  private invalidAutocompleteValuesSet = new Set(["off", "false"]);

  isFieldForLoginForm(field: AutofillField, pageDetails: AutofillPageDetails): boolean {
    const isCurrentPasswordField = this.isCurrentPasswordField(field);
    if (isCurrentPasswordField) {
      return this.isPasswordFieldForLoginForm(field, pageDetails);
    }

    const isUsernameField = this.isUsernameField(field);
    if (!isUsernameField) {
      return false;
    }

    return this.isUsernameFieldForLoginForm(field, pageDetails);
  }

  private isPasswordFieldForLoginForm(
    field: AutofillField,
    pageDetails: AutofillPageDetails,
  ): boolean {
    // Check if the autocomplete attribute is set to "current-password", if so treat this as a password field
    if (field.autoCompleteType === "current-password") {
      return true;
    }

    // Check if the field has a form parent
    const parentForm = pageDetails.forms[field.form];
    const usernameFieldsInPageDetails = pageDetails.fields.filter(this.isUsernameField);
    const passwordFieldsInPageDetails = pageDetails.fields.filter(this.isCurrentPasswordField);
    // If no form parent is found, check if a username field exists and no other password fields are found in the page details, if so treat this as a password field
    if (
      !parentForm &&
      usernameFieldsInPageDetails.length === 1 &&
      passwordFieldsInPageDetails.length === 1
    ) {
      return true;
    }

    // If no form parent is found and the autocomplete attribute is set to "off" or "false", this is not a password field
    if (!parentForm && this.invalidAutocompleteValuesSet.has(field.autoCompleteType)) {
      return false;
    }

    // If the field has a form parent and if the form has  username field and no other password fields exist, if so treat this as a password field
    if (
      parentForm &&
      usernameFieldsInPageDetails.length === 1 &&
      passwordFieldsInPageDetails.length === 1
    ) {
      return true;
    }

    // If the field has a form parent and there are multiple visible password fields in the form, this is not a username field
    const visiblePasswordFieldsInPageDetails = passwordFieldsInPageDetails.filter(
      (field) => field.viewable,
    );
    if (parentForm && visiblePasswordFieldsInPageDetails.length > 1) {
      return false;
    }

    // If the field has a form parent a no username field exists and the field has an autocomplete attribute set to "off" or "false", this is not a password field
    if (
      parentForm &&
      usernameFieldsInPageDetails.length === 0 &&
      this.invalidAutocompleteValuesSet.has(field.autoCompleteType)
    ) {
      return false;
    }

    return true;
  }

  private isUsernameFieldForLoginForm(
    field: AutofillField,
    pageDetails: AutofillPageDetails,
  ): boolean {
    // console.log(field);

    // Check if the autocomplete attribute is set to "username", if so treat this as a username field
    if (field.autoCompleteType === "username") {
      return true;
    }

    // Check if the field has a form parent
    const parentForm = pageDetails.forms[field.form];
    const passwordFieldsInPageDetails = pageDetails.fields.filter(this.isCurrentPasswordField);
    // console.log(passwordFieldsInPageDetails);

    // If no form parent is found, check if a single password field is found in the page details, if so treat this as a username field
    if (!parentForm && passwordFieldsInPageDetails.length === 1) {
      // TODO: We should consider checking the distance between the username and password fields in the DOM to determine if they are close enough to be considered a pair
      return true;
    }

    // If no form parent is found and the autocomplete attribute is set to "off" or "false", this is not a username field
    if (!parentForm && this.invalidAutocompleteValuesSet.has(field.autoCompleteType)) {
      // console.log("invalid autocomplete value");
      return false;
    }

    // If the field has a form parent and if the form has a single password field, if so treat this as a username field
    if (
      parentForm &&
      passwordFieldsInPageDetails.length === 1 &&
      parentForm === pageDetails.forms[passwordFieldsInPageDetails[0].form] &&
      field.elementNumber < passwordFieldsInPageDetails[0].elementNumber
    ) {
      // console.log("shared form");
      return true;
    }

    // If the field has a form parent and the form has a single password that is before the username, this is not a username field
    if (
      parentForm &&
      passwordFieldsInPageDetails.length === 1 &&
      (parentForm !== pageDetails.forms[passwordFieldsInPageDetails[0].form] ||
        field.elementNumber >= passwordFieldsInPageDetails[0].elementNumber)
    ) {
      // console.log("username field is below password field");
      return false;
    }

    // If the field has a form parent and there are multiple visible password fields in the form, this is not a username field
    const visiblePasswordFieldsInPageDetails = passwordFieldsInPageDetails.filter(
      (field) => field.viewable,
    );
    if (parentForm && visiblePasswordFieldsInPageDetails.length > 1) {
      // console.log("multiple password fields");
      return false;
    }

    // If the field has a form parent and the form has no password fields and has an autocomplete attribute set to "off" or "false", this is not a username field
    if (
      parentForm &&
      passwordFieldsInPageDetails.length === 0 &&
      this.invalidAutocompleteValuesSet.has(field.autoCompleteType)
    ) {
      // console.log("no password fields");
      return false;
    }

    const otherFieldsInForm = pageDetails.fields.filter((f) => f.form === field.form);
    // If the parent form has no password fields and the form has multiple fields, this is not a username field
    if (parentForm && passwordFieldsInPageDetails.length === 0 && otherFieldsInForm.length > 1) {
      return false;
    }

    // console.log("no previous conditions met");
    return true;
  }

  isUsernameField = (field: AutofillField): boolean => {
    if (
      !this.usernameFieldTypes.has(field.type) ||
      this.isExcludedFieldType(field, this.excludedAutofillLoginTypesSet)
    ) {
      return false;
    }

    return this.keywordsFoundInFieldData(field, AutoFillConstants.UsernameFieldNames);
  };

  isCurrentPasswordField = (field: AutofillField): boolean => {
    if (field.autoCompleteType === "new-password") {
      return false;
    }

    return this.isPasswordField(field);
  };

  isPasswordField = (field: AutofillField): boolean => {
    const isInputPasswordType = field.type === "password";
    if (
      !isInputPasswordType ||
      this.isExcludedFieldType(field, this.excludedAutofillLoginTypesSet) ||
      this.fieldHasDisqualifyingAttributeValue(field)
    ) {
      return false;
    }

    return isInputPasswordType || this.isLikePasswordField(field);
  };

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
