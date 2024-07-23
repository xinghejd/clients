import { mock } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { CipherType } from "@bitwarden/common/vault/enums";

import { InlineMenuCipherData } from "../../../../background/abstractions/overlay.background";
import {
  createAutofillOverlayCipherDataMock,
  createInitAutofillInlineMenuListMessageMock,
} from "../../../../spec/autofill-mocks";
import { flushPromises, postWindowMessage } from "../../../../spec/testing-utils";

import { AutofillInlineMenuList } from "./autofill-inline-menu-list";

describe("AutofillInlineMenuList", () => {
  globalThis.customElements.define("autofill-inline-menu-list", AutofillInlineMenuList);
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  let autofillInlineMenuList: AutofillInlineMenuList;
  const portKey: string = "inlineMenuListPortKey";

  beforeEach(() => {
    document.body.innerHTML = `<autofill-inline-menu-list></autofill-inline-menu-list>`;
    autofillInlineMenuList = document.querySelector("autofill-inline-menu-list");
    jest.spyOn(globalThis.document, "createElement");
    jest.spyOn(globalThis.parent, "postMessage");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initAutofillInlineMenuList", () => {
    describe("the locked inline menu for an unauthenticated user", () => {
      beforeEach(() => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
            portKey,
          }),
        );
      });

      it("creates the views for the locked inline menu", () => {
        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("allows the user to unlock the vault", () => {
        const unlockButton =
          autofillInlineMenuList["inlineMenuListContainer"].querySelector("#unlock-button");

        unlockButton.dispatchEvent(new Event("click"));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "unlockVault", portKey },
          "*",
        );
      });
    });

    describe("the inline menu with an empty list of ciphers", () => {
      beforeEach(() => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Unlocked,
            ciphers: [],
            portKey,
          }),
        );
      });

      it("creates the views for the no results inline menu that should be filled by a login cipher", () => {
        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("creates the views for the no results inline menu that should be filled by a card cipher", () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Unlocked,
            ciphers: [],
            filledByCipherType: CipherType.Card,
            portKey,
          }),
        );

        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("creates the views for the no results inline menu that should be filled by an identity cipher", () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Unlocked,
            ciphers: [],
            filledByCipherType: CipherType.Identity,
            portKey,
          }),
        );

        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("creates the views for the no results inline menu that does not have a fill by cipher type", () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Unlocked,
            ciphers: [],
            filledByCipherType: undefined,
            portKey,
          }),
        );

        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("allows the user to add a vault item", () => {
        const addVaultItemButton =
          autofillInlineMenuList["inlineMenuListContainer"].querySelector("#new-item-button");

        addVaultItemButton.dispatchEvent(new Event("click"));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "addNewVaultItem", portKey, addNewCipherType: CipherType.Login },
          "*",
        );
      });
    });

    describe("the list of ciphers for an authenticated user", () => {
      beforeEach(() => {
        postWindowMessage(createInitAutofillInlineMenuListMessageMock());
      });

      it("creates the view for a list of login ciphers", () => {
        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("creates the views for a list of card ciphers", () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            filledByCipherType: CipherType.Card,
            ciphers: [
              createAutofillOverlayCipherDataMock(1, {
                type: CipherType.Card,
                card: "Visa, *4234",
                login: null,
                icon: {
                  imageEnabled: true,
                  icon: "bw-id-card card-visa",
                },
              }),
              createAutofillOverlayCipherDataMock(1, {
                type: CipherType.Card,
                card: "*2234",
                login: null,
                icon: {
                  imageEnabled: true,
                  icon: "bw-id-card card-visa",
                },
              }),
            ],
          }),
        );

        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("creates the views for a list of identity ciphers", () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            filledByCipherType: CipherType.Card,
            ciphers: [
              createAutofillOverlayCipherDataMock(1, {
                type: CipherType.Identity,
                identity: { fullName: "firstName lastName" },
                login: null,
                icon: {
                  imageEnabled: true,
                  icon: "bwi-id-card",
                },
              }),
            ],
          }),
        );

        expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
      });

      it("loads ciphers on scroll one page at a time", () => {
        jest.useFakeTimers();
        autofillInlineMenuList["ciphersList"].scrollTop = 10;
        const originalListOfElements =
          autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(".cipher-container");

        autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));
        jest.runAllTimers();

        const updatedListOfElements =
          autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(".cipher-container");

        expect(originalListOfElements.length).toBe(6);
        expect(updatedListOfElements.length).toBe(8);
      });

      it("debounces the ciphers scroll handler", () => {
        jest.useFakeTimers();
        autofillInlineMenuList["ciphersList"].scrollTop = 10;
        autofillInlineMenuList["cipherListScrollDebounceTimeout"] = setTimeout(jest.fn, 0);
        const handleDebouncedScrollEventSpy = jest.spyOn(
          autofillInlineMenuList as any,
          "handleDebouncedScrollEvent",
        );

        autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));
        jest.advanceTimersByTime(100);
        autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));
        jest.advanceTimersByTime(100);
        autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));
        jest.advanceTimersByTime(400);

        expect(handleDebouncedScrollEventSpy).toHaveBeenCalledTimes(1);
      });

      describe("fill cipher button event listeners", () => {
        beforeEach(() => {
          postWindowMessage(createInitAutofillInlineMenuListMessageMock({ portKey }));
        });

        it("allows the user to fill a cipher on click", () => {
          const fillCipherButton =
            autofillInlineMenuList["inlineMenuListContainer"].querySelector(".fill-cipher-button");

          fillCipherButton.dispatchEvent(new Event("click"));

          expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
            {
              command: "fillAutofillInlineMenuCipher",
              inlineMenuCipherId: "1",
              usePasskey: false,
              portKey,
            },
            "*",
          );
        });

        it("allows the user to move keyboard focus to the next cipher element on ArrowDown", () => {
          const fillCipherElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(
              ".fill-cipher-button",
            );
          const firstFillCipherElement = fillCipherElements[0];
          const secondFillCipherElement = fillCipherElements[1];
          jest.spyOn(secondFillCipherElement as HTMLElement, "focus");

          firstFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((secondFillCipherElement as HTMLElement).focus).toBeCalled();
        });

        it("directs focus to the first item in the cipher list if no cipher is present after the current one when pressing ArrowDown and no new item button exists", () => {
          const fillCipherElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(
              ".fill-cipher-button",
            );
          const lastFillCipherElement = fillCipherElements[fillCipherElements.length - 1];
          const firstFillCipherElement = fillCipherElements[0];
          jest.spyOn(firstFillCipherElement as HTMLElement, "focus");

          lastFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((firstFillCipherElement as HTMLElement).focus).toBeCalled();
        });

        it("directs focus to the new item button if no cipher is present after the current one when pressing ArrowDown", async () => {
          postWindowMessage(
            createInitAutofillInlineMenuListMessageMock({
              portKey,
              showInlineMenuAccountCreation: true,
            }),
          );
          await flushPromises();
          const fillCipherElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(
              ".fill-cipher-button",
            );
          const lastFillCipherElement = fillCipherElements[fillCipherElements.length - 1];
          jest.spyOn(autofillInlineMenuList["newItemButtonElement"], "focus");

          lastFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect(autofillInlineMenuList["newItemButtonElement"].focus).toBeCalled();
        });

        it("allows the user to move keyboard focus to the previous cipher element on ArrowUp", () => {
          const fillCipherElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(
              ".fill-cipher-button",
            );
          const firstFillCipherElement = fillCipherElements[0];
          const secondFillCipherElement = fillCipherElements[1];
          jest.spyOn(firstFillCipherElement as HTMLElement, "focus");

          secondFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect((firstFillCipherElement as HTMLElement).focus).toBeCalled();
        });

        it("directs focus to the last item in the cipher list if no cipher is present before the current one when pressing ArrowUp", () => {
          const fillCipherElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(
              ".fill-cipher-button",
            );
          const firstFillCipherElement = fillCipherElements[0];
          const lastFillCipherElement = fillCipherElements[fillCipherElements.length - 1];
          jest.spyOn(lastFillCipherElement as HTMLElement, "focus");

          firstFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect((lastFillCipherElement as HTMLElement).focus).toBeCalled();
        });

        it("directs focus to the new item button if no cipher is present before the current one when pressing ArrowUp", async () => {
          postWindowMessage(
            createInitAutofillInlineMenuListMessageMock({
              portKey,
              showInlineMenuAccountCreation: true,
            }),
          );
          await flushPromises();
          const fillCipherElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(
              ".fill-cipher-button",
            );
          const firstFillCipherElement = fillCipherElements[0];
          jest.spyOn(autofillInlineMenuList["newItemButtonElement"], "focus");

          firstFillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect(autofillInlineMenuList["newItemButtonElement"].focus).toBeCalled();
        });

        it("allows the user to move keyboard focus to the view cipher button on ArrowRight", () => {
          const cipherContainerElement =
            autofillInlineMenuList["inlineMenuListContainer"].querySelector(".cipher-container");
          const fillCipherElement = cipherContainerElement.querySelector(".fill-cipher-button");
          const viewCipherButton = cipherContainerElement.querySelector(".view-cipher-button");
          jest.spyOn(viewCipherButton as HTMLElement, "focus");

          fillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));

          expect((viewCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("ignores keyup events that do not include ArrowUp, ArrowDown, or ArrowRight", () => {
          const fillCipherElement =
            autofillInlineMenuList["inlineMenuListContainer"].querySelector(".fill-cipher-button");
          jest.spyOn(fillCipherElement as HTMLElement, "focus");

          fillCipherElement.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));

          expect((fillCipherElement as HTMLElement).focus).not.toBeCalled();
        });
      });

      describe("view cipher button event listeners", () => {
        beforeEach(() => {
          postWindowMessage(createInitAutofillInlineMenuListMessageMock({ portKey }));
        });

        it("allows the user to view a cipher on click", () => {
          const viewCipherButton =
            autofillInlineMenuList["inlineMenuListContainer"].querySelector(".view-cipher-button");

          viewCipherButton.dispatchEvent(new Event("click"));

          expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
            { command: "viewSelectedCipher", inlineMenuCipherId: "1", portKey },
            "*",
          );
        });

        it("allows the user to move keyboard focus to the current cipher element on ArrowLeft", () => {
          const cipherContainerElement =
            autofillInlineMenuList["inlineMenuListContainer"].querySelector(".cipher-container");
          const fillCipherButton = cipherContainerElement.querySelector(".fill-cipher-button");
          const viewCipherButton = cipherContainerElement.querySelector(".view-cipher-button");
          jest.spyOn(fillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));

          expect((fillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("allows the user to move keyboard to the next cipher element on ArrowDown", () => {
          const cipherContainerElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(".cipher-container");
          const viewCipherButton = cipherContainerElements[0].querySelector(".view-cipher-button");
          const secondFillCipherButton =
            cipherContainerElements[1].querySelector(".fill-cipher-button");
          jest.spyOn(secondFillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((secondFillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("allows the user to move keyboard focus to the previous cipher element on ArrowUp", () => {
          const cipherContainerElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll(".cipher-container");
          const viewCipherButton = cipherContainerElements[1].querySelector(".view-cipher-button");
          const firstFillCipherButton =
            cipherContainerElements[0].querySelector(".fill-cipher-button");
          jest.spyOn(firstFillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect((firstFillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("ignores keyup events that do not include ArrowUp, ArrowDown, or ArrowRight", () => {
          const viewCipherButton =
            autofillInlineMenuList["inlineMenuListContainer"].querySelector(".view-cipher-button");
          jest.spyOn(viewCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));

          expect((viewCipherButton as HTMLElement).focus).not.toBeCalled();
        });
      });

      describe("account creation elements", () => {
        let newVaultItemButtonSpy: HTMLButtonElement;

        beforeEach(async () => {
          postWindowMessage(
            createInitAutofillInlineMenuListMessageMock({
              filledByCipherType: CipherType.Login,
              showInlineMenuAccountCreation: true,
              portKey,
              ciphers: [
                createAutofillOverlayCipherDataMock(1, {
                  type: CipherType.Identity,
                  identity: { username: "username", fullName: "firstName lastName" },
                  login: null,
                  icon: {
                    imageEnabled: true,
                    icon: "bwi-id-card",
                  },
                }),
              ],
            }),
          );
          await flushPromises();
          newVaultItemButtonSpy = autofillInlineMenuList["newItemButtonElement"];
        });

        it("creates the inline menu account creation view", async () => {
          expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
          expect(newVaultItemButtonSpy).not.toBeUndefined();
        });

        it("allows for the creation of a new login cipher", () => {
          newVaultItemButtonSpy.dispatchEvent(new Event("click"));

          expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
            { command: "addNewVaultItem", portKey, addNewCipherType: CipherType.Login },
            "*",
          );
        });

        describe("keydown events on the add new vault item button", () => {
          it("ignores keydown events that are not ArrowDown or ArrowUp", () => {
            const fillCipherButton =
              autofillInlineMenuList["inlineMenuListContainer"].querySelector(
                ".fill-cipher-button",
              );
            jest.spyOn(fillCipherButton as HTMLElement, "focus");

            newVaultItemButtonSpy.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));

            expect((fillCipherButton as HTMLElement).focus).not.toHaveBeenCalled();
          });

          it("focuses the first element of the cipher list when ArrowDown is pressed on the newItem button", () => {
            const fillCipherButton =
              autofillInlineMenuList["inlineMenuListContainer"].querySelector(
                ".fill-cipher-button",
              );
            jest.spyOn(fillCipherButton as HTMLElement, "focus");

            newVaultItemButtonSpy.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

            expect((fillCipherButton as HTMLElement).focus).toHaveBeenCalled();
          });

          it("focuses the last element of the cipher list when ArrowUp is pressed on the newItem button", () => {
            const fillCipherButton =
              autofillInlineMenuList["inlineMenuListContainer"].querySelector(
                ".fill-cipher-button",
              );
            jest.spyOn(fillCipherButton as HTMLElement, "focus");

            newVaultItemButtonSpy.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

            expect((fillCipherButton as HTMLElement).focus).toHaveBeenCalled();
          });
        });
      });

      describe("creating a list of passkeys", () => {
        let passkeyCipher1: InlineMenuCipherData;
        let passkeyCipher2: InlineMenuCipherData;
        let passkeyCipher3: InlineMenuCipherData;
        let loginCipher1: InlineMenuCipherData;
        let loginCipher2: InlineMenuCipherData;
        let loginCipher3: InlineMenuCipherData;
        const borderClass = "inline-menu-list-heading--bordered";

        beforeEach(() => {
          passkeyCipher1 = createAutofillOverlayCipherDataMock(1, {
            name: "https://example.com",
            login: {
              username: "username1",
              passkey: {
                rpName: "https://example.com",
                userName: "username1",
              },
            },
          });
          passkeyCipher2 = createAutofillOverlayCipherDataMock(2, {
            name: "https://example.com",
            login: {
              username: "",
              passkey: {
                rpName: "https://example.com",
                userName: "username2",
              },
            },
          });
          passkeyCipher3 = createAutofillOverlayCipherDataMock(3, {
            login: {
              username: "username3",
              passkey: {
                rpName: "https://example.com",
                userName: "username3",
              },
            },
          });
          loginCipher1 = createAutofillOverlayCipherDataMock(1, {
            login: {
              username: "username1",
              passkey: null,
            },
          });
          loginCipher2 = createAutofillOverlayCipherDataMock(2, {
            login: {
              username: "username2",
              passkey: null,
            },
          });
          loginCipher3 = createAutofillOverlayCipherDataMock(3, {
            login: {
              username: "username3",
              passkey: null,
            },
          });
          postWindowMessage(
            createInitAutofillInlineMenuListMessageMock({
              ciphers: [
                passkeyCipher1,
                passkeyCipher2,
                passkeyCipher3,
                loginCipher1,
                loginCipher2,
                loginCipher3,
              ],
              showPasskeysLabels: true,
              portKey,
            }),
          );
        });

        it("renders the passkeys list item views", () => {
          expect(autofillInlineMenuList["inlineMenuListContainer"]).toMatchSnapshot();
        });

        describe("passkeys headings on scroll", () => {
          it("adds a border class to the passkeys and login headings when the user scrolls the cipher list container", () => {
            autofillInlineMenuList["ciphersList"].scrollTop = 300;

            autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));

            expect(
              autofillInlineMenuList["passkeysHeadingElement"].classList.contains(borderClass),
            ).toBe(true);
            expect(autofillInlineMenuList["passkeysHeadingElement"].style.position).toBe(
              "relative",
            );
            expect(
              autofillInlineMenuList["loginHeadingElement"].classList.contains(borderClass),
            ).toBe(true);
          });

          it("removes the border class from the passkeys and login headings when the user scrolls the cipher list container to the top", () => {
            jest.useFakeTimers();
            autofillInlineMenuList["ciphersList"].scrollTop = 300;

            autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));
            jest.advanceTimersByTime(75);

            autofillInlineMenuList["ciphersList"].scrollTop = -1;
            autofillInlineMenuList["ciphersList"].dispatchEvent(new Event("scroll"));

            expect(
              autofillInlineMenuList["passkeysHeadingElement"].classList.contains(borderClass),
            ).toBe(false);
            expect(autofillInlineMenuList["passkeysHeadingElement"].style.position).toBe("");
            expect(
              autofillInlineMenuList["loginHeadingElement"].classList.contains(borderClass),
            ).toBe(false);
          });
        });

        it("skips the logins heading when the user presses ArrowDown to focus the next list item", () => {
          const cipherContainerElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll("li");
          const viewCipherButton = cipherContainerElements[3].querySelector(".view-cipher-button");
          const fillCipherButton = cipherContainerElements[5].querySelector(".fill-cipher-button");
          jest.spyOn(fillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((fillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("skips the passkeys heading when the user presses ArrowDown to focus the first list item", () => {
          const cipherContainerElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll("li");
          const viewCipherButton = cipherContainerElements[7].querySelector(".view-cipher-button");
          const fillCipherButton = cipherContainerElements[1].querySelector(".fill-cipher-button");
          jest.spyOn(fillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown" }));

          expect((fillCipherButton as HTMLElement).focus).toBeCalled();
        });

        it("skips the logins heading when the user presses ArrowUp to focus the previous list item", () => {
          const cipherContainerElements =
            autofillInlineMenuList["inlineMenuListContainer"].querySelectorAll("li");
          const viewCipherButton = cipherContainerElements[5].querySelector(".view-cipher-button");
          const fillCipherButton = cipherContainerElements[3].querySelector(".fill-cipher-button");
          jest.spyOn(fillCipherButton as HTMLElement, "focus");

          viewCipherButton.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));

          expect((fillCipherButton as HTMLElement).focus).toBeCalled();
        });
      });
    });
  });

  describe("global event listener handlers", () => {
    beforeEach(() => {
      postWindowMessage(createInitAutofillInlineMenuListMessageMock({ portKey }));
    });

    it("does not post a `checkAutofillInlineMenuButtonFocused` message to the parent if the inline menu is currently focused", () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(true);

      postWindowMessage({ command: "checkAutofillInlineMenuListFocused" });

      expect(globalThis.parent.postMessage).not.toHaveBeenCalled();
    });

    it("does not post a `checkAutofillInlineMenuButtonFocused` message if the inline menu list is currently hovered", () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(false);
      jest
        .spyOn(autofillInlineMenuList["inlineMenuListContainer"], "matches")
        .mockReturnValue(true);

      postWindowMessage({ command: "checkAutofillInlineMenuListFocused" });

      expect(globalThis.parent.postMessage).not.toHaveBeenCalled();
    });

    it("posts a `checkAutofillInlineMenuButtonFocused` message to the parent if the inline menu is not currently focused", () => {
      jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(false);
      jest
        .spyOn(autofillInlineMenuList["inlineMenuListContainer"], "matches")
        .mockReturnValue(false);

      postWindowMessage({ command: "checkAutofillInlineMenuListFocused" });

      expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
        { command: "checkAutofillInlineMenuButtonFocused", portKey },
        "*",
      );
    });

    it("updates the list of ciphers", () => {
      postWindowMessage(createInitAutofillInlineMenuListMessageMock());
      const updateCiphersSpy = jest.spyOn(autofillInlineMenuList as any, "updateListItems");

      postWindowMessage({ command: "updateAutofillInlineMenuListCiphers" });

      expect(updateCiphersSpy).toHaveBeenCalled();
    });

    describe("directing user focus into the inline menu list", () => {
      it("sets ARIA attributes that define the list as a `dialog` to screen reader users", () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
          }),
        );
        const inlineMenuContainerSetAttributeSpy = jest.spyOn(
          autofillInlineMenuList["inlineMenuListContainer"],
          "setAttribute",
        );

        postWindowMessage({ command: "focusAutofillInlineMenuList" });

        expect(inlineMenuContainerSetAttributeSpy).toHaveBeenCalledWith("role", "dialog");
        expect(inlineMenuContainerSetAttributeSpy).toHaveBeenCalledWith("aria-modal", "true");
      });

      it("focuses the unlock button element if the user is not authenticated", async () => {
        postWindowMessage(
          createInitAutofillInlineMenuListMessageMock({
            authStatus: AuthenticationStatus.Locked,
            cipherList: [],
          }),
        );
        await flushPromises();
        const unlockButton =
          autofillInlineMenuList["inlineMenuListContainer"].querySelector("#unlock-button");
        jest.spyOn(unlockButton as HTMLElement, "focus");

        postWindowMessage({ command: "focusAutofillInlineMenuList" });

        expect((unlockButton as HTMLElement).focus).toBeCalled();
      });

      it("focuses the new item button element if the cipher list is empty", async () => {
        postWindowMessage(createInitAutofillInlineMenuListMessageMock({ ciphers: [] }));
        await flushPromises();
        const newItemButton =
          autofillInlineMenuList["inlineMenuListContainer"].querySelector("#new-item-button");
        jest.spyOn(newItemButton as HTMLElement, "focus");

        postWindowMessage({ command: "focusAutofillInlineMenuList" });

        expect((newItemButton as HTMLElement).focus).toBeCalled();
      });

      it("focuses the first cipher button element if the cipher list is populated", () => {
        postWindowMessage(createInitAutofillInlineMenuListMessageMock());
        const firstCipherItem =
          autofillInlineMenuList["inlineMenuListContainer"].querySelector(".fill-cipher-button");
        jest.spyOn(firstCipherItem as HTMLElement, "focus");

        postWindowMessage({ command: "focusAutofillInlineMenuList" });

        expect((firstCipherItem as HTMLElement).focus).toBeCalled();
      });
    });

    describe("blur event", () => {
      it("posts a message to the parent window indicating that the inline menu has lost focus", () => {
        postWindowMessage(createInitAutofillInlineMenuListMessageMock({ portKey }));

        globalThis.dispatchEvent(new Event("blur"));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "autofillInlineMenuBlurred", portKey },
          "*",
        );
      });
    });

    describe("keydown event", () => {
      beforeEach(() => {
        postWindowMessage(createInitAutofillInlineMenuListMessageMock({ portKey }));
      });

      it("skips redirecting keyboard focus when a KeyDown event triggers and the key is not a `Tab` or `Escape` key", () => {
        globalThis.document.dispatchEvent(new KeyboardEvent("keydown", { code: "test" }));

        expect(globalThis.parent.postMessage).not.toHaveBeenCalled();
      });

      it("redirects the inline menu focus out to the previous element on KeyDown of the `Tab+Shift` keys", () => {
        globalThis.document.dispatchEvent(
          new KeyboardEvent("keydown", { code: "Tab", shiftKey: true }),
        );

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "redirectAutofillInlineMenuFocusOut", direction: "previous", portKey },
          "*",
        );
      });

      it("redirects the inline menu focus out to the next element on KeyDown of the `Tab` key", () => {
        globalThis.document.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab" }));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "redirectAutofillInlineMenuFocusOut", direction: "next", portKey },
          "*",
        );
      });

      it("redirects the inline menu focus out to the current element on KeyDown of the `Escape` key", () => {
        globalThis.document.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));

        expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
          { command: "redirectAutofillInlineMenuFocusOut", direction: "current", portKey },
          "*",
        );
      });
    });
  });

  describe("handleResizeObserver", () => {
    beforeEach(() => {
      postWindowMessage(createInitAutofillInlineMenuListMessageMock({ portKey }));
    });

    it("ignores resize entries whose target is not the inline menu list", () => {
      const entries = [
        {
          target: mock<HTMLElement>(),
          contentRect: { height: 300 },
        },
      ];

      autofillInlineMenuList["handleResizeObserver"](entries as unknown as ResizeObserverEntry[]);

      expect(globalThis.parent.postMessage).not.toHaveBeenCalled();
    });

    it("posts a message to update the inline menu list height if the list container is resized", () => {
      const entries = [
        {
          target: autofillInlineMenuList["inlineMenuListContainer"],
          contentRect: { height: 300 },
        },
      ];

      autofillInlineMenuList["handleResizeObserver"](entries as unknown as ResizeObserverEntry[]);

      expect(globalThis.parent.postMessage).toHaveBeenCalledWith(
        { command: "updateAutofillInlineMenuListHeight", styles: { height: "300px" }, portKey },
        "*",
      );
    });
  });
});
