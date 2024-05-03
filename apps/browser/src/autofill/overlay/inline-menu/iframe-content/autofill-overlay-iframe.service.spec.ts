import { mock } from "jest-mock-extended";

import { EVENTS } from "@bitwarden/common/autofill/constants";
import { ThemeType } from "@bitwarden/common/platform/enums";

import { AutofillOverlayPort } from "../../../enums/autofill-overlay.enum";
import { createPortSpyMock } from "../../../spec/autofill-mocks";
import {
  flushPromises,
  sendPortMessage,
  triggerPortOnDisconnectEvent,
} from "../../../spec/testing-utils";

import AutofillOverlayIframeService from "./autofill-overlay-iframe.service";

describe("AutofillOverlayIframeService", () => {
  let autofillOverlayIframeService: AutofillOverlayIframeService;
  let portSpy: chrome.runtime.Port;
  let shadowAppendSpy: jest.SpyInstance;
  let handlePortDisconnectSpy: jest.SpyInstance;
  let handlePortMessageSpy: jest.SpyInstance;
  let sendExtensionMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    const shadow = document.createElement("div").attachShadow({ mode: "open" });
    autofillOverlayIframeService = new AutofillOverlayIframeService(
      shadow,
      AutofillOverlayPort.Button,
      { height: "0px" },
      "title",
      "ariaAlert",
    );
    shadowAppendSpy = jest.spyOn(shadow, "appendChild");
    handlePortDisconnectSpy = jest.spyOn(
      autofillOverlayIframeService as any,
      "handlePortDisconnect",
    );
    handlePortMessageSpy = jest.spyOn(autofillOverlayIframeService as any, "handlePortMessage");
    chrome.runtime.connect = jest.fn((connectInfo: chrome.runtime.ConnectInfo) =>
      createPortSpyMock(connectInfo.name),
    ) as unknown as typeof chrome.runtime.connect;
    sendExtensionMessageSpy = jest.spyOn(
      autofillOverlayIframeService as any,
      "sendExtensionMessage",
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initMenuIframe", () => {
    it("sets up the iframe's attributes", () => {
      autofillOverlayIframeService.initMenuIframe();

      expect(autofillOverlayIframeService["iframe"]).toMatchSnapshot();
    });

    it("appends the iframe to the shadowDom", () => {
      jest.spyOn(autofillOverlayIframeService["shadow"], "appendChild");

      autofillOverlayIframeService.initMenuIframe();

      expect(autofillOverlayIframeService["shadow"].appendChild).toHaveBeenCalledWith(
        autofillOverlayIframeService["iframe"],
      );
    });

    // TODO CG - This test is brittle and failing due to how we are calling the private method. This needs to be reworked
    it.skip("creates an aria alert element if the ariaAlert param is passed", () => {
      const ariaAlert = "aria alert";
      jest.spyOn(autofillOverlayIframeService as any, "createAriaAlertElement");

      autofillOverlayIframeService.initMenuIframe();

      expect(autofillOverlayIframeService["createAriaAlertElement"]).toHaveBeenCalledWith(
        ariaAlert,
      );
      expect(autofillOverlayIframeService["ariaAlertElement"]).toMatchSnapshot();
    });

    describe("on load of the iframe source", () => {
      beforeEach(() => {
        autofillOverlayIframeService.initMenuIframe();
      });

      it("sets up and connects the port message listener to the extension background", () => {
        jest.spyOn(globalThis, "addEventListener");

        autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));
        portSpy = autofillOverlayIframeService["port"];

        expect(chrome.runtime.connect).toHaveBeenCalledWith({ name: AutofillOverlayPort.Button });
        expect(portSpy.onDisconnect.addListener).toHaveBeenCalledWith(handlePortDisconnectSpy);
        expect(portSpy.onMessage.addListener).toHaveBeenCalledWith(handlePortMessageSpy);
      });

      it("skips announcing the aria alert if the aria alert element is not populated", () => {
        jest.spyOn(globalThis, "setTimeout");
        autofillOverlayIframeService["ariaAlertElement"] = undefined;

        autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));

        expect(globalThis.setTimeout).not.toHaveBeenCalled();
      });

      it("announces the aria alert if the aria alert element is populated", () => {
        jest.useFakeTimers();
        jest.spyOn(globalThis, "setTimeout");
        autofillOverlayIframeService["ariaAlertElement"] = document.createElement("div");
        autofillOverlayIframeService["ariaAlertTimeout"] = setTimeout(jest.fn(), 2000);

        autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));

        expect(globalThis.setTimeout).toHaveBeenCalled();
        jest.advanceTimersByTime(2000);

        expect(shadowAppendSpy).toHaveBeenCalledWith(
          autofillOverlayIframeService["ariaAlertElement"],
        );
      });
    });
  });

  describe("event listeners", () => {
    beforeEach(() => {
      autofillOverlayIframeService.initMenuIframe();
      autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));
      Object.defineProperty(autofillOverlayIframeService["iframe"], "contentWindow", {
        value: {
          postMessage: jest.fn(),
        },
        writable: true,
      });
      jest.spyOn(autofillOverlayIframeService["iframe"].contentWindow, "postMessage");
      portSpy = autofillOverlayIframeService["port"];
    });

    describe("handlePortDisconnect", () => {
      it("ignores ports that do not have the correct port name", () => {
        portSpy.name = "wrong-port-name";
        triggerPortOnDisconnectEvent(portSpy);

        expect(autofillOverlayIframeService["port"]).not.toBeNull();
      });

      it("resets the iframe element's opacity, height, and display styles", () => {
        triggerPortOnDisconnectEvent(portSpy);

        expect(autofillOverlayIframeService["iframe"].style.opacity).toBe("0");
        expect(autofillOverlayIframeService["iframe"].style.height).toBe("0px");
        expect(autofillOverlayIframeService["iframe"].style.display).toBe("block");
      });

      it("removes the port's onMessage listener", () => {
        triggerPortOnDisconnectEvent(portSpy);

        expect(portSpy.onMessage.removeListener).toHaveBeenCalledWith(handlePortMessageSpy);
      });

      it("removes the port's onDisconnect listener", () => {
        triggerPortOnDisconnectEvent(portSpy);

        expect(portSpy.onDisconnect.removeListener).toHaveBeenCalledWith(handlePortDisconnectSpy);
      });

      it("disconnects the port", () => {
        triggerPortOnDisconnectEvent(portSpy);

        expect(portSpy.disconnect).toHaveBeenCalled();
        expect(autofillOverlayIframeService["port"]).toBeNull();
      });
    });

    describe("handlePortMessage", () => {
      it("ignores port messages that do not correlate to the correct port name", () => {
        portSpy.name = "wrong-port-name";
        sendPortMessage(portSpy, {});

        expect(
          autofillOverlayIframeService["iframe"].contentWindow.postMessage,
        ).not.toHaveBeenCalled();
      });

      it("passes on the message to the iframe if the message is not registered with the message handlers", () => {
        const message = { command: "unregisteredMessage" };

        sendPortMessage(portSpy, message);

        expect(
          autofillOverlayIframeService["iframe"].contentWindow.postMessage,
        ).toHaveBeenCalledWith(message, "*");
      });

      it("handles port messages that are registered with the message handlers and does not pass the message on to the iframe", () => {
        jest.spyOn(autofillOverlayIframeService as any, "updateIframePosition");

        sendPortMessage(portSpy, { command: "updateIframePosition" });

        expect(
          autofillOverlayIframeService["iframe"].contentWindow.postMessage,
        ).not.toHaveBeenCalled();
      });

      describe("initializing the overlay button", () => {
        it("sets the port key and posts the message to the overlay page iframe", () => {
          const portKey = "portKey";
          const message = {
            command: "initAutofillInlineMenuButton",
            portKey,
          };

          sendPortMessage(portSpy, message);

          expect(autofillOverlayIframeService["portKey"]).toBe(portKey);
          expect(
            autofillOverlayIframeService["iframe"].contentWindow.postMessage,
          ).toHaveBeenCalledWith(message, "*");
        });
      });

      describe("initializing the overlay list", () => {
        let updateElementStylesSpy: jest.SpyInstance;

        beforeEach(() => {
          updateElementStylesSpy = jest.spyOn(
            autofillOverlayIframeService as any,
            "updateElementStyles",
          );
        });

        it("passes the message on to the iframe element", () => {
          const message = {
            command: "initAutofillInlineMenuList",
            theme: ThemeType.Light,
          };

          sendPortMessage(portSpy, message);

          expect(updateElementStylesSpy).not.toHaveBeenCalled();
          expect(
            autofillOverlayIframeService["iframe"].contentWindow.postMessage,
          ).toHaveBeenCalledWith(message, "*");
        });

        it("sets a light theme based on the user's system preferences", () => {
          window.matchMedia = jest.fn(() => mock<MediaQueryList>({ matches: false }));
          const message = {
            command: "initAutofillInlineMenuList",
            theme: ThemeType.System,
          };

          sendPortMessage(portSpy, message);

          expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
          expect(
            autofillOverlayIframeService["iframe"].contentWindow.postMessage,
          ).toHaveBeenCalledWith(
            {
              command: "initAutofillInlineMenuList",
              theme: ThemeType.Light,
            },
            "*",
          );
        });

        it("sets a dark theme based on the user's system preferences", () => {
          window.matchMedia = jest.fn(() => mock<MediaQueryList>({ matches: true }));
          const message = {
            command: "initAutofillInlineMenuList",
            theme: ThemeType.System,
          };

          sendPortMessage(portSpy, message);

          expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
          expect(
            autofillOverlayIframeService["iframe"].contentWindow.postMessage,
          ).toHaveBeenCalledWith(
            {
              command: "initAutofillInlineMenuList",
              theme: ThemeType.Dark,
            },
            "*",
          );
        });

        it("updates the border to match the `dark` theme", () => {
          const message = {
            command: "initAutofillInlineMenuList",
            theme: ThemeType.Dark,
          };

          sendPortMessage(portSpy, message);

          expect(updateElementStylesSpy).toHaveBeenCalledWith(
            autofillOverlayIframeService["iframe"],
            {
              borderColor: "#4c525f",
            },
          );
        });

        it("updates the border to match the `nord` theme", () => {
          const message = {
            command: "initAutofillInlineMenuList",
            theme: ThemeType.Nord,
          };

          sendPortMessage(portSpy, message);

          expect(updateElementStylesSpy).toHaveBeenCalledWith(
            autofillOverlayIframeService["iframe"],
            {
              borderColor: "#2E3440",
            },
          );
        });

        it("updates the border to match the `solarizedDark` theme", () => {
          const message = {
            command: "initAutofillInlineMenuList",
            theme: ThemeType.SolarizedDark,
          };

          sendPortMessage(portSpy, message);

          expect(updateElementStylesSpy).toHaveBeenCalledWith(
            autofillOverlayIframeService["iframe"],
            {
              borderColor: "#073642",
            },
          );
        });
      });

      describe("updating the iframe's position", () => {
        beforeEach(() => {
          jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(true);
        });

        it("ignores updating the iframe position if the document does not have focus", () => {
          jest.spyOn(autofillOverlayIframeService as any, "updateElementStyles");
          jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(false);

          sendPortMessage(portSpy, {
            command: "updateIframePosition",
            styles: { top: 100, left: 100 },
          });

          expect(autofillOverlayIframeService["updateElementStyles"]).not.toHaveBeenCalled();
        });

        it("updates the iframe position if the document has focus", () => {
          const styles = { top: "100px", left: "100px" };

          sendPortMessage(portSpy, {
            command: "updateIframePosition",
            styles,
          });

          expect(autofillOverlayIframeService["iframe"].style.top).toBe(styles.top);
          expect(autofillOverlayIframeService["iframe"].style.left).toBe(styles.left);
        });

        it("fades the iframe element in after positioning the element", () => {
          jest.useFakeTimers();
          const styles = { top: "100px", left: "100px" };

          sendPortMessage(portSpy, {
            command: "updateIframePosition",
            styles,
          });

          expect(autofillOverlayIframeService["iframe"].style.opacity).toBe("0");
          jest.advanceTimersByTime(10);
          expect(autofillOverlayIframeService["iframe"].style.opacity).toBe("1");
        });

        it("announces the opening of the iframe using an aria alert", () => {
          jest.useFakeTimers();
          const styles = { top: "100px", left: "100px" };

          sendPortMessage(portSpy, {
            command: "updateIframePosition",
            styles,
          });

          jest.advanceTimersByTime(2000);
          expect(shadowAppendSpy).toHaveBeenCalledWith(
            autofillOverlayIframeService["ariaAlertElement"],
          );
        });
      });

      it("updates the visibility of the iframe", () => {
        sendPortMessage(portSpy, {
          command: "updateInlineMenuHidden",
          styles: { display: "none" },
        });

        expect(autofillOverlayIframeService["iframe"].style.display).toBe("none");
      });

      it("updates the button based on the web page's color scheme", () => {
        sendPortMessage(portSpy, {
          command: "updateAutofillInlineMenuColorScheme",
        });

        expect(
          autofillOverlayIframeService["iframe"].contentWindow.postMessage,
        ).toHaveBeenCalledWith(
          {
            command: "updateAutofillInlineMenuColorScheme",
            colorScheme: "normal",
          },
          "*",
        );
      });
    });
  });

  describe("mutation observer", () => {
    beforeEach(() => {
      autofillOverlayIframeService.initMenuIframe();
      autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));
      portSpy = autofillOverlayIframeService["port"];
    });

    it("skips handling found mutations if excessive mutations are triggering", async () => {
      jest.useFakeTimers();
      jest
        .spyOn(
          autofillOverlayIframeService as any,
          "isTriggeringExcessiveMutationObserverIterations",
        )
        .mockReturnValue(true);
      jest.spyOn(autofillOverlayIframeService as any, "updateElementStyles");

      autofillOverlayIframeService["iframe"].style.visibility = "hidden";
      await flushPromises();

      expect(autofillOverlayIframeService["updateElementStyles"]).not.toHaveBeenCalled();
    });

    it("reverts any styles changes made directly to the iframe", async () => {
      jest.useFakeTimers();

      autofillOverlayIframeService["iframe"].style.visibility = "hidden";
      await flushPromises();

      expect(autofillOverlayIframeService["iframe"].style.visibility).toBe("visible");
    });

    it("force closes the autofill overlay if more than 9 foreign mutations are triggered", async () => {
      jest.useFakeTimers();
      autofillOverlayIframeService["foreignMutationsCount"] = 10;

      autofillOverlayIframeService["iframe"].src = "http://malicious-site.com";
      await flushPromises();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillInlineMenu", {
        forceClose: true,
      });
    });

    it("force closes the autofill overlay if excessive mutations are being triggered", async () => {
      jest.useFakeTimers();
      autofillOverlayIframeService["mutationObserverIterations"] = 20;

      autofillOverlayIframeService["iframe"].src = "http://malicious-site.com";
      await flushPromises();

      expect(sendExtensionMessageSpy).toHaveBeenCalledWith("closeAutofillInlineMenu", {
        forceClose: true,
      });
    });

    it("resets the excessive mutations and foreign mutation counters", async () => {
      jest.useFakeTimers();
      autofillOverlayIframeService["foreignMutationsCount"] = 9;
      autofillOverlayIframeService["mutationObserverIterations"] = 19;

      autofillOverlayIframeService["iframe"].src = "http://malicious-site.com";
      jest.advanceTimersByTime(2001);
      await flushPromises();

      expect(autofillOverlayIframeService["foreignMutationsCount"]).toBe(0);
      expect(autofillOverlayIframeService["mutationObserverIterations"]).toBe(0);
    });

    it("resets any mutated default attributes for the iframe", async () => {
      jest.useFakeTimers();

      autofillOverlayIframeService["iframe"].title = "some-other-title";
      await flushPromises();

      expect(autofillOverlayIframeService["iframe"].title).toBe("title");
    });
  });
});
