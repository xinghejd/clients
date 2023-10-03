import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { createInitAutofillOverlayListMessageMock } from "../../../jest/autofill-mocks";

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
      it("creates the views for the locked overlay", () => {
        autofillOverlayList["initAutofillOverlayList"](
          createInitAutofillOverlayListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
          })
        );

        expect(autofillOverlayList["overlayListContainer"]).toMatchSnapshot();
      });

      it("allows the user to unlock the vault", () => {
        autofillOverlayList["initAutofillOverlayList"](
          createInitAutofillOverlayListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
          })
        );
        const unlockButton =
          autofillOverlayList["overlayListContainer"].querySelector("#unlock-button");

        unlockButton.dispatchEvent(new Event("click"));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "unlockVault" },
          "https://localhost/"
        );
      });
    });

    describe("the overlay with an empty list of ciphers", () => {
      it("creates the views for the no results overlay", () => {
        autofillOverlayList["initAutofillOverlayList"](
          createInitAutofillOverlayListMessageMock({
            authStatus: AuthenticationStatus.Unlocked,
            ciphers: [],
          })
        );

        expect(autofillOverlayList["overlayListContainer"]).toMatchSnapshot();
      });

      it("allows the user to add a vault item", () => {
        autofillOverlayList["initAutofillOverlayList"](
          createInitAutofillOverlayListMessageMock({
            authStatus: AuthenticationStatus.Unlocked,
            ciphers: [],
          })
        );
        const addVaultItemButton =
          autofillOverlayList["overlayListContainer"].querySelector("#new-item-button");

        addVaultItemButton.dispatchEvent(new Event("click"));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "addNewVaultItem" },
          "https://localhost/"
        );
      });
    });

    describe("the list of ciphers for an authenticated user", () => {
      it("creates the view for a list of ciphers", () => {
        autofillOverlayList["initAutofillOverlayList"](createInitAutofillOverlayListMessageMock());

        expect(autofillOverlayList["overlayListContainer"]).toMatchSnapshot();
      });

      it("loads ciphers on scroll one page at a time", () => {
        jest.useFakeTimers();
        autofillOverlayList["initAutofillOverlayList"](createInitAutofillOverlayListMessageMock());
        const originalListOfElements =
          autofillOverlayList["overlayListContainer"].querySelectorAll(".cipher-container");

        autofillOverlayList["handleCiphersListScrollEvent"]();
        jest.runAllTimers();

        const updatedListOfElements =
          autofillOverlayList["overlayListContainer"].querySelectorAll(".cipher-container");

        expect(originalListOfElements.length).toBe(6);
        expect(updatedListOfElements.length).toBe(8);
      });

      it("debounces the ciphers scroll handler", () => {
        jest.useFakeTimers();
        autofillOverlayList["cipherListScrollDebounceTimeout"] = setTimeout(jest.fn, 0);
        const handleDebouncedScrollEventSpy = jest.spyOn(
          autofillOverlayList as any,
          "handleDebouncedScrollEvent"
        );

        autofillOverlayList["initAutofillOverlayList"](createInitAutofillOverlayListMessageMock());

        autofillOverlayList["handleCiphersListScrollEvent"]();
        jest.advanceTimersByTime(100);
        autofillOverlayList["handleCiphersListScrollEvent"]();
        jest.advanceTimersByTime(100);
        autofillOverlayList["handleCiphersListScrollEvent"]();
        jest.advanceTimersByTime(400);

        expect(handleDebouncedScrollEventSpy).toHaveBeenCalledTimes(1);
      });

      describe("fill cipher button event listeners", () => {
        it("allows the user to fill a cipher on click", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const fillCipherButton =
            autofillOverlayList["overlayListContainer"].querySelector(".fill-cipher-button");

          fillCipherButton.dispatchEvent(new Event("click"));

          expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
            { command: "fillSelectedListItem", overlayCipherId: "1" },
            "https://localhost/"
          );
        });

        it("allows the user to move keyboard focus to the next cipher element on ArrowDown", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const fillCipherElements =
            autofillOverlayList["overlayListContainer"].querySelectorAll(".fill-cipher-button");
          const firstFillCipherElement = fillCipherElements[0];
          const secondFillCipherElement = fillCipherElements[1];
          jest.spyOn(secondFillCipherElement as HTMLElement, "focus");

          firstFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((secondFillCipherElement as HTMLElement).focus).toBeCalled();
        });

        it("allows the user to move keyboard focus to the previous cipher element on ArrowUp", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const fillCipherElements =
            autofillOverlayList["overlayListContainer"].querySelectorAll(".fill-cipher-button");
          const firstFillCipherElement = fillCipherElements[0];
          const secondFillCipherElement = fillCipherElements[1];
          jest.spyOn(firstFillCipherElement as HTMLElement, "focus");

          secondFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect((firstFillCipherElement as HTMLElement).focus).toBeCalled();
        });

        it("allows the user to move keyboard focus to the view cipher button on ArrowRight", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const cipherContainerElement =
            autofillOverlayList["overlayListContainer"].querySelector(".cipher-container");
          const fillCipherElement = cipherContainerElement.querySelector(".fill-cipher-button");
          const viewCipherButton = cipherContainerElement.querySelector(".view-cipher-button");
          jest.spyOn(viewCipherButton as HTMLElement, "focus");

          fillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));

          expect((viewCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("ignores keyup events that do not include ArrowUp, ArrowDown, or ArrowRight", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const fillCipherElement =
            autofillOverlayList["overlayListContainer"].querySelector(".fill-cipher-button");
          jest.spyOn(fillCipherElement as HTMLElement, "focus");

          fillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));

          expect((fillCipherElement as HTMLElement).focus).not.toBeCalled();
        });
      });

      describe("view cipher button event listeners", () => {
        it("allows the user to view a cipher on click", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const viewCipherButton =
            autofillOverlayList["overlayListContainer"].querySelector(".view-cipher-button");

          viewCipherButton.dispatchEvent(new Event("click"));

          expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
            { command: "viewSelectedCipher", overlayCipherId: "1" },
            "https://localhost/"
          );
        });

        it("allows the user to move keyboard focus to the current cipher element on ArrowLeft", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const cipherContainerElement =
            autofillOverlayList["overlayListContainer"].querySelector(".cipher-container");
          const fillCipherButton = cipherContainerElement.querySelector(".fill-cipher-button");
          const viewCipherButton = cipherContainerElement.querySelector(".view-cipher-button");
          jest.spyOn(fillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));

          expect((fillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("allows the user to move keyboard to the next cipher element on ArrowDown", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const cipherContainerElements =
            autofillOverlayList["overlayListContainer"].querySelectorAll(".cipher-container");
          const viewCipherButton = cipherContainerElements[0].querySelector(".view-cipher-button");
          const secondFillCipherButton =
            cipherContainerElements[1].querySelector(".fill-cipher-button");
          jest.spyOn(secondFillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((secondFillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("allows the user to move keyboard focus to the previous cipher element on ArrowUp", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const cipherContainerElements =
            autofillOverlayList["overlayListContainer"].querySelectorAll(".cipher-container");
          const viewCipherButton = cipherContainerElements[1].querySelector(".view-cipher-button");
          const firstFillCipherButton =
            cipherContainerElements[0].querySelector(".fill-cipher-button");
          jest.spyOn(firstFillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect((firstFillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("ignores keyup events that do not include ArrowUp, ArrowDown, or ArrowRight", () => {
          autofillOverlayList["initAutofillOverlayList"](
            createInitAutofillOverlayListMessageMock()
          );
          const viewCipherButton =
            autofillOverlayList["overlayListContainer"].querySelector(".view-cipher-button");
          jest.spyOn(viewCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));

          expect((viewCipherButton as HTMLElement).focus).not.toBeCalled();
        });
      });
    });
  });
});
