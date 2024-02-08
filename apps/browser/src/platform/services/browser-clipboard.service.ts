class BrowserClipboardService {
  static readText() {}

  static copyText() {}

  static isClipboardApiSupported() {
    return "clipboard" in navigator;
  }
}

export default BrowserClipboardService;
