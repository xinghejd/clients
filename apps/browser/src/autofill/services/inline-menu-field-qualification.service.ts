import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillConstants } from "./autofill-constants";

export class InlineMenuFieldQualificationService {
  private searchFieldNamesSet = new Set(AutoFillConstants.SearchFieldNames);
  private excludedAutofillLoginTypesSet = new Set(AutoFillConstants.ExcludedAutofillLoginTypes);
  private usernameFieldTypes = new Set(["text", "email", "number", "tel"]);
  private fieldIgnoreListString = AutoFillConstants.FieldIgnoreList.join(",");
  private passwordFieldExcludeListString = AutoFillConstants.PasswordFieldExcludeList.join(",");
  private autofillFieldKeywordsMap: WeakMap<AutofillField, string> = new WeakMap();
  private autocompleteDisabledValues = new Set(["off", "false"]);
  private newUsernameKeywords = new Set(["new", "change", "neue", "ändern"]);

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

    // If a single username and a single password field exists on the page, we should
    // assume that this field is part of a login form
    const usernameFieldsInPageDetails = pageDetails.fields.filter(this.isUsernameField);
    const passwordFieldsInPageDetails = pageDetails.fields.filter(this.isCurrentPasswordField);
    if (usernameFieldsInPageDetails.length === 1 && passwordFieldsInPageDetails.length === 1) {
      return true;
    }

    // If no form parent is found and the autocomplete attribute is set to "off" or "false", this is not a password field
    const parentForm = pageDetails.forms[field.form];
    if (!parentForm) {
      // If no parent form is found, and multiple password fields are present, this is likely a login creation form.
      if (passwordFieldsInPageDetails.length > 1) {
        return false;
      }

      return !this.autocompleteDisabledValues.has(field.autoCompleteType);
    }

    // If the field has a form parent and there are multiple visible password fields in the form, this is not a login form field
    const visiblePasswordFieldsInPageDetails = passwordFieldsInPageDetails.filter(
      (f) => f.form === field.form && f.viewable,
    );
    if (visiblePasswordFieldsInPageDetails.length > 1) {
      return false;
    }

    // If the form has any visible username fields, we should treat the field as part of a login form
    const visibleUsernameFields = usernameFieldsInPageDetails.filter(
      (f) => f.form === field.form && f.viewable,
    );
    if (visibleUsernameFields.length > 0) {
      return true;
    }

    // If the field has a form parent a no username field exists and the field has an autocomplete attribute set to "off" or "false", this is not a password field
    return !this.autocompleteDisabledValues.has(field.autoCompleteType);
  }

  private isUsernameFieldForLoginForm(
    field: AutofillField,
    pageDetails: AutofillPageDetails,
  ): boolean {
    // If the provided field is set with an autocomplete of "username", we should assume that
    // the page developer intends for this field to be interpreted as a username field.
    if (field.autoCompleteType === "username") {
      return true;
    }

    // TODO: Assert whether this is worth it... this could be very risky.
    // If any keywords in the field's data indicates that this is a field for a "new" or "changed"
    // username, we should assume that this field is not for a login form.
    if (this.keywordsFoundInFieldData(field, [...this.newUsernameKeywords])) {
      return false;
    }

    // If the field is not explicitly set as a username field, we need to qualify
    // the field based on the other fields that are present on the page.
    const parentForm = pageDetails.forms[field.form];
    const passwordFieldsInPageDetails = pageDetails.fields.filter(this.isCurrentPasswordField);

    // If the field is not structured within a form, we need to identify if the field is used in conjunction
    // with a password field. If that's the case, then we should assume that it is a form field element.
    if (!parentForm) {
      // If a formless field is present in a webpage with a single password field, we
      // should assume that it is part of a login workflow.
      if (passwordFieldsInPageDetails.length === 1) {
        return true;
      }

      // If more than a single password field exists on the page, we should assume that the field
      // is part of an account creation form.
      const visiblePasswordFieldsInPageDetails = passwordFieldsInPageDetails.filter(
        (passwordField) => passwordField.viewable,
      );
      if (visiblePasswordFieldsInPageDetails.length > 1) {
        return false;
      }

      // If the page does not contain any password fields, it might be part of a multistep login form.
      // That will only be the case if the field does not explicitly have its autocomplete attribute
      // set to "off" or "false".
      return !this.autocompleteDisabledValues.has(field.autoCompleteType);
    }

    // If the field is structured within a form, but no password fields are present in the form,
    // we need to consider whether the field is part of a multistep login form.
    if (passwordFieldsInPageDetails.length === 0) {
      // If the field's autocomplete is set to a disabled value, we should assume that the field is
      // not part of a login form.
      if (this.autocompleteDisabledValues.has(field.autoCompleteType)) {
        return false;
      }

      // If the form that contains the field has more than one visible field, we should assume
      // that the field is part of an account creation form.
      const fieldsWithinForm = pageDetails.fields.filter(
        (pageDetailsField) => pageDetailsField.form === field.form && pageDetailsField.viewable,
      );
      return fieldsWithinForm.length === 1;
    }

    // If a single password field exists within the page details, and that password field is part of
    // the same form as the provided field, we should assume that the field is part of a login form.
    if (
      passwordFieldsInPageDetails.length === 1 &&
      field.form === passwordFieldsInPageDetails[0].form
    ) {
      return true;
    }

    // If multiple visible password fields exist within the page details, we need to assume that the
    // provided field is part of an account creation form.
    const visiblePasswordFieldsInPageDetails = passwordFieldsInPageDetails.filter(
      (passwordField) => passwordField.form === field.form && passwordField.viewable,
    );
    return visiblePasswordFieldsInPageDetails.length === 1;
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
