import { mock, MockProxy } from "jest-mock-extended";

import AutofillField from "../models/autofill-field";
import AutofillForm from "../models/autofill-form";
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
    describe("qualifying a password field for a login form", () => {
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

        describe("does not have a parent form element", () => {
          beforeEach(() => {
            pageDetails.forms = {};
          });

          it("on a page that has more than one password field", () => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "",
            });
            const secondField = mock<AutofillField>({
              type: "password",
              htmlID: "some-other-password",
              htmlName: "some-other-password",
              placeholder: "some-other-password",
            });
            pageDetails.fields = [field, secondField];

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(false);
          });

          it("on a page that has more than one visible username field", () => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "",
            });
            const usernameField = mock<AutofillField>({
              type: "text",
              htmlID: "user-username",
              htmlName: "user-username",
              placeholder: "user-username",
            });
            const secondUsernameField = mock<AutofillField>({
              type: "text",
              htmlID: "some-other-user-username",
              htmlName: "some-other-user-username",
              placeholder: "some-other-user-username",
            });
            pageDetails.fields = [field, usernameField, secondUsernameField];

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(false);
          });

          it("has a disabled `autocompleteType` value", () => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "",
              autoCompleteType: "off",
            });

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(false);
          });
        });

        describe("has a parent form element", () => {
          let form: MockProxy<AutofillForm>;

          beforeEach(() => {
            form = mock<AutofillForm>({ opid: "validFormId" });
            pageDetails.forms = {
              validFormId: form,
            };
          });

          it("is structured with other password fields in the same form", () => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "validFormId",
            });
            const secondField = mock<AutofillField>({
              type: "password",
              htmlID: "some-other-password",
              htmlName: "some-other-password",
              placeholder: "some-other-password",
              form: "validFormId",
            });
            pageDetails.fields = [field, secondField];

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(false);
          });
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

        describe("does not have a parent form element", () => {
          it("is the only password field on the page, has one username field on the page, and has a non-disabled `autocompleteType` value", () => {
            pageDetails.forms = {};
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "",
              autoCompleteType: "current-password",
            });
            const usernameField = mock<AutofillField>({
              type: "text",
              htmlID: "user-username",
              htmlName: "user-username",
              placeholder: "user-username",
            });
            pageDetails.fields = [field, usernameField];

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(true);
          });
        });

        describe("has a parent form element", () => {
          let form: MockProxy<AutofillForm>;

          beforeEach(() => {
            form = mock<AutofillForm>({ opid: "validFormId" });
            pageDetails.forms = {
              validFormId: form,
            };
          });

          it("is the only password field within the form and has a visible username field", () => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "validFormId",
            });
            const secondPasswordField = mock<AutofillField>({
              type: "password",
              htmlID: "some-other-password",
              htmlName: "some-other-password",
              placeholder: "some-other-password",
              form: "anotherFormId",
            });
            const usernameField = mock<AutofillField>({
              type: "text",
              htmlID: "user-username",
              htmlName: "user-username",
              placeholder: "user-username",
              form: "validFormId",
            });
            pageDetails.fields = [field, secondPasswordField, usernameField];

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(true);
          });

          it("is the only password field within the form and has a non-disabled `autocompleteType` value", () => {
            const field = mock<AutofillField>({
              type: "password",
              htmlID: "user-password",
              htmlName: "user-password",
              placeholder: "user-password",
              form: "validFormId",
              autoCompleteType: "",
            });
            const secondPasswordField = mock<AutofillField>({
              type: "password",
              htmlID: "some-other-password",
              htmlName: "some-other-password",
              placeholder: "some-other-password",
              form: "anotherFormId",
            });
            pageDetails.fields = [field, secondPasswordField];

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(field, pageDetails),
            ).toBe(true);
          });
        });
      });
    });

    describe("validating a username field for a login form", () => {});
  });
});
