import { BrowserApi } from "../platform/browser/browser-api";

export class SafariApp {
  static sendMessageToApp(command: string, data: any = null, resolveNow = false): Promise<any> {
    if (!BrowserApi.isSafariApi) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const now = new Date();
      const messageId =
        now.getTime().toString() + "_" + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      (browser as any).runtime.sendNativeMessage(
        "com.example.apple-samplecode.ShinyLTZ2PFU5D6",
        {
          id: messageId,
          command: command,
          data: data,
          responseData: null,
        },
        (response: any) => {
          resolve(response);
        },
      );
    });
  }
}
