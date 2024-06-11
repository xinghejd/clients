import { mock } from "jest-mock-extended";

import AutofillInit from "../../../content/autofill-init";
import { AutofillOverlayElement } from "../../../enums/autofill-overlay.enum";
import { createMutationRecordMock } from "../../../spec/autofill-mocks";
import { flushPromises, sendMockExtensionMessage } from "../../../spec/testing-utils";
import { ElementWithOpId } from "../../../types";

import { AutofillInlineMenuContentService } from "./autofill-inline-menu-content.service";

describe("AutofillInlineMenuContentService", () => {
  let autofillInlineMenuContentService: AutofillInlineMenuContentService;
  let autofillInit: AutofillInit;
  let sendExtensionMessageSpy: jest.SpyInstance;
  let observeBodyMutationsSpy: jest.SpyInstance;
  const sendResponseSpy = jest.fn();

  beforeEach(() => {
    globalThis.document.body.innerHTML = "";
    autofillInlineMenuContentService = new AutofillInlineMenuContentService();
    autofillInit = new AutofillInit(null, autofillInlineMenuContentService);
    autofillInit.init();
    observeBodyMutationsSpy = jest.spyOn(
      autofillInlineMenuContentService["bodyElementMutationObserver"] as any,
      "observe",
    );
    sendExtensionMessageSpy = jest.spyOn(
      autofillInlineMenuContentService as any,
      "sendExtensionMessage",
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("isElementInlineMenu", () => {
    it("returns true if the passed element is the inline menu", () => {
      const element = document.createElement("div");
      autofillInlineMenuContentService["listElement"] = element;

      expect(autofillInlineMenuContentService.isElementInlineMenu(element)).toBe(true);
    });
  });

  describe("extension message handlers", () => {
    describe("closeAutofillInlineMenu message handler", () => {
      beforeEach(() => {
        observeBodyMutationsSpy.mockImplementation();
      });

      it("closes the inline menu button", async () => {
        sendMockExtensionMessage({
          command: "appendAutofillInlineMenuToDom",
          overlayElement: AutofillOverlayElement.Button,
        });

        sendMockExtensionMessage({
          command: "closeAutofillInlineMenu",
          overlayElement: AutofillOverlayElement.Button,
        });

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.Button,
        });
      });

      it("closes the inline menu list", async () => {
        sendMockExtensionMessage({
          command: "appendAutofillInlineMenuToDom",
          overlayElement: AutofillOverlayElement.List,
        });

        sendMockExtensionMessage({
          command: "closeAutofillInlineMenu",
          overlayElement: AutofillOverlayElement.List,
        });

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.List,
        });
      });

      it("closes both inline menu elements and removes the body element mutation observer", async () => {
        const removeBodyElementObserverSpy = jest.spyOn(
          autofillInlineMenuContentService as any,
          "removeBodyElementObserver",
        );
        sendMockExtensionMessage({
          command: "appendAutofillInlineMenuToDom",
          overlayElement: AutofillOverlayElement.Button,
        });
        sendMockExtensionMessage({
          command: "appendAutofillInlineMenuToDom",
          overlayElement: AutofillOverlayElement.List,
        });

        sendMockExtensionMessage({
          command: "closeAutofillInlineMenu",
        });

        expect(removeBodyElementObserverSpy).toHaveBeenCalled();
        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.Button,
        });

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.List,
        });
      });
    });

    describe("appendAutofillInlineMenuToDom message handler", () => {
      beforeEach(() => {
        observeBodyMutationsSpy.mockImplementation();
      });

      describe("creating the inline menu button", () => {
        it("creates a `div` button element if the user browser is Firefox", () => {
          autofillInlineMenuContentService["isFirefoxBrowser"] = true;

          sendMockExtensionMessage({
            command: "appendAutofillInlineMenuToDom",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(autofillInlineMenuContentService["buttonElement"]).toBeInstanceOf(HTMLDivElement);
        });
      });

      describe("creating the inline menu list", () => {
        it("creates a `div` list element if the user browser is Firefox", () => {
          autofillInlineMenuContentService["isFirefoxBrowser"] = true;

          sendMockExtensionMessage({
            command: "appendAutofillInlineMenuToDom",
            overlayElement: AutofillOverlayElement.List,
          });

          expect(autofillInlineMenuContentService["listElement"]).toBeInstanceOf(HTMLDivElement);
        });
      });
    });

    describe("toggleAutofillInlineMenuHidden message handler", () => {
      it("sets the inline elements as hidden if the elements do not exist", () => {
        sendMockExtensionMessage({
          command: "toggleAutofillInlineMenuHidden",
          isInlineMenuHidden: false,
        });

        expect(autofillInlineMenuContentService["isButtonVisible"]).toBe(false);
        expect(autofillInlineMenuContentService["isListVisible"]).toBe(false);
      });

      it("sets the inline elements as visible", () => {
        autofillInlineMenuContentService["buttonElement"] = document.createElement("div");
        autofillInlineMenuContentService["listElement"] = document.createElement("div");

        sendMockExtensionMessage({
          command: "toggleAutofillInlineMenuHidden",
          isInlineMenuHidden: false,
        });

        expect(autofillInlineMenuContentService["isButtonVisible"]).toBe(true);
        expect(autofillInlineMenuContentService["isListVisible"]).toBe(true);
      });

      it("sets the inline elements as hidden", () => {
        autofillInlineMenuContentService["buttonElement"] = document.createElement("div");
        autofillInlineMenuContentService["listElement"] = document.createElement("div");
        autofillInlineMenuContentService["isButtonVisible"] = true;
        autofillInlineMenuContentService["isListVisible"] = true;

        sendMockExtensionMessage({
          command: "toggleAutofillInlineMenuHidden",
          isInlineMenuHidden: true,
        });

        expect(autofillInlineMenuContentService["isButtonVisible"]).toBe(false);
        expect(autofillInlineMenuContentService["isListVisible"]).toBe(false);
      });
    });

    describe("checkIsAutofillInlineMenuButtonVisible message handler", () => {
      it("returns true if the inline menu button is visible", async () => {
        autofillInlineMenuContentService["isButtonVisible"] = true;

        sendMockExtensionMessage(
          { command: "checkIsAutofillInlineMenuButtonVisible" },
          mock<chrome.runtime.MessageSender>(),
          sendResponseSpy,
        );
        await flushPromises();

        expect(sendResponseSpy).toHaveBeenCalledWith(true);
      });
    });

    describe("checkIsAutofillInlineMenuListVisible message handler", () => {
      it("returns true if the inline menu list is visible", async () => {
        autofillInlineMenuContentService["isListVisible"] = true;

        sendMockExtensionMessage(
          { command: "checkIsAutofillInlineMenuListVisible" },
          mock<chrome.runtime.MessageSender>(),
          sendResponseSpy,
        );
        await flushPromises();

        expect(sendResponseSpy).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("handleInlineMenuElementMutationObserverUpdate", () => {
    let usernameField: ElementWithOpId<HTMLInputElement>;

    beforeEach(() => {
      document.body.innerHTML = `
    <form id="validFormId">
      <input type="text" id="username-field" placeholder="username" />
      <input type="password" id="password-field" placeholder="password" />
    </form>
    `;
      usernameField = document.getElementById(
        "username-field",
      ) as ElementWithOpId<HTMLInputElement>;
      usernameField.style.setProperty("display", "block", "important");
      jest.spyOn(usernameField, "removeAttribute");
      jest.spyOn(usernameField.style, "setProperty");
      jest
        .spyOn(
          autofillInlineMenuContentService as any,
          "isTriggeringExcessiveMutationObserverIterations",
        )
        .mockReturnValue(false);
    });

    it("skips handling the mutation if excessive mutation observer events are triggered", () => {
      jest
        .spyOn(
          autofillInlineMenuContentService as any,
          "isTriggeringExcessiveMutationObserverIterations",
        )
        .mockReturnValue(true);

      autofillInlineMenuContentService["handleInlineMenuElementMutationObserverUpdate"]([
        createMutationRecordMock({ target: usernameField }),
      ]);

      expect(usernameField.removeAttribute).not.toHaveBeenCalled();
    });

    it("skips handling the mutation if the record type is not for `attributes`", () => {
      autofillInlineMenuContentService["handleInlineMenuElementMutationObserverUpdate"]([
        createMutationRecordMock({ target: usernameField, type: "childList" }),
      ]);

      expect(usernameField.removeAttribute).not.toHaveBeenCalled();
    });

    it("removes all element attributes that are not the style attribute", () => {
      autofillInlineMenuContentService["handleInlineMenuElementMutationObserverUpdate"]([
        createMutationRecordMock({
          target: usernameField,
          type: "attributes",
          attributeName: "placeholder",
        }),
      ]);

      expect(usernameField.removeAttribute).toHaveBeenCalledWith("placeholder");
    });

    it("removes all attached style attributes and sets the default styles", () => {
      autofillInlineMenuContentService["handleInlineMenuElementMutationObserverUpdate"]([
        createMutationRecordMock({
          target: usernameField,
          type: "attributes",
          attributeName: "style",
        }),
      ]);

      expect(usernameField.removeAttribute).toHaveBeenCalledWith("style");
      expect(usernameField.style.setProperty).toHaveBeenCalledWith("all", "initial", "important");
      expect(usernameField.style.setProperty).toHaveBeenCalledWith(
        "position",
        "fixed",
        "important",
      );
      expect(usernameField.style.setProperty).toHaveBeenCalledWith("display", "block", "important");
    });
  });

  describe("handleBodyElementMutationObserverUpdate", () => {
    let buttonElement: HTMLElement;
    let listElement: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = `
      <div class="overlay-button"></div>
      <div class="overlay-list"></div>
      `;
      buttonElement = document.querySelector(".overlay-button") as HTMLElement;
      listElement = document.querySelector(".overlay-list") as HTMLElement;
      autofillInlineMenuContentService["buttonElement"] = buttonElement;
      autofillInlineMenuContentService["listElement"] = listElement;
      autofillInlineMenuContentService["isListVisible"] = true;
      jest.spyOn(globalThis.document.body, "insertBefore");
      jest
        .spyOn(
          autofillInlineMenuContentService as any,
          "isTriggeringExcessiveMutationObserverIterations",
        )
        .mockReturnValue(false);
    });

    it("skips handling the mutation if the overlay elements are not present in the DOM", () => {
      autofillInlineMenuContentService["buttonElement"] = undefined;
      autofillInlineMenuContentService["listElement"] = undefined;

      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).not.toHaveBeenCalled();
    });

    it("skips handling the mutation if excessive mutations are being triggered", () => {
      jest
        .spyOn(
          autofillInlineMenuContentService as any,
          "isTriggeringExcessiveMutationObserverIterations",
        )
        .mockReturnValue(true);

      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).not.toHaveBeenCalled();
    });

    it("skips re-arranging the DOM elements if the last child of the body is the overlay list and the second to last child of the body is the overlay button", () => {
      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).not.toHaveBeenCalled();
    });

    it("skips re-arranging the DOM elements if the last child is the overlay button and the overlay list is not visible", () => {
      listElement.remove();
      autofillInlineMenuContentService["isListVisible"] = false;

      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).not.toHaveBeenCalled();
    });

    it("positions the overlay button before the overlay list if an element has inserted itself after the button element", () => {
      const injectedElement = document.createElement("div");
      document.body.insertBefore(injectedElement, listElement);

      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).toHaveBeenCalledWith(
        buttonElement,
        listElement,
      );
    });

    it("positions the overlay button before the overlay list if the elements have inserted in incorrect order", () => {
      document.body.appendChild(buttonElement);

      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).toHaveBeenCalledWith(
        buttonElement,
        listElement,
      );
    });

    it("positions the last child before the overlay button if it is not the overlay list", () => {
      const injectedElement = document.createElement("div");
      document.body.appendChild(injectedElement);

      autofillInlineMenuContentService["handleBodyElementMutationObserverUpdate"]();

      expect(globalThis.document.body.insertBefore).toHaveBeenCalledWith(
        injectedElement,
        buttonElement,
      );
    });
  });

  describe("isTriggeringExcessiveMutationObserverIterations", () => {
    it("clears any existing reset timeout", () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
      autofillInlineMenuContentService["mutationObserverIterationsResetTimeout"] = setTimeout(
        jest.fn(),
        123,
      );

      autofillInlineMenuContentService["isTriggeringExcessiveMutationObserverIterations"]();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(expect.anything());
    });

    it("will reset the number of mutationObserverIterations after two seconds", () => {
      jest.useFakeTimers();
      autofillInlineMenuContentService["mutationObserverIterations"] = 10;

      autofillInlineMenuContentService["isTriggeringExcessiveMutationObserverIterations"]();
      jest.advanceTimersByTime(2000);

      expect(autofillInlineMenuContentService["mutationObserverIterations"]).toEqual(0);
    });

    it("will blur the overlay field and remove the autofill overlay if excessive mutation observer iterations are triggering", async () => {
      autofillInlineMenuContentService["mutationObserverIterations"] = 101;
      const closeInlineMenuSpy = jest.spyOn(
        autofillInlineMenuContentService as any,
        "closeInlineMenu",
      );

      autofillInlineMenuContentService["isTriggeringExcessiveMutationObserverIterations"]();
      await flushPromises();

      expect(closeInlineMenuSpy).toHaveBeenCalled();
    });
  });
});
