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

    try {
      return await globalContext.navigator.clipboard.readText();
    } catch (error) {
      BrowserClipboardService.consoleLogService.debug(
        `Error reading from clipboard using the clipboard API, attempting legacy method: ${error}`,
      );

      return this.useLegacyReadMethod(globalContext);
    }
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
      BrowserClipboardService.consoleLogService.warning(`Error writing to clipboard: ${error}`);
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

    try {
      return globalContext.document.execCommand("paste") ? textareaElement.value : "";
    } catch (error) {
      BrowserClipboardService.consoleLogService.warning(`Error reading from clipboard: ${error}`);
    } finally {
      globalContext.document.body.removeChild(textareaElement);
    }

    return "";
  }

  private static isClipboardApiSupported(globalContext: Window, method: "writeText" | "readText") {
    return "clipboard" in globalContext.navigator && method in globalContext.navigator.clipboard;
  }

  private static isLegacyClipboardMethodSupported(globalContext: Window, method: "copy" | "paste") {
    return (
      "queryCommandSupported" in globalContext.document &&
      globalContext.document.queryCommandSupported(method)
    );
  }
}

export default BrowserClipboardService;
