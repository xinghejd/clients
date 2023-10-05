import { mock } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { createInitAutofillOverlayListMessageMock } from "../../../jest/autofill-mocks";
import { postWindowMessage } from "../../../jest/testing-utils";

import AutofillOverlayList from "./autofill-overlay-list";

describe("AutofillOverlayList", () => {
  globalThis.customElements.define("autofill-overlay-list", AutofillOverlayList);
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  let autofillOverlayList: AutofillOverlayList;

  beforeEach(() => {
    document.body.innerHTML = `<autofill-overlay-list></autofill-overlay-list>`;
    autofillOverlayList = document.querySelector("autofill-overlay-list");
    autofillOverlayList["messageOrigin"] = "https://localhost/";
    jest.spyOn(globalThis.document, "createElement");
    jest.spyOn(globalThis.parent, "postMessage");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initAutofillOverlayList", () => {
    describe("the locked overlay for an unauthenticated user", () => {
      beforeEach(() => {
        postWindowMessage(
          createInitAutofillOverlayListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
          })
        );
      });

      it("creates the views for the locked overlay", () => {
        expect(autofillOverlayList["overlayListContainer"]).toMatchSnapshot();
      });

      it("allows the user to unlock the vault", () => {
        const unlockButton =
          autofillOverlayList["overlayListContainer"].querySelector("#unlock-button");

        unlockButton.dispatchEvent(new Event("click"));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "unlockVault" },
          "https://localhost/"
        );
      });
    });
  });

  describe("global event listener handlers", () => {
    it("does not post a `checkAutofillOverlayButtonFocused` message to the parent if the overlay is currently focused", () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(true);

      postWindowMessage({ command: "checkAutofillOverlayListFocused" });

      expect(globalThis.parent.postMessage).not.toHaveBeenCalled();
    });

    it("posts a `checkAutofillOverlayButtonFocused` message to the parent if the overlay is not currently focused", () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(false);

      postWindowMessage({ command: "checkAutofillOverlayListFocused" });

      expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
        { command: "checkAutofillOverlayButtonFocused" },
        "https://localhost/"
      );
    });

    describe("directing user focus into the overlay list", () => {
      it("focuses the unlock button element if the user is not authenticated", () => {
        postWindowMessage(
          createInitAutofillOverlayListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
          })
        );
        const unlockButton =
          autofillOverlayList["overlayListContainer"].querySelector("#unlock-button");
        jest.spyOn(unlockButton as HTMLElement, "focus");

        postWindowMessage({ command: "focusOverlayList" });

        expect((unlockButton as HTMLElement).focus).toBeCalled();
      });
    });
  });

  describe("handleResizeObserver", () => {
    beforeEach(() => {
      postWindowMessage(createInitAutofillOverlayListMessageMock());
    });

    it("ignores resize entries whose target is not the overlay list", () => {
      const entries = [
        {
          target: mock<HTMLElement>(),
          contentRect: { height: 300 },
        },
      ];

      autofillOverlayList["handleResizeObserver"](entries as unknown as ResizeObserverEntry[]);

      expect(globalThis.parent.postMessage).not.toHaveBeenCalled();
    });

    it("posts a message to update the overlay list height if the list container is resized", () => {
      const entries = [
        {
          target: autofillOverlayList["overlayListContainer"],
          contentRect: { height: 300 },
        },
      ];

      autofillOverlayList["handleResizeObserver"](entries as unknown as ResizeObserverEntry[]);

      expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
        { command: "updateAutofillOverlayListHeight", styles: { height: "300px" } },
        "https://localhost/"
      );
    });
  });
});
