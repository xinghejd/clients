import { mock, MockProxy } from "jest-mock-extended";

import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillConstants } from "./autofill-constants";
import { InlineMenuFieldQualificationService } from "./inline-menu-field-qualification.service";

describe("InlineMenuFieldQualificationService", () => {
  let pageDetails: MockProxy<AutofillPageDetails>;
  let inlineMenuFieldQualificationService: InlineMenuFieldQualificationService;

  beforeEach(() => {
    pageDetails = mock<AutofillPageDetails>();
    inlineMenuFieldQualificationService = new InlineMenuFieldQualificationService();
  });

  describe("isFieldForLoginForm", () => {
    describe("validating a password field for a login form", () => {
      describe("an invalid password field", () => {
        it("has a `new-password` autoCompleteType", () => {
          const newPasswordField = mock<AutofillField>({
            type: "password",
            autoCompleteType: "new-password",
          });

          expect(
            inlineMenuFieldQualificationService.isFieldForLoginForm(newPasswordField, pageDetails),
          ).toBe(false);
        });

        it("has a type that is an excluded type", () => {
          AutoFillConstants.ExcludedAutofillLoginTypes.forEach((excludedType) => {
            const excludedField = mock<AutofillField>({
              type: excludedType,
            });

            expect(
              inlineMenuFieldQualificationService.isFieldForLoginForm(excludedField, pageDetails),
            ).toBe(false);
          });
        });
      });

      describe("a valid password field", () => {});
    });

    describe("validating a username field for a login form", () => {});
  });
});
