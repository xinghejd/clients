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
        autofillOverlayContentService["autofillOverlayVisibility"] = undefined;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("getAutofillOverlayVisibility");
        expect(autofillOverlayContentService["autofillOverlayVisibility"]).toEqual(
          AutofillOverlayVisibility.OnFieldFocus
        );
      });

      it("sets the overlay visibility setting to the value returned from the background script", async () => {
        sendExtensionMessageSpy.mockResolvedValueOnce(AutofillOverlayVisibility.OnFieldFocus);
        autofillOverlayContentService["autofillOverlayVisibility"] = undefined;

        await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
          autofillFieldElement,
          autofillFieldData
        );

        expect(autofillOverlayContentService["autofillOverlayVisibility"]).toEqual(
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

      describe("form field blur event listener", () => {
        beforeEach(async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
        });

        it("updates the isFieldCurrentlyFocused value to false", async () => {
          autofillOverlayContentService["isFieldCurrentlyFocused"] = true;

          autofillFieldElement.dispatchEvent(new Event("blur"));

          expect(autofillOverlayContentService["isFieldCurrentlyFocused"]).toEqual(false);
        });

        it("sends a message to the background to check if the overlay is focused", () => {
          autofillFieldElement.dispatchEvent(new Event("blur"));

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("checkAutofillOverlayFocused");
        });
      });

      describe("form field keyup event listener", () => {
        beforeEach(async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          jest
            .spyOn(autofillOverlayContentService as any, "openAutofillOverlay")
            .mockImplementation();
        });

        it("removes the autofill overlay when the `Escape` key is pressed", () => {
          jest.spyOn(autofillOverlayContentService as any, "removeAutofillOverlay");

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "Escape" }));

          expect(autofillOverlayContentService.removeAutofillOverlay).toHaveBeenCalled();
        });

        it("repositions the overlay if autofill is not currently filling when the `Enter` key is pressed", () => {
          const handleOverlayRepositionEventSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "handleOverlayRepositionEvent"
          );
          autofillOverlayContentService["isCurrentlyFilling"] = false;

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "Enter" }));

          expect(handleOverlayRepositionEventSpy).toHaveBeenCalled();
        });

        it("skips repositioning the overlay if autofill is currently filling when the `Enter` key is pressed", () => {
          const handleOverlayRepositionEventSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "handleOverlayRepositionEvent"
          );
          autofillOverlayContentService["isCurrentlyFilling"] = true;

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "Enter" }));

          expect(handleOverlayRepositionEventSpy).not.toHaveBeenCalled();
        });

        it("opens the overlay list and focuses it after a delay if it is not visible when the `ArrowDown` key is pressed", () => {
          jest.useFakeTimers();
          const openAutofillOverlaySpy = jest.spyOn(
            autofillOverlayContentService as any,
            "openAutofillOverlay"
          );
          autofillOverlayContentService["isOverlayListVisible"] = false;

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect(openAutofillOverlaySpy).toHaveBeenCalled();
          expect(sendExtensionMessageSpy).not.toHaveBeenCalledWith("focusAutofillOverlayList");

          jest.advanceTimersByTime(150);

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("focusAutofillOverlayList");
        });

        it("focuses the overlay list when the `ArrowDown` key is pressed", () => {
          autofillOverlayContentService["isOverlayListVisible"] = true;

          autofillFieldElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect(sendExtensionMessageSpy).toHaveBeenCalledWith("focusAutofillOverlayList");
        });
      });

      describe("form field input change event listener", () => {
        beforeEach(() => {
          jest
            .spyOn(autofillOverlayContentService as any, "openAutofillOverlay")
            .mockImplementation();
        });

        it("ignores span elements that trigger the listener", async () => {
          const spanAutofillFieldElement = document.createElement(
            "span"
          ) as ElementWithOpId<HTMLSpanElement>;
          jest.spyOn(autofillOverlayContentService as any, "storeModifiedFormElement");

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            spanAutofillFieldElement,
            autofillFieldData
          );

          spanAutofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["storeModifiedFormElement"]).not.toHaveBeenCalled();
        });

        it("stores the field as a user filled field if the form field data indicates that it is for a username", async () => {
          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["userFilledFields"].username).toEqual(
            autofillFieldElement
          );
        });

        it("stores the field as a user filled field if the form field is of type password", async () => {
          const passwordFieldElement = document.getElementById(
            "password-field"
          ) as ElementWithOpId<FormFieldElement>;

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            passwordFieldElement,
            autofillFieldData
          );
          passwordFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["userFilledFields"].password).toEqual(
            passwordFieldElement
          );
        });

        it("removes the overlay if the form field element has a value and the user is not authed", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(false);
          const removeAutofillOverlayListSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "removeAutofillOverlayList"
          );
          (autofillFieldElement as HTMLInputElement).value = "test";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(removeAutofillOverlayListSpy).toHaveBeenCalled();
        });

        it("removes the overlay if the form field element has a value and the overlay ciphers are populated", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(true);
          autofillOverlayContentService["isOverlayCiphersPopulated"] = true;
          const removeAutofillOverlayListSpy = jest.spyOn(
            autofillOverlayContentService as any,
            "removeAutofillOverlayList"
          );
          (autofillFieldElement as HTMLInputElement).value = "test";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(removeAutofillOverlayListSpy).toHaveBeenCalled();
        });

        it("opens the autofill overlay if the form field is empty", async () => {
          jest.spyOn(autofillOverlayContentService as any, "openAutofillOverlay");
          (autofillFieldElement as HTMLInputElement).value = "";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["openAutofillOverlay"]).toHaveBeenCalled();
        });

        it("opens the autofill overlay if the form field is empty and the user is authed", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(true);
          jest.spyOn(autofillOverlayContentService as any, "openAutofillOverlay");
          (autofillFieldElement as HTMLInputElement).value = "";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["openAutofillOverlay"]).toHaveBeenCalled();
        });

        it("opens the autofill overlay if the form field is empty and the overlay ciphers are not populated", async () => {
          jest.spyOn(autofillOverlayContentService as any, "isUserAuthed").mockReturnValue(false);
          autofillOverlayContentService["isOverlayCiphersPopulated"] = false;
          jest.spyOn(autofillOverlayContentService as any, "openAutofillOverlay");
          (autofillFieldElement as HTMLInputElement).value = "";

          await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
            autofillFieldElement,
            autofillFieldData
          );
          autofillFieldElement.dispatchEvent(new Event("input"));

          expect(autofillOverlayContentService["openAutofillOverlay"]).toHaveBeenCalled();
        });
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

    it("triggers the form field focused handler if the current active element in the document is the passed form field", async () => {
      const documentRoot = autofillFieldElement.getRootNode() as Document;
      jest.spyOn(documentRoot, "activeElement", "get").mockReturnValue(autofillFieldElement);

      await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
        autofillFieldElement,
        autofillFieldData
      );

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("openAutofillOverlay");
      expect(autofillOverlayContentService["mostRecentlyFocusedField"]).toEqual(
        autofillFieldElement
      );
    });

    it("sets the most recently focused field to the passed form field element if the value is not set", async () => {
      autofillOverlayContentService["mostRecentlyFocusedField"] = undefined;

      await autofillOverlayContentService.setupAutofillOverlayListenerOnField(
        autofillFieldElement,
        autofillFieldData
      );

      expect(autofillOverlayContentService["mostRecentlyFocusedField"]).toEqual(
        autofillFieldElement
      );
    });
  });
});
