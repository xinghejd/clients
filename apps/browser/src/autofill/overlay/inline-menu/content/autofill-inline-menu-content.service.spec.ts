import AutofillInit from "../../../content/autofill-init";
import { AutofillOverlayElement } from "../../../enums/autofill-overlay.enum";
import { flushPromises, sendMockExtensionMessage } from "../../../spec/testing-utils";

import { AutofillInlineMenuContentService } from "./autofill-inline-menu-content.service";

describe("AutofillInlineMenuContentService", () => {
  let autofillInlineMenuContentService: AutofillInlineMenuContentService;
  let autofillInit: AutofillInit;
  let sendExtensionMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.innerHTML = "";
    autofillInlineMenuContentService = new AutofillInlineMenuContentService();
    autofillInit = new AutofillInit(null, autofillInlineMenuContentService);
    autofillInit.init();
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
      it("closes the inline menu button", async () => {
        sendMockExtensionMessage({
          command: "appendAutofillInlineMenuToDom",
          overlayElement: AutofillOverlayElement.Button,
        });

        sendMockExtensionMessage({
          command: "closeAutofillInlineMenu",
          overlayElement: AutofillOverlayElement.Button,
        });
        await flushPromises();

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.Button,
        });
      });

      it("closes the inline menu list", () => {
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
        await flushPromises();

        expect(removeBodyElementObserverSpy).toHaveBeenCalled();
        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.Button,
        });

        expect(sendExtensionMessageSpy).toHaveBeenCalledWith("autofillOverlayElementClosed", {
          overlayElement: AutofillOverlayElement.List,
        });
      });
    });
  });
});
