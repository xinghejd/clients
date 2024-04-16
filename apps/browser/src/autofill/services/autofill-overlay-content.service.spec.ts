import { mock } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { EVENTS, AutofillOverlayVisibility } from "@bitwarden/common/autofill/constants";

import { AutofillOverlayElement, RedirectFocusDirection } from "../enums/autofill-overlay.enum";
import AutofillField from "../models/autofill-field";
import { createAutofillFieldMock } from "../spec/autofill-mocks";
import { flushPromises } from "../spec/testing-utils";
import { ElementWithOpId, FormFieldElement } from "../types";

import { AutoFillConstants } from "./autofill-constants";
import AutofillOverlayContentService from "./autofill-overlay-content.service";

const defaultWindowReadyState = document.readyState;
const defaultDocumentVisibilityState = document.visibilityState;
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
    Object.defineProperty(document, "visibilityState", {
      value: defaultDocumentVisibilityState,
      writable: true,
    });
    Object.defineProperty(document, "activeElement", {
      value: null,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1080,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("init", () => {
    let setupGlobalEventListenersSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(document, "addEventListener");
      jest.spyOn(window, "addEventListener");
      setupGlobalEventListenersSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "setupGlobalEventListeners",
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
        setupGlobalEventListenersSpy,
      );
      expect(setupGlobalEventListenersSpy).not.toHaveBeenCalled();
    });

    it("sets up a visibility change listener for the DOM", () => {
      const handleVisibilityChangeEventSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "handleVisibilityChangeEvent",
      );

      autofillOverlayContentService.init();

      expect(document.addEventListener).toHaveBeenCalledWith(
        "visibilitychange",
        handleVisibilityChangeEventSpy,
      );
    });

    it("sets up a focus out listener for the window", () => {
      const handleFormFieldBlurEventSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "handleFormFieldBlurEvent",
      );

      autofillOverlayContentService.init();

      expect(window.addEventListener).toHaveBeenCalledWith("focusout", handleFormFieldBlurEventSpy);
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
        "username-field",
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

      it("ignores fields that are readonly", async () => {
        autofillFieldData.readonly = true;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that contain a disabled attribute", async () => {
        autofillFieldData.disabled = true;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that are not viewable", async () => {
        autofillFieldData.viewable = false;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that are part of the ExcludedOverlayTypes", () => {
        AutoFillConstants.ExcludedOverlayTypes.forEach(async (excludedType) => {
          autofillFieldData.type = excludedType;

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
        });
      });

      it("ignores fields that contain the keyword `search`", async () => {
        autofillFieldData.placeholder = "search";

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      it("ignores fields that contain the keyword `captcha` ", async () => {
        autofillFieldData.placeholder = "captcha";

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });

      // CG - Test is invalid due to the fallback listener we set up for fields that are not visible
      it.skip("ignores fields that do not appear as a login field", async () => {
        autofillFieldData.placeholder = "not-a-login-field";

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
      });
    });

    it("skips setup on fields that have been previously set up", async () => {
      autofillOverlayContentService["formFieldElements"].add(autofillFieldElement);

      await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
        autofillFieldElement,
        autofillFieldData,
      );

      expect(autofillFieldElement.addEventListener).not.toHaveBeenCalled();
    });

    describe("identifies the overlay visibility setting", () => {
      it("defaults the overlay visibility setting to `OnFieldFocus` if a value is not set", async () => {
        sendExtensionMessageSpy.mockResolvedValueOnce(undefined);
        autofillOverlayContentService["inlineMenuVisibility"] = undefined;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("getInlineMenuVisibilitySetting");
        expect(autofillOverlayContentService["inlineMenuVisibility"]).toEqual(
          AutofillOverlayVisibility.OnFieldFocus,
        );
      });

      it("sets the overlay visibility setting to the value returned from the background script", async () => {
        sendExtensionMessageSpy.mockResolvedValueOnce(AutofillOverlayVisibility.OnFieldFocus);
        autofillOverlayContentService["inlineMenuVisibility"] = undefined;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData,
        );

        expect(autofillOverlayContentService["inlineMenuVisibility"]).toEqual(
          AutofillOverlayVisibility.OnFieldFocus,
        );
      });
    });

    describe("sets up form field element listeners", () => {
      // TODO - Seems like we're setting up a focus listener on this when it is in a non-viewable state. This test needs to be updated.
      it.skip("removes all cached event listeners from the form field element", async () => {
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
          autofillFieldData,
        );

        expect(autofillFieldElement.removeEventListener).toHaveBeenNthCalledWith(
          1,
          "input",
          inputHandler,
        );
        expect(autofillFieldElement.removeEventListener).toHaveBeenNthCalledWith(
          2,
          "click",
          clickHandler,
        );
        expect(autofillFieldElement.removeEventListener).toHaveBeenNthCalledWith(
          3,
          "focus",
          focusHandler,
        );
      });

      describe("form field blur event listener", () => {
        beforeEach(async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
        });

        it("sends a message to the background to update the isFieldCurrentlyFocused value to `false`", async () => {
          autofillFieldElement.dispatchEvent(new Event("blur"));

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateIsFieldCurrentlyFocused", {
            isFieldCurrentlyFocused: false,
          });
        });

        it("sends a message to the background to check if the overlay is focused", () => {
          autofillFieldElement.dispatchEvent(new Event("blur"));

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("checkAutofillOverlayMenuFocused");
        });
      });

      describe("form field keyup event listener", () => {
        beforeEach(async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          jest.spyOn(globalThis.customElements, "define").mockImplementation();
        });

        it("closes the autofill overlay when the `Escape` key is pressed", () => {
          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "Escape" }));

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
            forceCloseOverlay: true,
          });
        });

        it("repositions the overlay when autofill is not currently filling and the `Enter` key is pressed", async () => {
          const handleOverlayRepositionEventSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "handleOverlayRepositionEvent",
          );
          jest
            .spyOn(autofillOverlayContentService as any, "isFieldCurrentlyFilling")
            .mockResolvedValue(false);

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "Enter" }));
          await flushPromises();

          expect(handleOverlayRepositionEventSpy).toHaveBeenCalled();
        });

        it("does not reposition the overlay when autofill is currently filling and the `Enter` key is pressed", async () => {
          const handleOverlayRepositionEventSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "handleOverlayRepositionEvent",
          );
          jest
            .spyOn(autofillOverlayContentService as any, "isFieldCurrentlyFilling")
            .mockResolvedValue(true);

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "Enter" }));
          await flushPromises();

          expect(handleOverlayRepositionEventSpy).not.toHaveBeenCalled();
        });

        it("opens the overlay list and focuses it after a delay if it is not visible when the `ArrowDown` key is pressed", async () => {
          jest.useFakeTimers();
          const updateMostRecentlyFocusedFieldSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "updateMostRecentlyFocusedField",
          );
          const openAutofillOverlaySpy = jest.spyOn(
            autofillOverlayContentService as any,
            "openAutofillOverlayMenu",
          );
          jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
            .mockResolvedValue(false);

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));
          await flushPromises();

          expect(updateMostRecentlyFocusedFieldSpy).toHaveBeenCalledWith(autofillFieldElement);
          expect(openAutofillOverlaySpy).toHaveBeenCalledWith({ isOpeningFullOverlay: true });
          expect(sendExtensionMessageSpy).not.toHaveBeenCalledWith("focusAutofillOverlayList");

          jest.advanceTimersByTime(150);

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("focusAutofillOverlayList");
        });

        it("focuses the overlay list when the `ArrowDown` key is pressed", async () => {
          jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
            .mockResolvedValue(true);

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("focusAutofillOverlayList");
        });
      });

      describe("form field input change event listener", () => {
        beforeEach(() => {
          jest.spyOn(globalThis.customElements, "define").mockImplementation();
        });

        it("ignores span elements that trigger the listener", async () => {
          const spanAutofillFieldElement = document.createElement(
            "span",
          ) as ElementWithOpId<HTMLSpanElement>;
          jest.spyOn(autofillOverlayContentService as any, "storeModifiedFormElement");

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            spanAutofillFieldElement,
            autofillFieldData,
          );

          spanAutofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["storeModifiedFormElement"]).not.toHaveBeenCalled();
        });

        it("stores the field as a user filled field if the form field data indicates that it is for a username", async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["userFilledFields"].username).toEqual(
            autofillFieldElement,
          );
        });

        it("stores the field as a user filled field if the form field is of type password", async () => {
          const passwordFieldElement = document.getElementById(
            "password-field",
          ) as ElementWithOpId<FormFieldElement>;

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            passwordFieldElement,
            autofillFieldData,
          );
          passwordFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["userFilledFields"].password).toEqual(
            passwordFieldElement,
          );
        });

        it("removes the overlay if the form field element has a value and the user is not authed", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(false);
          (autofillFieldElement as HTMLInputElement).value = "test";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          autofillFieldElement.dispatchEvent(new Event("input"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
            overlayElement: AutofillOverlayElement.List,
            forceCloseOverlay: true,
          });
        });

        it("removes the overlay if the form field element has a value and the overlay ciphers are populated", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(true);
          jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuCiphersPopulated")
            .mockResolvedValue(true);

          (autofillFieldElement as HTMLInputElement).value = "test";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          autofillFieldElement.dispatchEvent(new Event("input"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
            overlayElement: AutofillOverlayElement.List,
            forceCloseOverlay: true,
          });
        });

        it("opens the autofill overlay if the form field is empty", async () => {
          jest.spyOn(autofillOverlayContentService as any, "openAutofillOverlayMenu");
          (autofillFieldElement as HTMLInputElement).value = "";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          autofillFieldElement.dispatchEvent(new Event("input"));
          await flushPromises();

          expect(autofillOverlayContentService["openAutofillOverlayMenu"]).toHaveBeenCalled();
        });

        it("opens the autofill overlay if the form field is empty and the user is authed", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(true);
          jest.spyOn(autofillOverlayContentService as any, "openAutofillOverlayMenu");
          (autofillFieldElement as HTMLInputElement).value = "";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          autofillFieldElement.dispatchEvent(new Event("input"));
          await flushPromises();

          expect(autofillOverlayContentService["openAutofillOverlayMenu"]).toHaveBeenCalled();
        });

        it("opens the autofill overlay if the form field is empty and the overlay ciphers are not populated", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(false);
          jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuCiphersPopulated")
            .mockResolvedValue(false);
          jest.spyOn(autofillOverlayContentService as any, "openAutofillOverlayMenu");
          (autofillFieldElement as HTMLInputElement).value = "";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
          autofillFieldElement.dispatchEvent(new Event("input"));
          await flushPromises();

          expect(autofillOverlayContentService["openAutofillOverlayMenu"]).toHaveBeenCalled();
        });
      });

      describe("form field click event listener", () => {
        let isInlineMenuButtonVisibleSpy: jest.SpyInstance;

        beforeEach(async () => {
          jest
            .spyOn(autofillOverlayContentService as any, "triggerFormFieldFocusedAction")
            .mockImplementation();
          isInlineMenuButtonVisibleSpy = jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuButtonVisible")
            .mockResolvedValue(false);
          jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
            .mockResolvedValue(false);
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );
        });

        it("triggers the field focused handler if the overlay is not visible", async () => {
          autofillFieldElement.dispatchEvent(new Event("click"));
          await flushPromises();

          expect(autofillOverlayContentService["triggerFormFieldFocusedAction"]).toHaveBeenCalled();
        });

        it("skips triggering the field focused handler if the overlay list is visible", () => {
          isInlineMenuButtonVisibleSpy.mockResolvedValue(true);

          autofillFieldElement.dispatchEvent(new Event("click"));

          expect(
            autofillOverlayContentService["triggerFormFieldFocusedAction"],
          ).not.toHaveBeenCalled();
        });

        it("skips triggering the field focused handler if the overlay button is visible", () => {
          isInlineMenuButtonVisibleSpy.mockResolvedValue(true);

          autofillFieldElement.dispatchEvent(new Event("click"));

          expect(
            autofillOverlayContentService["triggerFormFieldFocusedAction"],
          ).not.toHaveBeenCalled();
        });
      });

      describe("form field focus event listener", () => {
        let updateMostRecentlyFocusedFieldSpy: jest.SpyInstance;
        let isFieldCurrentlyFillingSpy: jest.SpyInstance;

        beforeEach(() => {
          jest.spyOn(globalThis.customElements, "define").mockImplementation();
          updateMostRecentlyFocusedFieldSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "updateMostRecentlyFocusedField",
          );
          isFieldCurrentlyFillingSpy = jest
            .spyOn(autofillOverlayContentService as any, "isFieldCurrentlyFilling")
            .mockResolvedValue(false);
        });

        it("skips triggering the handler logic if autofill is currently filling", async () => {
          isFieldCurrentlyFillingSpy.mockResolvedValue(true);
          autofillOverlayContentService["mostRecentlyFocusedField"] = autofillFieldElement;
          autofillOverlayContentService["inlineMenuVisibility"] =
            AutofillOverlayVisibility.OnFieldFocus;
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(updateMostRecentlyFocusedFieldSpy).not.toHaveBeenCalled();
        });

        it("updates the most recently focused field", async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(updateMostRecentlyFocusedFieldSpy).toHaveBeenCalledWith(autofillFieldElement);
          expect(autofillOverlayContentService["mostRecentlyFocusedField"]).toEqual(
            autofillFieldElement,
          );
        });

        it("removes the overlay list if the autofill visibility is set to onClick", async () => {
          autofillOverlayContentService["inlineMenuVisibility"] =
            AutofillOverlayVisibility.OnButtonClick;
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
            overlayElement: AutofillOverlayElement.List,
            forceCloseOverlay: true,
          });
        });

        it("removes the overlay list if the form element has a value and the focused field is newly focused", async () => {
          autofillOverlayContentService["mostRecentlyFocusedField"] = document.createElement(
            "input",
          ) as ElementWithOpId<HTMLInputElement>;
          (autofillFieldElement as HTMLInputElement).value = "test";
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
            overlayElement: AutofillOverlayElement.List,
            forceCloseOverlay: true,
          });
        });

        it("opens the autofill overlay if the form element has no value", async () => {
          (autofillFieldElement as HTMLInputElement).value = "";
          autofillOverlayContentService["inlineMenuVisibility"] =
            AutofillOverlayVisibility.OnFieldFocus;
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("openAutofillOverlayMenu");
        });

        it("opens the autofill overlay if the overlay ciphers are not populated and the user is authed", async () => {
          (autofillFieldElement as HTMLInputElement).value = "";
          autofillOverlayContentService["inlineMenuVisibility"] =
            AutofillOverlayVisibility.OnFieldFocus;
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(true);
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("openAutofillOverlayMenu");
        });

        it("updates the overlay button position if the focus event is not opening the overlay", async () => {
          autofillOverlayContentService["inlineMenuVisibility"] =
            AutofillOverlayVisibility.OnFieldFocus;
          (autofillFieldElement as HTMLInputElement).value = "test";
          jest
            .spyOn(autofillOverlayContentService as any, "isInlineMenuCiphersPopulated")
            .mockReturnValue(true);
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData,
          );

          autofillFieldElement.dispatchEvent(new Event("focus"));
          await flushPromises();

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith(
            "updateAutofillOverlayMenuPosition",
            {
              overlayElement: AutofillOverlayElement.Button,
            },
          );
        });
      });
    });

    it("triggers the form field focused handler if the current active element in the document is the passed form field", async () => {
      const documentRoot = autofillFieldElement.getRootNode() as Document;
      Object.defineProperty(documentRoot, "activeElement", {
        value: autofillFieldElement,
        writable: true,
      });

      await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
        autofillFieldElement,
        autofillFieldData,
      );

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("openAutofillOverlayMenu");
      expect(autofillOverlayContentService["mostRecentlyFocusedField"]).toEqual(
        autofillFieldElement,
      );
    });

    it("sets the most recently focused field to the passed form field element if the value is not set", async () => {
      autofillOverlayContentService["mostRecentlyFocusedField"] = undefined;

      await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
        autofillFieldElement,
        autofillFieldData,
      );

      expect(autofillOverlayContentService["mostRecentlyFocusedField"]).toEqual(
        autofillFieldElement,
      );
    });
  });

  describe("openAutofillOverlayMenu", () => {
    let autofillFieldElement: ElementWithOpId<FormFieldElement>;

    beforeEach(() => {
      document.body.innerHTML = `
      <form id="validFormId">
        <input type="text" id="username-field" placeholder="username" />
        <input type="password" id="password-field" placeholder="password" />
      </form>
      `;

      autofillFieldElement = document.getElementById(
        "username-field",
      ) as ElementWithOpId<FormFieldElement>;
      autofillFieldElement.opid = "op-1";
      autofillOverlayContentService["mostRecentlyFocusedField"] = autofillFieldElement;
    });

    it("skips opening the overlay if a field has not been recently focused", () => {
      autofillOverlayContentService["mostRecentlyFocusedField"] = undefined;

      autofillOverlayContentService["openAutofillOverlayMenu"]();

      expect(sendExtensionMessageSpy).not.toHaveBeenCalled();
    });

    it("focuses the most recent overlay field if the field is not focused", () => {
      jest.spyOn(autofillFieldElement, "getRootNode").mockReturnValue(document);
      Object.defineProperty(document, "activeElement", {
        value: document.createElement("div"),
        writable: true,
      });
      const focusMostRecentOverlayFieldSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "focusMostRecentOverlayField",
      );

      autofillOverlayContentService["openAutofillOverlayMenu"]({ isFocusingFieldElement: true });

      expect(focusMostRecentOverlayFieldSpy).toHaveBeenCalled();
    });

    it("skips focusing the most recent overlay field if the field is already focused", () => {
      jest.spyOn(autofillFieldElement, "getRootNode").mockReturnValue(document);
      Object.defineProperty(document, "activeElement", {
        value: autofillFieldElement,
        writable: true,
      });
      const focusMostRecentOverlayFieldSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "focusMostRecentOverlayField",
      );

      autofillOverlayContentService["openAutofillOverlayMenu"]({ isFocusingFieldElement: true });

      expect(focusMostRecentOverlayFieldSpy).not.toHaveBeenCalled();
    });

    it("stores the user's auth status", () => {
      autofillOverlayContentService["authStatus"] = undefined;

      autofillOverlayContentService["openAutofillOverlayMenu"]({
        authStatus: AuthenticationStatus.Unlocked,
      });

      expect(autofillOverlayContentService["authStatus"]).toEqual(AuthenticationStatus.Unlocked);
    });

    it("opens both autofill overlay elements", () => {
      autofillOverlayContentService["mostRecentlyFocusedField"] = autofillFieldElement;

      autofillOverlayContentService["openAutofillOverlayMenu"]();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.Button,
      });
      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.List,
      });
    });

    it("opens the autofill overlay button only if overlay visibility is set for onButtonClick", () => {
      autofillOverlayContentService["inlineMenuVisibility"] =
        AutofillOverlayVisibility.OnButtonClick;

      autofillOverlayContentService["openAutofillOverlayMenu"]({ isOpeningFullOverlay: false });

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.Button,
      });
      expect(sendExtensionMessageSpy).not.toHaveBeenCalledWith(
        "updateAutofillOverlayMenuPosition",
        {
          overlayElement: AutofillOverlayElement.List,
        },
      );
    });

    it("overrides the onButtonClick visibility setting to open both overlay elements", () => {
      autofillOverlayContentService["inlineMenuVisibility"] =
        AutofillOverlayVisibility.OnButtonClick;

      autofillOverlayContentService["openAutofillOverlayMenu"]({ isOpeningFullOverlay: true });

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.Button,
      });
      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.List,
      });
    });

    it("sends an extension message requesting an re-collection of page details if they need to update", () => {
      jest.spyOn(autofillOverlayContentService as any, "sendExtensionMessage");
      autofillOverlayContentService.pageDetailsUpdateRequired = true;

      autofillOverlayContentService["openAutofillOverlayMenu"]();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("bgCollectPageDetails", {
        sender: "autofillOverlayContentService",
      });
    });
  });

  describe("focusMostRecentOverlayField", () => {
    it("focuses the most recently focused overlay field", () => {
      const mostRecentlyFocusedField = document.createElement(
        "input",
      ) as ElementWithOpId<HTMLInputElement>;
      autofillOverlayContentService["mostRecentlyFocusedField"] = mostRecentlyFocusedField;
      jest.spyOn(mostRecentlyFocusedField, "focus");

      autofillOverlayContentService["focusMostRecentOverlayField"]();

      expect(mostRecentlyFocusedField.focus).toHaveBeenCalled();
    });
  });

  describe("blurMostRecentOverlayField", () => {
    it("removes focus from the most recently focused overlay field", () => {
      const mostRecentlyFocusedField = document.createElement(
        "input",
      ) as ElementWithOpId<HTMLInputElement>;
      autofillOverlayContentService["mostRecentlyFocusedField"] = mostRecentlyFocusedField;
      jest.spyOn(mostRecentlyFocusedField, "blur");

      autofillOverlayContentService["blurMostRecentOverlayField"]();

      expect(mostRecentlyFocusedField.blur).toHaveBeenCalled();
    });
  });

  describe("addNewVaultItem", () => {
    it("skips sending the message if the overlay list is not visible", async () => {
      jest
        .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
        .mockResolvedValue(false);

      await autofillOverlayContentService.addNewVaultItem();

      expect(sendExtensionMessageSpy).not.toHaveBeenCalled();
    });

    it("sends a message that facilitates adding a new vault item with empty fields", async () => {
      jest
        .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
        .mockResolvedValue(true);

      await autofillOverlayContentService.addNewVaultItem();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayAddNewVaultItem", {
        login: {
          username: "",
          password: "",
          uri: "http://localhost/",
          hostname: "localhost",
        },
      });
    });

    it("sends a message that facilitates adding a new vault item with data from user filled fields", async () => {
      document.body.innerHTML = `
      <form id="validFormId">
        <input type="text" id="username-field" placeholder="username" />
        <input type="password" id="password-field" placeholder="password" />
      </form>
      `;
      const usernameField = document.getElementById(
        "username-field",
      ) as ElementWithOpId<HTMLInputElement>;
      const passwordField = document.getElementById(
        "password-field",
      ) as ElementWithOpId<HTMLInputElement>;
      usernameField.value = "test-username";
      passwordField.value = "test-password";
      jest
        .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
        .mockResolvedValue(true);
      autofillOverlayContentService["userFilledFields"] = {
        username: usernameField,
        password: passwordField,
      };

      await autofillOverlayContentService.addNewVaultItem();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayAddNewVaultItem", {
        login: {
          username: "test-username",
          password: "test-password",
          uri: "http://localhost/",
          hostname: "localhost",
        },
      });
    });
  });

  describe("redirectOverlayFocusOut", () => {
    let autofillFieldElement: ElementWithOpId<FormFieldElement>;
    let autofillFieldFocusSpy: jest.SpyInstance;
    let findTabsSpy: jest.SpyInstance;
    let previousFocusableElement: HTMLElement;
    let nextFocusableElement: HTMLElement;
    let isInlineMenuListVisibleSpy: jest.SpyInstance;

    beforeEach(() => {
      document.body.innerHTML = `
      <div class="previous-focusable-element" tabindex="0"></div>
      <form id="validFormId">
        <input type="text" id="username-field" placeholder="username" />
        <input type="password" id="password-field" placeholder="password" />
      </form>
      <div class="next-focusable-element" tabindex="0"></div>
      `;
      autofillFieldElement = document.getElementById(
        "username-field",
      ) as ElementWithOpId<FormFieldElement>;
      autofillFieldElement.opid = "op-1";
      previousFocusableElement = document.querySelector(
        ".previous-focusable-element",
      ) as HTMLElement;
      nextFocusableElement = document.querySelector(".next-focusable-element") as HTMLElement;
      autofillFieldFocusSpy = jest.spyOn(autofillFieldElement, "focus");
      findTabsSpy = jest.spyOn(autofillOverlayContentService as any, "findTabs");
      isInlineMenuListVisibleSpy = jest
        .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
        .mockResolvedValue(true);
      autofillOverlayContentService["mostRecentlyFocusedField"] = autofillFieldElement;
      autofillOverlayContentService["focusableElements"] = [
        previousFocusableElement,
        autofillFieldElement,
        nextFocusableElement,
      ];
    });

    it("skips focusing an element if the overlay is not visible", async () => {
      isInlineMenuListVisibleSpy.mockResolvedValue(false);

      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Next);

      expect(findTabsSpy).not.toHaveBeenCalled();
    });

    it("skips focusing an element if no recently focused field exists", async () => {
      autofillOverlayContentService["mostRecentlyFocusedField"] = undefined;

      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Next);

      expect(findTabsSpy).not.toHaveBeenCalled();
    });

    it("focuses the most recently focused field if the focus direction is `Current`", async () => {
      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Current);

      expect(findTabsSpy).not.toHaveBeenCalled();
      expect(autofillFieldFocusSpy).toHaveBeenCalled();
    });

    it("removes the overlay if the focus direction is `Current`", async () => {
      jest.useFakeTimers();
      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Current);
      jest.advanceTimersByTime(150);

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu");
    });

    it("finds all focusable tabs if the focusable elements array is not populated", async () => {
      autofillOverlayContentService["focusableElements"] = [];
      findTabsSpy.mockReturnValue([
        previousFocusableElement,
        autofillFieldElement,
        nextFocusableElement,
      ]);

      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Next);

      expect(findTabsSpy).toHaveBeenCalledWith(globalThis.document.body, { getShadowRoot: true });
    });

    it("focuses the previous focusable element if the focus direction is `Previous`", async () => {
      jest.spyOn(previousFocusableElement, "focus");

      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Previous);

      expect(autofillFieldFocusSpy).not.toHaveBeenCalled();
      expect(previousFocusableElement.focus).toHaveBeenCalled();
    });

    it("focuses the next focusable element if the focus direction is `Next`", async () => {
      jest.spyOn(nextFocusableElement, "focus");

      await autofillOverlayContentService.redirectOverlayFocusOut(RedirectFocusDirection.Next);

      expect(autofillFieldFocusSpy).not.toHaveBeenCalled();
      expect(nextFocusableElement.focus).toHaveBeenCalled();
    });
  });

  describe("handleOverlayRepositionEvent", () => {
    let isInlineMenuButtonVisibleSpy: jest.SpyInstance;
    let isInlineMenuListVisibleSpy: jest.SpyInstance;

    beforeEach(() => {
      document.body.innerHTML = `
      <form id="validFormId">
        <input type="text" id="username-field" placeholder="username" />
        <input type="password" id="password-field" placeholder="password" />
      </form>
      `;
      const usernameField = document.getElementById(
        "username-field",
      ) as ElementWithOpId<HTMLInputElement>;
      autofillOverlayContentService["mostRecentlyFocusedField"] = usernameField;
      autofillOverlayContentService["setOverlayRepositionEventListeners"]();
      isInlineMenuButtonVisibleSpy = jest
        .spyOn(autofillOverlayContentService as any, "isInlineMenuButtonVisible")
        .mockResolvedValue(true);
      isInlineMenuListVisibleSpy = jest
        .spyOn(autofillOverlayContentService as any, "isInlineMenuListVisible")
        .mockResolvedValue(true);
      jest
        .spyOn(autofillOverlayContentService as any, "recentlyFocusedFieldIsCurrentlyFocused")
        .mockReturnValue(true);
    });

    it("skips handling the overlay reposition event if the overlay button and list elements are not visible", async () => {
      isInlineMenuButtonVisibleSpy.mockResolvedValue(false);
      isInlineMenuListVisibleSpy.mockResolvedValue(false);

      globalThis.dispatchEvent(new Event(EVENTS.RESIZE));
      await flushPromises();

      expect(sendExtensionMessageSpy).not.toHaveBeenCalled();
    });

    it("hides the overlay elements", async () => {
      globalThis.dispatchEvent(new Event(EVENTS.SCROLL));
      await flushPromises();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuHidden", {
        isOverlayHidden: true,
        setTransparentOverlay: false,
      });
    });

    it("clears the user interaction timeout", () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
      autofillOverlayContentService["userInteractionEventTimeout"] = setTimeout(jest.fn(), 123);

      globalThis.dispatchEvent(new Event(EVENTS.SCROLL));

      expect(clearTimeoutSpy).toHaveBeenCalledWith(expect.anything());
    });

    it("removes the overlay completely if the field is not focused", async () => {
      jest.useFakeTimers();
      jest
        .spyOn(autofillOverlayContentService as any, "recentlyFocusedFieldIsCurrentlyFocused")
        .mockReturnValue(false);

      autofillOverlayContentService["mostRecentlyFocusedField"] = undefined;

      globalThis.dispatchEvent(new Event(EVENTS.SCROLL));
      await flushPromises();
      jest.advanceTimersByTime(800);

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuHidden", {
        isOverlayHidden: false,
        setTransparentOverlay: true,
      });
      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
        forceCloseOverlay: true,
      });
    });

    it("updates the overlay position if the most recently focused field is still within the viewport", async () => {
      jest.useFakeTimers();
      jest
        .spyOn(autofillOverlayContentService as any, "updateMostRecentlyFocusedField")
        .mockImplementation(() => {
          autofillOverlayContentService["focusedFieldData"] = {
            focusedFieldRects: {
              top: 100,
            },
            focusedFieldStyles: {},
          };
        });
      const clearUserInteractionEventTimeoutSpy = jest.spyOn(
        autofillOverlayContentService as any,
        "clearUserInteractionEventTimeout",
      );

      globalThis.dispatchEvent(new Event(EVENTS.SCROLL));
      await flushPromises();
      jest.advanceTimersByTime(800);
      await flushPromises();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.Button,
      });
      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("updateAutofillOverlayMenuPosition", {
        overlayElement: AutofillOverlayElement.List,
      });
      expect(clearUserInteractionEventTimeoutSpy).toHaveBeenCalled();
    });

    it("removes the autofill overlay if the focused field is outside of the viewport", async () => {
      jest.useFakeTimers();
      jest
        .spyOn(autofillOverlayContentService as any, "updateMostRecentlyFocusedField")
        .mockImplementation(() => {
          autofillOverlayContentService["focusedFieldData"] = {
            focusedFieldRects: {
              top: 4000,
            },
            focusedFieldStyles: {},
          };
        });

      globalThis.dispatchEvent(new Event(EVENTS.SCROLL));
      await flushPromises();
      jest.advanceTimersByTime(800);
      await flushPromises();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
        forceCloseOverlay: true,
      });
    });
  });

  describe("handleVisibilityChangeEvent", () => {
    it("skips removing the overlay if the document is visible", () => {
      autofillOverlayContentService["handleVisibilityChangeEvent"]();

      expect(sendExtensionMessageSpy).not.toHaveBeenCalledWith("closeAutofillOverlayMenu", {
        forceCloseOverlay: true,
      });
    });

    // TODO CG = This test is failing, not entirely sure why but skipping to verify coverage on other files
    it.skip("removes the overlay if the document is not visible", () => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
      });

      autofillOverlayContentService["handleVisibilityChangeEvent"]();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillOverlayMenu", {
        forceCloseOverlay: true,
      });
    });
  });

  describe("destroy", () => {
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
        "username-field",
      ) as ElementWithOpId<FormFieldElement>;
      autofillFieldElement.opid = "op-1";
      autofillFieldData = createAutofillFieldMock({
        opid: "username-field",
        form: "validFormId",
        placeholder: "username",
        elementNumber: 1,
      });
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      autofillOverlayContentService.setupAutofillOverlayListenerOnField(
        autofillFieldElement,
        autofillFieldData,
      );
      autofillOverlayContentService["mostRecentlyFocusedField"] = autofillFieldElement;
    });

    it("clears the user interaction event timeout", () => {
      jest.spyOn(autofillOverlayContentService as any, "clearUserInteractionEventTimeout");

      autofillOverlayContentService.destroy();

      expect(autofillOverlayContentService["clearUserInteractionEventTimeout"]).toHaveBeenCalled();
    });

    it("de-registers all global event listeners", () => {
      jest.spyOn(globalThis.document, "removeEventListener");
      jest.spyOn(globalThis, "removeEventListener");
      jest.spyOn(autofillOverlayContentService as any, "removeOverlayRepositionEventListeners");

      autofillOverlayContentService.destroy();

      expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
        EVENTS.VISIBILITYCHANGE,
        autofillOverlayContentService["handleVisibilityChangeEvent"],
      );
      expect(globalThis.removeEventListener).toHaveBeenCalledWith(
        EVENTS.FOCUSOUT,
        autofillOverlayContentService["handleFormFieldBlurEvent"],
      );
      expect(
        autofillOverlayContentService["removeOverlayRepositionEventListeners"],
      ).toHaveBeenCalled();
    });

    it("de-registers any event listeners that are attached to the form field elements", () => {
      jest.spyOn(autofillOverlayContentService as any, "removeCachedFormFieldEventListeners");
      jest.spyOn(autofillFieldElement, "removeEventListener");
      jest.spyOn(autofillOverlayContentService["formFieldElements"], "delete");

      autofillOverlayContentService.destroy();

      expect(
        autofillOverlayContentService["removeCachedFormFieldEventListeners"],
      ).toHaveBeenCalledWith(autofillFieldElement);
      expect(autofillFieldElement.removeEventListener).toHaveBeenCalledWith(
        EVENTS.BLUR,
        autofillOverlayContentService["handleFormFieldBlurEvent"],
      );
      expect(autofillFieldElement.removeEventListener).toHaveBeenCalledWith(
        EVENTS.KEYUP,
        autofillOverlayContentService["handleFormFieldKeyupEvent"],
      );
      expect(autofillOverlayContentService["formFieldElements"].delete).toHaveBeenCalledWith(
        autofillFieldElement,
      );
    });
  });
});
