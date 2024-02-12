import BrowserClipboardService from "./browser-clipboard.service";

describe("BrowserClipboardService", () => {
  const document = window.document;
  const navigator = window.navigator;

  beforeEach(() => {});

  afterEach(() => {
    Object.defineProperty(window, "navigator", { value: navigator });
    Object.defineProperty(window, "document", { value: document });
  });

  describe("copy", () => {
    it("uses the legacy copy method if the clipboard api is not available", async () => {
      Object.defineProperty(window, "navigator", {
        value: { clipboard: {} },
        writable: true,
      });
      Object.defineProperty(window.document, "execCommand", {
        value: jest.fn(),
        writable: true,
      });
      Object.defineProperty(window.document, "queryCommandSupported", {
        value: jest.fn().mockReturnValue(true),
        writable: true,
      });
      const text = "test";

      await BrowserClipboardService.copy(window, text);

      expect(window.document.execCommand).toHaveBeenCalledWith("copy");
    });

    it("copies the given text to the clipboard", async () => {
      Object.defineProperty(window, "navigator", {
        value: { clipboard: { writeText: jest.fn() } },
        writable: true,
      });
      const text = "test";

      await BrowserClipboardService.copy(window, text);

      expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });
  });

  describe("read", () => {
    it("reads the text from the clipboard", async () => {
      const text = "test";
      Object.defineProperty(window, "navigator", {
        value: { clipboard: { readText: jest.fn().mockResolvedValue(text) } },
        writable: true,
      });

      const result = await BrowserClipboardService.read(window);

      expect(window.navigator.clipboard.readText).toHaveBeenCalled();
      expect(result).toBe(text);
    });
  });
});
