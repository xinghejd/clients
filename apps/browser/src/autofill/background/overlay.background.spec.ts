import { mock, mockReset } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { ThemeType } from "@bitwarden/common/enums";
import { I18nService } from "@bitwarden/common/platform/services/i18n.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import { createFocusedFieldDataMock, createPortSpyMock } from "../jest/autofill-mocks";
import { flushPromises, sendExtensionRuntimeMessage } from "../jest/testing-utils";
import { PortSpy } from "../jest/typings";
import {
  AutofillOverlayElement,
  AutofillOverlayPort,
  AutofillOverlayVisibility,
  RedirectFocusDirection,
} from "../utils/autofill-overlay.enum";

import OverlayBackground from "./overlay.background";

describe("OverlayBackground", () => {
  let buttonPortSpy: PortSpy;
  let buttonPortOnMessageListener: CallableFunction;
  let listPortSpy: PortSpy;
  let listPortOnMessageListener: CallableFunction;
  let overlayBackground: OverlayBackground;
  const cipherService = mock<CipherService>();
  const authService = mock<AuthService>();
  const settingsService = mock<SettingsService>();
  const stateService = mock<BrowserStateService>();
  const i18nService = mock<I18nService>();
  const initOverlayElementPorts = (options = { initList: true, initButton: true }) => {
    const { initList, initButton } = options;
    if (initButton) {
      overlayBackground["handlePortOnConnect"](
        createPortSpyMock(AutofillOverlayPort.Button, buttonPortOnMessageListener)
      );
      buttonPortSpy = overlayBackground["overlayButtonPort"] as PortSpy;
    }

    if (initList) {
      overlayBackground["handlePortOnConnect"](
        createPortSpyMock(AutofillOverlayPort.List, listPortOnMessageListener)
      );
      listPortSpy = overlayBackground["overlayListPort"] as PortSpy;
    }

    return { buttonPortSpy, listPortSpy };
  };

  beforeEach(async () => {
    overlayBackground = new OverlayBackground(
      authService,
      settingsService,
      stateService,
      i18nService
    );
    await overlayBackground.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockReset(cipherService);
  });

  describe("init", () => {
    it("sets up the extension message listeners, get the overlay's visibility settings, and get the user's auth status", async () => {
      overlayBackground["setupExtensionMessageListeners"] = jest.fn();
      overlayBackground["getOverlayVisibility"] = jest.fn();
      overlayBackground["getAuthStatus"] = jest.fn();

      await overlayBackground.init();

      expect(overlayBackground["setupExtensionMessageListeners"]).toHaveBeenCalled();
      expect(overlayBackground["getOverlayVisibility"]).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
    });
  });

  describe("getAuthStatus", () => {
    it("will update the user's auth status but will not update the overlay ciphers", async () => {
      const authStatus = AuthenticationStatus.Unlocked;
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
      jest.spyOn(overlayBackground["authService"], "getAuthStatus").mockResolvedValue(authStatus);
      jest.spyOn(overlayBackground as any, "updateOverlayButtonAuthStatus").mockImplementation();

      const status = await overlayBackground["getAuthStatus"]();

      expect(overlayBackground["authService"].getAuthStatus).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayButtonAuthStatus"]).not.toHaveBeenCalled();
      expect(overlayBackground["userAuthStatus"]).toBe(authStatus);
      expect(status).toBe(authStatus);
    });
  });

  describe("updateOverlayButtonAuthStatus", () => {
    it("will send a message to the button port with the user's auth status", () => {
      overlayBackground["overlayButtonPort"] = mock<chrome.runtime.Port>();
      jest.spyOn(overlayBackground["overlayButtonPort"], "postMessage");

      overlayBackground["updateOverlayButtonAuthStatus"]();

      expect(overlayBackground["overlayButtonPort"].postMessage).toHaveBeenCalledWith({
        command: "updateOverlayButtonAuthStatus",
        authStatus: overlayBackground["userAuthStatus"],
      });
    });
  });

  describe("getTranslations", () => {
    it("will query the overlay page translations if they have not been queried", () => {
      overlayBackground["overlayPageTranslations"] = undefined;
      jest.spyOn(overlayBackground as any, "getTranslations");
      jest.spyOn(overlayBackground["i18nService"], "translate").mockImplementation((key) => key);
      jest.spyOn(BrowserApi, "getUILanguage").mockReturnValue("en");

      const translations = overlayBackground["getTranslations"]();

      expect(overlayBackground["getTranslations"]).toHaveBeenCalled();
      const translationKeys = [
        "opensInANewWindow",
        "bitwardenOverlayButton",
        "toggleBitwardenVaultOverlay",
        "bitwardenVault",
        "unlockYourAccountToViewMatchingLogins",
        "unlockAccount",
        "fillCredentialsFor",
        "partialUsername",
        "view",
        "noItemsToShow",
        "newItem",
        "addNewVaultItem",
      ];
      translationKeys.forEach((key) => {
        expect(overlayBackground["i18nService"].translate).toHaveBeenCalledWith(key);
      });
      expect(translations).toStrictEqual({
        locale: "en",
        opensInANewWindow: "opensInANewWindow",
        buttonPageTitle: "bitwardenOverlayButton",
        toggleBitwardenVaultOverlay: "toggleBitwardenVaultOverlay",
        listPageTitle: "bitwardenVault",
        unlockYourAccount: "unlockYourAccountToViewMatchingLogins",
        unlockAccount: "unlockAccount",
        fillCredentialsFor: "fillCredentialsFor",
        partialUsername: "partialUsername",
        view: "view",
        noItemsToShow: "noItemsToShow",
        newItem: "newItem",
        addNewVaultItem: "addNewVaultItem",
      });
    });
  });

  describe("setupExtensionMessageListeners", () => {
    it("will set up onMessage and onConnect listeners", () => {
      overlayBackground["setupExtensionMessageListeners"]();

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(chrome.runtime.onConnect.addListener).toHaveBeenCalled();
    });
  });

  describe("handleExtensionMessage", () => {
    it("will return early if the message command is not present within the extensionMessageHandlers", () => {
      const message = {
        command: "not-a-command",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const sendResponse = jest.fn();

      const returnValue = overlayBackground["handleExtensionMessage"](
        message,
        sender,
        sendResponse
      );

      expect(returnValue).toBe(undefined);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it("will trigger the message handler and return undefined if the message does not have a response", () => {
      const message = {
        command: "autofillOverlayElementClosed",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const sendResponse = jest.fn();
      jest.spyOn(overlayBackground as any, "overlayElementClosed");

      const returnValue = overlayBackground["handleExtensionMessage"](
        message,
        sender,
        sendResponse
      );

      expect(returnValue).toBe(undefined);
      expect(sendResponse).not.toHaveBeenCalled();
      expect(overlayBackground["overlayElementClosed"]).toHaveBeenCalledWith(message);
    });

    it("will return a response if the message handler returns a response", async () => {
      const message = {
        command: "openAutofillOverlay",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const sendResponse = jest.fn();
      jest.spyOn(overlayBackground as any, "getTranslations").mockReturnValue("translations");

      const returnValue = overlayBackground["handleExtensionMessage"](
        message,
        sender,
        sendResponse
      );

      expect(returnValue).toBe(true);
    });

    describe("extension message handlers", () => {
      beforeEach(() => {
        jest
          .spyOn(overlayBackground as any, "getAuthStatus")
          .mockResolvedValue(AuthenticationStatus.Unlocked);
      });

      describe("openAutofillOverlay message handler", () => {
        it("opens the autofill overlay by sending a message to the current tab", async () => {
          const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
          jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(sender.tab);
          jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

          sendExtensionRuntimeMessage({ command: "openAutofillOverlay" });
          await flushPromises();

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            sender.tab,
            "openAutofillOverlay",
            {
              isFocusingFieldElement: false,
              isOpeningFullOverlay: false,
              authStatus: AuthenticationStatus.Unlocked,
            }
          );
        });
      });

      describe("autofillOverlayElementClosed message handler", () => {
        beforeEach(() => {
          initOverlayElementPorts();
        });

        it("disconnects the button element port", () => {
          sendExtensionRuntimeMessage({
            command: "autofillOverlayElementClosed",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.disconnect).toHaveBeenCalled();
          expect(overlayBackground["overlayButtonPort"]).toBeNull();
        });

        it("disconnects the list element port", () => {
          sendExtensionRuntimeMessage({
            command: "autofillOverlayElementClosed",
            overlayElement: AutofillOverlayElement.List,
          });

          expect(listPortSpy.disconnect).toHaveBeenCalled();
          expect(overlayBackground["overlayListPort"]).toBeNull();
        });
      });

      describe("getAutofillOverlayVisibility message handler", () => {
        beforeEach(() => {
          jest
            .spyOn(overlayBackground["settingsService"], "getAutoFillOverlayVisibility")
            .mockResolvedValue(AutofillOverlayVisibility.OnFieldFocus);
        });

        it("will set the overlayVisibility property", async () => {
          sendExtensionRuntimeMessage({ command: "getAutofillOverlayVisibility" });
          await flushPromises();

          expect(overlayBackground["overlayVisibility"]).toBe(
            AutofillOverlayVisibility.OnFieldFocus
          );
        });

        it("returns the overlayVisibility property", async () => {
          const sendMessageSpy = jest.fn();

          sendExtensionRuntimeMessage(
            { command: "getAutofillOverlayVisibility" },
            undefined,
            sendMessageSpy
          );
          await flushPromises();

          expect(sendMessageSpy).toHaveBeenCalledWith(AutofillOverlayVisibility.OnFieldFocus);
        });
      });

      describe("checkAutofillOverlayFocused message handler", () => {
        beforeEach(() => {
          initOverlayElementPorts();
        });

        it("will check if the overlay list is focused if the list port is open", () => {
          sendExtensionRuntimeMessage({ command: "checkAutofillOverlayFocused" });

          expect(listPortSpy.postMessage).toHaveBeenCalledWith({
            command: "checkAutofillOverlayListFocused",
          });
          expect(buttonPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "checkAutofillOverlayButtonFocused",
          });
        });

        it("will check if the overlay button is focused if the list port is not open", () => {
          overlayBackground["overlayListPort"] = undefined;

          sendExtensionRuntimeMessage({ command: "checkAutofillOverlayFocused" });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "checkAutofillOverlayButtonFocused",
          });
          expect(listPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "checkAutofillOverlayListFocused",
          });
        });
      });

      describe("focusAutofillOverlayList message handler", () => {
        it("will send a `focusOverlayList` message to the overlay list port", () => {
          initOverlayElementPorts({ initList: true, initButton: false });

          sendExtensionRuntimeMessage({ command: "focusAutofillOverlayList" });

          expect(listPortSpy.postMessage).toHaveBeenCalledWith({ command: "focusOverlayList" });
        });
      });

      describe("updateAutofillOverlayPosition message handler", () => {
        let buttonPortOnMessageListener: CallableFunction;
        let listPortOnMessageListener: CallableFunction;

        beforeEach(() => {
          overlayBackground["handlePortOnConnect"](
            createPortSpyMock(AutofillOverlayPort.List, listPortOnMessageListener)
          );
          listPortSpy = overlayBackground["overlayListPort"] as PortSpy;
          overlayBackground["handlePortOnConnect"](
            createPortSpyMock(AutofillOverlayPort.Button, buttonPortOnMessageListener)
          );
          buttonPortSpy = overlayBackground["overlayButtonPort"] as PortSpy;
        });

        it("ignores updating the position if the overlay element type is not provided", () => {
          sendExtensionRuntimeMessage({ command: "updateAutofillOverlayPosition" });

          expect(listPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: expect.anything(),
          });
          expect(buttonPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: expect.anything(),
          });
        });

        it("updates the overlay button's position", () => {
          const focusedFieldData = createFocusedFieldDataMock();
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { height: "2px", left: "4px", top: "2px", width: "2px" },
          });
        });

        it("takes into account the right padding of the focused field in positioning the button if the right padding of the field is larger than the left padding", () => {
          const focusedFieldData = createFocusedFieldDataMock({
            focusedFieldStyles: { paddingRight: "20px", paddingLeft: "6px" },
          });
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { height: "2px", left: "-18px", top: "2px", width: "2px" },
          });
        });

        it("will post a message to the overlay list facilitating an update of the list's position", () => {
          const focusedFieldData = createFocusedFieldDataMock();
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          overlayBackground["updateOverlayPosition"]({
            overlayElement: AutofillOverlayElement.List,
          });
          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.List,
          });

          expect(listPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { left: "2px", top: "4px", width: "4px" },
          });
        });
      });

      describe("updateOverlayHidden", () => {
        beforeEach(() => {
          initOverlayElementPorts();
        });

        it("returns early if the display value is not provided", () => {
          const message = {
            command: "updateAutofillOverlayHidden",
          };

          sendExtensionRuntimeMessage(message);

          expect(buttonPortSpy.postMessage).not.toHaveBeenCalledWith(message);
          expect(listPortSpy.postMessage).not.toHaveBeenCalledWith(message);
        });

        it("posts a message to the overlay button and list with the display value", () => {
          const message = { command: "updateAutofillOverlayHidden", display: "none" };

          sendExtensionRuntimeMessage(message);

          expect(overlayBackground["overlayButtonPort"].postMessage).toHaveBeenCalledWith({
            command: "updateOverlayHidden",
            styles: {
              display: message.display,
            },
          });
          expect(overlayBackground["overlayListPort"].postMessage).toHaveBeenCalledWith({
            command: "updateOverlayHidden",
            styles: {
              display: message.display,
            },
          });
        });
      });

      describe("unlockCompleted message handler", () => {
        let getAuthStatusSpy: jest.SpyInstance;

        beforeEach(() => {
          overlayBackground["userAuthStatus"] = AuthenticationStatus.LoggedOut;
          jest.spyOn(BrowserApi, "tabSendMessageData");
          getAuthStatusSpy = jest
            .spyOn(overlayBackground as any, "getAuthStatus")
            .mockImplementation(() => {
              overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
              return Promise.resolve(AuthenticationStatus.Unlocked);
            });
        });

        it("updates the user's auth status but does not open the overlay", async () => {
          const message = {
            command: "unlockCompleted",
            data: {
              commandToRetry: { msg: { command: "" } },
            },
          };

          sendExtensionRuntimeMessage(message);
          await flushPromises();

          expect(getAuthStatusSpy).toHaveBeenCalled();
          expect(BrowserApi.tabSendMessageData).not.toHaveBeenCalled();
        });

        it("updates user's auth status and opens the overlay if a follow up command is provided", async () => {
          const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
          const message = {
            command: "unlockCompleted",
            data: {
              commandToRetry: { msg: { command: "openAutofillOverlay" } },
            },
          };
          jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(sender.tab);

          sendExtensionRuntimeMessage(message);
          await flushPromises();

          expect(getAuthStatusSpy).toHaveBeenCalled();
          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            sender.tab,
            "openAutofillOverlay",
            {
              isFocusingFieldElement: true,
              isOpeningFullOverlay: false,
              authStatus: AuthenticationStatus.Unlocked,
            }
          );
        });
      });
    });
  });

  describe("handlePortOnConnect", () => {
    beforeEach(() => {
      jest.spyOn(overlayBackground as any, "updateOverlayPosition").mockImplementation();
      jest.spyOn(overlayBackground as any, "getAuthStatus").mockImplementation();
      jest.spyOn(overlayBackground as any, "getTranslations").mockImplementation();
    });

    it("sets up the overlay list port if the port connection is for the overlay list", async () => {
      initOverlayElementPorts({ initList: true, initButton: false });
      await flushPromises();

      expect(overlayBackground["overlayButtonPort"]).toBeUndefined();
      expect(listPortSpy.onMessage.addListener).toHaveBeenCalled();
      expect(listPortSpy.postMessage).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
      expect(chrome.runtime.getURL).toHaveBeenCalledWith("overlay/list.css");
      expect(overlayBackground["getTranslations"]).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayPosition"]).toHaveBeenCalledWith({
        overlayElement: AutofillOverlayElement.List,
      });
    });

    it("sets up the overlay button port if the port connection is for the overlay button", async () => {
      initOverlayElementPorts({ initList: false, initButton: true });
      await flushPromises();

      expect(overlayBackground["overlayListPort"]).toBeUndefined();
      expect(buttonPortSpy.onMessage.addListener).toHaveBeenCalled();
      expect(buttonPortSpy.postMessage).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
      expect(chrome.runtime.getURL).toHaveBeenCalledWith("overlay/button.css");
      expect(overlayBackground["getTranslations"]).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayPosition"]).toHaveBeenCalledWith({
        overlayElement: AutofillOverlayElement.Button,
      });
    });

    it("gets the system theme", async () => {
      jest.spyOn(overlayBackground["stateService"], "getTheme").mockResolvedValue(ThemeType.System);
      window.matchMedia = jest.fn(() => mock<MediaQueryList>({ matches: true }));

      initOverlayElementPorts({ initList: true, initButton: false });
      await flushPromises();

      expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });
  });

  describe("handleOverlayElementPortMessage", () => {
    beforeEach(() => {
      initOverlayElementPorts();
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
    });

    it("ignores port messages that do not contain a handler", () => {
      jest.spyOn(overlayBackground as any, "checkOverlayButtonFocused").mockImplementation();

      buttonPortSpy.onMessage.callListener({ command: "checkAutofillOverlayButtonFocused" });

      expect(overlayBackground["checkOverlayButtonFocused"]).not.toHaveBeenCalled();
    });

    describe("overlay button message handlers", () => {
      it("unlocks the vault if the user auth status is not unlocked", () => {
        overlayBackground["userAuthStatus"] = AuthenticationStatus.LoggedOut;
        jest.spyOn(overlayBackground as any, "unlockVault").mockImplementation();

        buttonPortSpy.onMessage.callListener({ command: "overlayButtonClicked" });

        expect(overlayBackground["unlockVault"]).toHaveBeenCalled();
      });

      it("opens the autofill overlay if the auth status is unlocked", () => {
        jest.spyOn(overlayBackground as any, "openOverlay").mockImplementation();

        buttonPortSpy.onMessage.callListener({ command: "overlayButtonClicked" });

        expect(overlayBackground["openOverlay"]).toHaveBeenCalled();
      });

      describe("closeAutofillOverlay", () => {
        it("sends a `closeOverlay` message to the sender tab", () => {
          jest.spyOn(BrowserApi, "tabSendMessage");

          buttonPortSpy.onMessage.callListener({ command: "closeAutofillOverlay" });

          expect(BrowserApi.tabSendMessage).toHaveBeenCalledWith(buttonPortSpy.sender.tab, {
            command: "closeAutofillOverlay",
          });
        });
      });

      describe("overlayPageBlurred", () => {
        it("checks if the overlay list is focused", () => {
          jest.spyOn(overlayBackground as any, "checkOverlayListFocused");

          buttonPortSpy.onMessage.callListener({ command: "overlayPageBlurred" });

          expect(overlayBackground["checkOverlayListFocused"]).toHaveBeenCalled();
        });
      });

      describe("redirectOverlayFocusOut", () => {
        beforeEach(() => {
          jest.spyOn(BrowserApi, "tabSendMessageData");
        });

        it("ignores the redirect message if the direction is not provided", () => {
          buttonPortSpy.onMessage.callListener({ command: "redirectOverlayFocusOut" });

          expect(BrowserApi.tabSendMessageData).not.toHaveBeenCalled();
        });

        it("sends the redirect message if the direction is provided", () => {
          buttonPortSpy.onMessage.callListener({
            command: "redirectOverlayFocusOut",
            direction: RedirectFocusDirection.Next,
          });

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            buttonPortSpy.sender.tab,
            "redirectOverlayFocusOut",
            { direction: RedirectFocusDirection.Next }
          );
        });
      });
    });

    describe("overlay list message handlers", () => {
      describe("checkAutofillOverlayButtonFocused", () => {
        it("checks on the focus state of the overlay button", () => {
          jest.spyOn(overlayBackground as any, "checkOverlayButtonFocused").mockImplementation();

          listPortSpy.onMessage.callListener({ command: "checkAutofillOverlayButtonFocused" });

          expect(overlayBackground["checkOverlayButtonFocused"]).toHaveBeenCalled();
        });
      });

      describe("overlayPageBlurred", () => {
        it("checks on the focus state of the overlay button", () => {
          jest.spyOn(overlayBackground as any, "checkOverlayButtonFocused").mockImplementation();

          listPortSpy.onMessage.callListener({ command: "overlayPageBlurred" });

          expect(overlayBackground["checkOverlayButtonFocused"]).toHaveBeenCalled();
        });
      });

      describe("unlockVault", () => {
        it("closes the autofill overlay and opens the unlock popout", async () => {
          jest.spyOn(overlayBackground as any, "closeOverlay").mockImplementation();
          jest.spyOn(overlayBackground as any, "openUnlockPopout").mockImplementation();
          jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

          listPortSpy.onMessage.callListener({ command: "unlockVault" });
          await flushPromises();

          expect(overlayBackground["closeOverlay"]).toHaveBeenCalledWith(listPortSpy);
          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            listPortSpy.sender.tab,
            "addToLockedVaultPendingNotifications",
            {
              commandToRetry: {
                msg: { command: "openAutofillOverlay" },
                sender: listPortSpy.sender,
              },
              target: "overlay.background",
            }
          );
          expect(overlayBackground["openUnlockPopout"]).toHaveBeenCalledWith(
            listPortSpy.sender.tab,
            true
          );
        });
      });

      describe("redirectOverlayFocusOut", () => {
        it("redirects focus out of the overlay list", async () => {
          const message = {
            command: "redirectOverlayFocusOut",
            direction: RedirectFocusDirection.Next,
          };
          const redirectOverlayFocusOutSpy = jest.spyOn(
            overlayBackground as any,
            "redirectOverlayFocusOut"
          );

          listPortSpy.onMessage.callListener(message);
          await flushPromises();

          expect(redirectOverlayFocusOutSpy).toHaveBeenCalledWith(message, listPortSpy);
        });
      });
    });
  });
});
