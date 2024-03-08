import { BrowserApi } from "../../platform/browser/browser-api";

import { ClearClipboard } from "./clear-clipboard";

describe("clearClipboard", () => {
  describe("run", () => {
    it("Does not clear clipboard when no active tabs are retrieved", async () => {
      jest.spyOn(BrowserApi, "getActiveTabs").mockResolvedValue([] as any);

      jest.spyOn(BrowserApi, "sendTabMessage").mockReturnValue(undefined);

      await ClearClipboard.run();

      expect(jest.spyOn(BrowserApi, "sendTabMessage")).not.toHaveBeenCalled();

      expect(jest.spyOn(BrowserApi, "sendTabMessage")).not.toHaveBeenCalledWith(
        1,
        "clearClipboard",
      );
    });

    it("Sends a message to the content script to clear the clipboard", async () => {
      jest.spyOn(BrowserApi, "getActiveTabs").mockResolvedValue([
        {
          id: 1,
        },
      ] as any);

      jest.spyOn(BrowserApi, "sendTabMessage").mockReturnValue(undefined);

      await ClearClipboard.run();

      expect(jest.spyOn(BrowserApi, "sendTabMessage")).toHaveBeenCalledTimes(1);

      expect(jest.spyOn(BrowserApi, "sendTabMessage")).toHaveBeenCalledWith(1, "clearClipboard");
    });
  });
});
