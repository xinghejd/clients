import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";

class BrowserClipboardService {
  private static consoleLogService: ConsoleLogService = new ConsoleLogService(false);

  static async copy(globalContext: Window, text: string) {
    if (!BrowserClipboardService.isClipboardApiSupported(globalContext, "writeText")) {
      this.useLegacyCopyMethod(globalContext, text);
      return;
    }

    try {
      await globalContext.navigator.clipboard.writeText(text);
    } catch (error) {
      BrowserClipboardService.consoleLogService.debug(
        `Error copying to clipboard using the clipboard API, attempting legacy method: ${error}`,
      );

      this.useLegacyCopyMethod(globalContext, text);
    }
  }

  static async read(globalContext: Window): Promise<string> {
    if (!BrowserClipboardService.isClipboardApiSupported(globalContext, "readText")) {
      return this.useLegacyReadMethod(globalContext);
    }

    let readText = "";
    try {
      readText = await globalContext.navigator.clipboard.readText();
    } catch (error) {
      BrowserClipboardService.consoleLogService.debug(
        `Error reading from clipboard using the clipboard API, attempting legacy method: ${error}`,
      );
      readText = this.useLegacyReadMethod(globalContext);
    }

    return readText;
  }

  private static useLegacyCopyMethod(globalContext: Window, text: string) {
    if (!BrowserClipboardService.isLegacyClipboardMethodSupported(globalContext, "copy")) {
      return;
    }

    const textareaElement = globalContext.document.createElement("textarea");
    textareaElement.textContent = !text ? " " : text;
    textareaElement.style.position = "fixed";
    globalContext.document.body.appendChild(textareaElement);
    textareaElement.select();

    try {
      globalContext.document.execCommand("copy");
    } catch (error) {
      BrowserClipboardService.consoleLogService.error(`Error writing to clipboard: ${error}`);
    } finally {
      globalContext.document.body.removeChild(textareaElement);
    }
  }

  private static useLegacyReadMethod(globalContext: Window): string {
    if (!BrowserClipboardService.isLegacyClipboardMethodSupported(globalContext, "paste")) {
      return "";
    }

    const textareaElement = globalContext.document.createElement("textarea");
    textareaElement.style.position = "fixed";
    globalContext.document.body.appendChild(textareaElement);
    textareaElement.focus();

    let readText = "";
    try {
      readText = globalContext.document.execCommand("paste") ? textareaElement.value : "";
    } catch (error) {
      BrowserClipboardService.consoleLogService.error(`Error reading from clipboard: ${error}`);
    } finally {
      globalContext.document.body.removeChild(textareaElement);
    }

    return readText;
  }

  private static isClipboardApiSupported(globalContext: Window, method: "writeText" | "readText") {
    return "clipboard" in globalContext.navigator && method in globalContext.navigator.clipboard;
  }

  private static isLegacyClipboardMethodSupported(globalContext: Window, method: "copy" | "paste") {
    const documentContext = globalContext.document;

    return (
      "queryCommandSupported" in documentContext && documentContext.queryCommandSupported(method)
    );
  }
}

export default BrowserClipboardService;
