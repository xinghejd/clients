import AutofillInit from "../../../content/autofill-init";
import { AutofillOverlayElement } from "../../../enums/autofill-overlay.enum";
import { sendMockExtensionMessage } from "../../../spec/testing-utils";

import { AutofillInlineMenuContentService } from "./autofill-inline-menu-content.service";

describe("AutofillInlineMenuContentService", () => {
  let autofillInlineMenuContentService: AutofillInlineMenuContentService;
  let autofillInit: AutofillInit;
  let sendExtensionMessageSpy: jest.SpyInstance;
  let observeBodyMutationsSpy: jest.SpyInstance;

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
    describe("closeAutofillInlineMenu", () => {
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

    describe("appendAutofillInlineMenuToDom", () => {
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

    describe("toggleAutofillInlineMenuHidden", () => {
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
  });
});
