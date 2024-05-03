import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { createInitAutofillOverlayButtonMessageMock } from "../../../spec/autofill-mocks";
import { flushPromises, postWindowMessage } from "../../../spec/testing-utils";

import AutofillOverlayButton from "./autofill-overlay-button";

describe("AutofillOverlayButton", () => {
  globalThis.customElements.define("autofill-overlay-button", AutofillOverlayButton);

  let autofillOverlayButton: AutofillOverlayButton;
  const portKey: string = "overlayButtonPortKey";

  beforeEach(() => {
    document.body.innerHTML = `<autofill-overlay-button></autofill-overlay-button>`;
    autofillOverlayButton = document.querySelector("autofill-overlay-button");
    autofillOverlayButton["messageOrigin"] = "https://localhost/";
    jest.spyOn(globalThis.document, "createElement");
    jest.spyOn(globalThis.parent, "postMessage");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initAutofillInlineMenuButton", () => {
    it("creates the button element with the locked icon when the user's auth status is not Unlocked", async () => {
      postWindowMessage(
        createInitAutofillOverlayButtonMessageMock({
          authStatus: AuthenticationStatus.Locked,
          portKey,
        }),
      );
      await flushPromises();

      expect(autofillOverlayButton["buttonElement"]).toMatchSnapshot();
      expect(autofillOverlayButton["buttonElement"].querySelector("svg")).toBe(
        autofillOverlayButton["logoLockedIconElement"],
      );
    });

    it("creates the button element with the normal icon when the user's auth status is Unlocked ", async () => {
      postWindowMessage(createInitAutofillOverlayButtonMessageMock({ portKey }));
      await flushPromises();

      expect(autofillOverlayButton["buttonElement"]).toMatchSnapshot();
      expect(autofillOverlayButton["buttonElement"].querySelector("svg")).toBe(
        autofillOverlayButton["logoIconElement"],
      );
    });

    it("posts a message to the background indicating that the icon was clicked", async () => {
      postWindowMessage(createInitAutofillOverlayButtonMessageMock({ portKey }));
      await flushPromises();

      autofillOverlayButton["buttonElement"].click();

      expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
        { command: "autofillInlineMenuButtonClicked", portKey },
        "*",
      );
    });
  });

  describe("global event listeners", () => {
    beforeEach(() => {
      postWindowMessage(createInitAutofillOverlayButtonMessageMock({ portKey }));
    });

    it("does not post a message to close the autofill overlay if the element is focused during the focus check", async () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(true);

      postWindowMessage({ command: "checkAutofillInlineMenuButtonFocused" });
      await flushPromises();

      expect(globalThis.parent.postMessage).not.toHaveBeenCalledWith({
        command: "closeAutofillInlineMenu",
      });
    });

    it("posts a message to close the autofill overlay if the element is not focused during the focus check", async () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(false);

      postWindowMessage({ command: "checkAutofillInlineMenuButtonFocused" });
      await flushPromises();

      expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
        { command: "closeAutofillInlineMenu", portKey },
        "*",
      );
    });

    it("updates the user's auth status", async () => {
      autofillOverlayButton["authStatus"] = AuthenticationStatus.Locked;

      postWindowMessage({
        command: "updateAutofillOverlayButtonAuthStatus",
        authStatus: AuthenticationStatus.Unlocked,
      });
      await flushPromises();

      expect(autofillOverlayButton["authStatus"]).toBe(AuthenticationStatus.Unlocked);
    });

    it("updates the page color scheme meta tag", async () => {
      const colorSchemeMetaTag = globalThis.document.createElement("meta");
      colorSchemeMetaTag.setAttribute("name", "color-scheme");
      colorSchemeMetaTag.setAttribute("content", "light");
      globalThis.document.head.append(colorSchemeMetaTag);

      postWindowMessage({
        command: "updateAutofillInlineMenuColorScheme",
        colorScheme: "dark",
      });
      await flushPromises();

      expect(colorSchemeMetaTag.getAttribute("content")).toBe("dark");
    });
  });
});
