import { mock, MockProxy } from "jest-mock-extended";

import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillConstants } from "./autofill-constants";
import { InlineMenuFieldQualificationService } from "./inline-menu-field-qualification.service";

describe("InlineMenuFieldQualificationService", () => {
  let pageDetails: MockProxy<AutofillPageDetails>;
  let inlineMenuFieldQualificationService: InlineMenuFieldQualificationService;

  beforeEach(() => {
    pageDetails = mock<AutofillPageDetails>({
      forms: {},
      fields: [],
    });
    inlineMenuFieldQualificationService = new InlineMenuFieldQualificationService();
  });

  describe("isFieldForLoginForm", () => {
    describe("validating a password field for a login form", () => {
      describe("an invalid password field", () => {
        it("has a `new-password` autoCompleteType", () => {
          const field = mock<AutofillField>({
            type: "password",
            autoCompleteType: "new-password",
          });

          expect(inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails)).toBe(
            false,
          );
        });

        it("has a type that is an excluded type", () => {
          AutoFillConstants.ExcludedAutofillLoginTypes.forEach((excludedType) => {
            const field = mock<AutofillField>({
              type: excludedType,
            });

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(false);
          });
        });

        it("has an attribute present on the FieldIgnoreList, indicating that the field is a captcha", () => {
          AutoFillConstants.FieldIgnoreList.forEach((attribute, index) => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: index === 0 ? attribute : "",
              htmlName: index === 1 ? attribute : "",
              placeholder: index > 1 ? attribute : "",
            });

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(false);
          });
        });

        it("has a type other than `password` or `text`", () => {
          const field = mock<AutofillField>({
            type: "number",
            htmlID: "not-password",
            htmlName: "not-password",
            placeholder: "not-password",
          });

          expect(inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails)).toBe(
            false,
          );
        });

        it("has a type of `text` without an attribute that indicates the field is a password field", () => {
          const field = mock<AutofillField>({
            type: "text",
            htmlID: "something-else",
            htmlName: "something-else",
            placeholder: "something-else",
          });

          expect(inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails)).toBe(
            false,
          );
        });

        it("has a type of `text` and contains attributes that indicates the field is a search field", () => {
          const field = mock<AutofillField>({
            type: "text",
            htmlID: "search",
            htmlName: "something-else",
            placeholder: "something-else",
          });

          expect(inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails)).toBe(
            false,
          );
        });
      });

      describe("a valid password field", () => {
        it("has an autoCompleteType of `current-password`", () => {
          const field = mock<AutofillField>({
            type: "password",
            autoCompleteType: "current-password",
            htmlID: "user-password",
            htmlName: "user-password",
            placeholder: "user-password",
          });

          expect(inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails)).toBe(
            true,
          );
        });

        it("has a type of `text` with an attribute that indicates the field is a password field", () => {
          const field = mock<AutofillField>({
            type: "text",
            htmlID: null,
            htmlName: "user-password",
            placeholder: "user-password",
          });

          expect(inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails)).toBe(
            true,
          );
        });
      });
    });

    describe("validating a username field for a login form", () => {});
  });
});
