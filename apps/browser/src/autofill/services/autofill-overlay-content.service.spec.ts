import { mock } from "jest-mock-extended";

import { createAutofillFieldMock } from "../jest/autofill-mocks";
import AutofillField from "../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../types";
import { AutofillOverlayVisibility } from "../utils/autofill-overlay.enum";

import { AutoFillConstants } from "./autofill-constants";
import AutofillOverlayContentService from "./autofill-overlay-content.service";

const defaultWindowReadyState = document.readyState;
describe("AutofillOverlayContentService", () => {
  let autofillOverlayContentService: AutofillOverlayContentService;
  let sendExtensionMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    autofillOverlayContentService = new AutofillOverlayContentService();
    sendExtensionMessageSpy = jest
      .spyOn(autofillOverlayContentService as any, "sendExtensionMessage")
      .mockResolvedValue(undefined);
    Object.defineProperty(document, "readyState", {
      value: defaultWindowReadyState,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("init", () => {
    let setupMutationObserverSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(document, "addEventListener");
      setupMutationObserverSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "setupMutationObserver"
      );
    });

    it("sets up a DOMContentLoaded event listener that triggers setting up the mutation observers", () => {
      Object.defineProperty(document, "readyState", {
        value: "loading",
        writable: true,
      });

      autofillOverlayContentService.init();

      expect(document.addEventListener).toHaveBeenCalledWith(
        "DOMContentLoaded",
        setupMutationObserverSpy
      );
      expect(setupMutationObserverSpy).not.toHaveBeenCalled();
    });

    it("sets up mutation observers for the body and html element", () => {
      jest
        .spyOn(globalThis, "MutationObserver")
        .mockImplementation(() => mock<MutationObserver>({ observe: jest.fn() }));
      const handleOverlayElementMutationObserverUpdateSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "handleOverlayElementMutationObserverUpdate"
      );
      const handleBodyElementMutationObserverUpdateSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "handleBodyElementMutationObserverUpdate"
      );
      const handleDocumentElementMutationObserverUpdateSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "handleDocumentElementMutationObserverUpdate"
      );

      autofillOverlayContentService.init();

      expect(setupMutationObserverSpy).toHaveBeenCalledTimes(1);
      expect(globalThis.MutationObserver).toHaveBeenNthCalledWith(
        1,
        handleOverlayElementMutationObserverUpdateSpy
      );
      expect(globalThis.MutationObserver).toHaveBeenNthCalledWith(
        2,
        handleBodyElementMutationObserverUpdateSpy
      );
      expect(globalThis.MutationObserver).toHaveBeenNthCalledWith(
        3,
        handleDocumentElementMutationObserverUpdateSpy
      );
    });
  });

  describe("setupAutofillOverlayListenerOnField", () => {
    let autofillFieldElement: ElementWithOpId<FormFieldElement>;
    let autofillFieldData: AutofillField;

    beforeEach(() => {
      document.body.innerHTML = `
      <form id="validFormId">
        <input type="text" id="username-field" placeholder="username" />
        <input type="password" id="password-field" placeholder="password" />
      </form>
      `;

      autofillFieldElement = document.getElementById(
        "username-field"
      ) as ElementWithOpId<FormFieldElement>;
      autofillFieldElement.opid = "op-1";
      jest.spyOn(autofillFieldElement, "addEventListener");
      autofillFieldData = createAutofillFieldMock({
        opid: "username-field",
        form: "validFormId",
        placeholder: "username",
        elementNumber: 1,
      });
    });

    describe("skips setup for ignored form fields", () => {
      beforeEach(() => {
        autofillFieldData = mock<AutofillField>();
      });

      it("ignores fields that are readonly", () => {
        autofillFieldData.readonly = true;

        autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that contain a disabled attribute", () => {
        autofillFieldData.disabled = true;

        autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that are not viewable", () => {
        autofillFieldData.viewable = false;

        autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that are part of the ExcludedAutofillTypes", () => {
        AutoFillConstants.ExcludedAutofillTypes.forEach((excludedType) => {
          autofillFieldData.type = excludedType;

          autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );

          expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
        });
      });

      it("ignores fields that contain the keyword `search`", () => {
        autofillFieldData.placeholder = "search";

        autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that contain the keyword `captcha` ", () => {
        autofillFieldData.placeholder = "captcha";

        autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that do not appear as a login field", () => {
        autofillFieldData.placeholder = "not-a-login-field";

        autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });
    });

    describe("identifies the overlay visibility setting", () => {
      it("defaults the overlay visibility setting to `OnFieldFocus` if a value is not set", async () => {
        sendExtensionMessageSpy.mockResolvedValueOnce(undefined);
        autofillOverlayContentService.autofillOverlayVisibility = undefined;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("getAutofillOverlayVisibility");
        expect(autofillOverlayContentService.autofillOverlayVisibility).toEqual(
          AutofillOverlayVisibility.OnFieldFocus
        );
      });

      it("sets the overlay visibility setting to the value returned from the background script", async () => {
        sendExtensionMessageSpy.mockResolvedValueOnce(AutofillOverlayVisibility.OnFieldFocus);
        autofillOverlayContentService.autofillOverlayVisibility = undefined;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillOverlayContentService.autofillOverlayVisibility).toEqual(
          AutofillOverlayVisibility.OnFieldFocus
        );
      });
    });

    describe("sets up form field element listeners", () => {
      it("removes all cached event listeners from the form field element", async () => {
        jest.spyOn(autofillFieldElement, "removeEventListener");
        const inputHandler = jest.fn();
        const clickHandler = jest.fn();
        const focusHandler = jest.fn();
        autofillOverlayContentService["eventHandlersMemo"] = {
          "op-1-username-field-input-handler": inputHandler,
          "op-1-username-field-click-handler": clickHandler,
          "op-1-username-field-focus-handler": focusHandler,
        };

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.removeEventListener).toHaveBeenNthCalledWith(
          1,
          "input",
          inputHandler
        );
        expect(autofillFieldElement.removeEventListener).toHaveBeenNthCalledWith(
          2,
          "click",
          clickHandler
        );
        expect(autofillFieldElement.removeEventListener).toHaveBeenNthCalledWith(
          3,
          "focus",
          focusHandler
        );
      });

      it("sets up a blur event listener", async () => {
        const handleFormFieldBlurEventSpy = jest.spyOn(
          autofillOverlayContentService as any,
          "handleFormFieldBlurEvent"
        );

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).toHaveBeenCalledWith(
          "blur",
          handleFormFieldBlurEventSpy
        );
      });

      it("sets up a keyup event listener", async () => {
        const handleFormFieldKeyupEventSpy = jest.spyOn(
          autofillOverlayContentService as any,
          "handleFormFieldKeyupEvent"
        );

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).toHaveBeenCalledWith(
          "keyup",
          handleFormFieldKeyupEventSpy
        );
      });

      it("sets up a input change event listener", async () => {
        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).toHaveBeenCalledWith(
          "input",
          expect.any(Function)
        );
      });

      it("sets up a click event listener", async () => {
        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).toHaveBeenCalledWith(
          "click",
          expect.any(Function)
        );
      });

      it("sets up a focus event listener", async () => {
        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillFieldElement.addEventListener).toHaveBeenCalledWith(
          "focus",
          expect.any(Function)
        );
      });
    });
  });
});
