import { mock } from "jest-mock-extended";

import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";
import AutofillOverlayContentService from "../services/autofill-overlay-content.service";
import { flushPromises, sendMockExtensionMessage } from "../spec/testing-utils";

import { AutofillExtensionMessage } from "./abstractions/autofill-init";
import AutofillInit from "./autofill-init";

describe("AutofillInit", () => {
  let autofillInit: AutofillInit;
  const autofillOverlayContentService = mock<AutofillOverlayContentService>();
  const originalDocumentReadyState = document.readyState;
  let sendExtensionMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    chrome.runtime.connect = jest.fn().mockReturnValue({
      onDisconnect: {
        addListener: jest.fn(),
      },
    });
    autofillInit = new AutofillInit(autofillOverlayContentService);
    sendExtensionMessageSpy = jest
      .spyOn(autofillInit as any, "sendExtensionMessage")
      .mockImplementation();
    window.IntersectionObserver = jest.fn(() => mock<IntersectionObserver>());
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    Object.defineProperty(document, "readyState", {
      value: originalDocumentReadyState,
      writable: true,
    });
  });

  describe("init", () => {
    it("sets up the extension message listeners", () => {
      jest.spyOn(autofillInit as any, "setupExtensionMessageListeners");

      autofillInit.init();

      expect(autofillInit["setupExtensionMessageListeners"]).toHaveBeenCalled();
    });

    it("triggers a collection of page details if the document is in a `complete` ready state", () => {
      jest.useFakeTimers();
      Object.defineProperty(document, "readyState", { value: "complete", writable: true });

      autofillInit.init();
      jest.advanceTimersByTime(250);

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("bgCollectPageDetails", {
        sender: "autofillInit",
      });
    });

    it("registers a window load listener to collect the page details if the document is not in a `complete` ready state", () => {
      jest.spyOn(window, "addEventListener");
      Object.defineProperty(document, "readyState", { value: "loading", writable: true });

      autofillInit.init();

      expect(window.addEventListener).toHaveBeenCalledWith("load", expect.any(Function));
    });
  });

  describe("setupExtensionMessageListeners", () => {
    it("sets up a chrome runtime on message listener", () => {
      jest.spyOn(chrome.runtime.onMessage, "addListener");

      autofillInit["setupExtensionMessageListeners"]();

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
        autofillInit["handleExtensionMessage"],
      );
    });
  });

  describe("handleExtensionMessage", () => {
    let message: AutofillExtensionMessage;
    let sender: chrome.runtime.MessageSender;
    const sendResponse = jest.fn();

    beforeEach(() => {
      message = {
        command: "collectPageDetails",
        tab: mock<chrome.tabs.Tab>(),
        sender: "sender",
      };
      sender = mock<chrome.runtime.MessageSender>();
    });

    it("returns a undefined value if a extension message handler is not found with the given message command", () => {
      message.command = "unknownCommand";

      const response = autofillInit["handleExtensionMessage"](message, sender, sendResponse);

      expect(response).toBe(undefined);
    });

    it("returns a undefined value if the message handler does not return a response", async () => {
      const response1 = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);
      await flushPromises();

      expect(response1).not.toBe(false);

      message.command = "removeAutofillOverlay";
      message.fillScript = mock<AutofillScript>();

      const response2 = autofillInit["handleExtensionMessage"](message, sender, sendResponse);
      await flushPromises();

      expect(response2).toBe(undefined);
    });

    it("returns a true value and calls sendResponse if the message handler returns a response", async () => {
      message.command = "collectPageDetailsImmediately";
      const pageDetails: AutofillPageDetails = {
        title: "title",
        url: "http://example.com",
        documentUrl: "documentUrl",
        forms: {},
        fields: [],
        collectedTimestamp: 0,
      };
      jest
        .spyOn(autofillInit["collectAutofillContentService"], "getPageDetails")
        .mockResolvedValue(pageDetails);

      const response = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);
      await Promise.resolve(response);

      expect(response).toBe(true);
      expect(sendResponse).toHaveBeenCalledWith(pageDetails);
    });

    describe("extension message handlers", () => {
      beforeEach(() => {
        autofillInit.init();
      });

      describe("collectPageDetails", () => {
        it("sends the collected page details for autofill using a background script message", async () => {
          const pageDetails: AutofillPageDetails = {
            title: "title",
            url: "http://example.com",
            documentUrl: "documentUrl",
            forms: {},
            fields: [],
            collectedTimestamp: 0,
          };
          const message = {
            command: "collectPageDetails",
            sender: "sender",
            tab: mock<chrome.tabs.Tab>(),
          };
          jest
            .spyOn(autofillInit["collectAutofillContentService"], "getPageDetails")
            .mockResolvedValue(pageDetails);

          sendMockExtensionMessage(message, sender, sendResponse);
          await flushPromises();

          expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            command: "collectPageDetailsResponse",
            tab: message.tab,
            details: pageDetails,
            sender: message.sender,
          });
        });
      });

      describe("collectPageDetailsImmediately", () => {
        it("returns collected page details for autofill if set to send the details in the response", async () => {
          const pageDetails: AutofillPageDetails = {
            title: "title",
            url: "http://example.com",
            documentUrl: "documentUrl",
            forms: {},
            fields: [],
            collectedTimestamp: 0,
          };
          jest
            .spyOn(autofillInit["collectAutofillContentService"], "getPageDetails")
            .mockResolvedValue(pageDetails);

          sendMockExtensionMessage(
            { command: "collectPageDetailsImmediately" },
            sender,
            sendResponse,
          );
          await flushPromises();

          expect(autofillInit["collectAutofillContentService"].getPageDetails).toHaveBeenCalled();
          expect(sendResponse).toBeCalledWith(pageDetails);
          expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
        });
      });

      describe("fillForm", () => {
        let fillScript: AutofillScript;
        beforeEach(() => {
          fillScript = mock<AutofillScript>();
          jest.spyOn(autofillInit["insertAutofillContentService"], "fillForm").mockImplementation();
        });

        it("skips calling the InsertAutofillContentService and does not fill the form if the url to fill is not equal to the current tab url", async () => {
          const fillScript = mock<AutofillScript>();
          const message = {
            command: "fillForm",
            fillScript,
            pageDetailsUrl: "https://a-different-url.com",
          };

          sendMockExtensionMessage(message);
          await flushPromises();

          expect(autofillInit["insertAutofillContentService"].fillForm).not.toHaveBeenCalledWith(
            fillScript,
          );
        });

        it("calls the InsertAutofillContentService to fill the form", async () => {
          sendMockExtensionMessage({
            command: "fillForm",
            fillScript,
            pageDetailsUrl: window.location.href,
          });
          await flushPromises();

          expect(autofillInit["insertAutofillContentService"].fillForm).toHaveBeenCalledWith(
            fillScript,
          );
        });

        it("removes the overlay when filling the form", async () => {
          const blurAndRemoveOverlaySpy = jest.spyOn(autofillInit as any, "blurAndRemoveOverlay");
          sendMockExtensionMessage({
            command: "fillForm",
            fillScript,
            pageDetailsUrl: window.location.href,
          });
          await flushPromises();

          expect(blurAndRemoveOverlaySpy).toHaveBeenCalled();
        });

        it("updates the isCurrentlyFilling property of the overlay to true after filling", async () => {
          jest.useFakeTimers();

          sendMockExtensionMessage({
            command: "fillForm",
            fillScript,
            pageDetailsUrl: window.location.href,
          });
          await flushPromises();
          jest.advanceTimersByTime(300);

          expect(sendExtensionMessageSpy).toHaveBeenNthCalledWith(
            1,
            "updateIsFieldCurrentlyFilling",
            { isFieldCurrentlyFilling: true },
          );
          expect(autofillInit["insertAutofillContentService"].fillForm).toHaveBeenCalledWith(
            fillScript,
          );
          expect(sendExtensionMessageSpy).toHaveBeenNthCalledWith(
            2,
            "updateIsFieldCurrentlyFilling",
            { isFieldCurrentlyFilling: false },
          );
        });
      });
    });
  });

  describe("destroy", () => {
    it("removes the extension message listeners", () => {
      autofillInit.destroy();

      expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(
        autofillInit["handleExtensionMessage"],
      );
    });

    it("destroys the collectAutofillContentService", () => {
      jest.spyOn(autofillInit["collectAutofillContentService"], "destroy");

      autofillInit.destroy();

      expect(autofillInit["collectAutofillContentService"].destroy).toHaveBeenCalled();
    });
  });
});
