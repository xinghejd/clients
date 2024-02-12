import { flushPromises, sendExtensionRuntimeMessage } from "../../autofill/jest/testing-utils";
import { BrowserApi } from "../browser/browser-api";
import BrowserClipboardService from "../services/browser-clipboard.service";

describe("OffscreenDocument", () => {
  const browserApiMessageListenerSpy = jest.spyOn(BrowserApi, "messageListener");
  const browserClipboardServiceCopySpy = jest.spyOn(BrowserClipboardService, "copy");
  const browserClipboardServiceReadSpy = jest.spyOn(BrowserClipboardService, "read");

  require("../offscreen-document/offscreen-document");

  describe("init", () => {
    it("sets up a `chrome.runtime.onMessage` listener", () => {
      expect(browserApiMessageListenerSpy).toHaveBeenCalledWith(
        "offscreen-document",
        expect.any(Function),
      );
    });
  });

  describe("extension message handlers", () => {
    describe("handleOffscreenCopyToClipboard", () => {
      it("copies the message text", async () => {
        const text = "test";

        sendExtensionRuntimeMessage({ command: "offscreenCopyToClipboard", text });
        await flushPromises();

        expect(browserClipboardServiceCopySpy).toHaveBeenCalledWith(window, text);
      });
    });

    describe("handleOffscreenReadFromClipboard", () => {
      it("reads the value from the clipboard service", async () => {
        sendExtensionRuntimeMessage({ command: "offscreenReadFromClipboard" });
        await flushPromises();

        expect(browserClipboardServiceReadSpy).toHaveBeenCalledWith(window);
      });
    });
  });
});
