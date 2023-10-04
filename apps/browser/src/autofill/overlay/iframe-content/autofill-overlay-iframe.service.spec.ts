import { EVENTS } from "../../constants";
import { flushPromises } from "../../jest/testing-utils";
import { AutofillOverlayPort } from "../../utils/autofill-overlay.enum";

import AutofillOverlayIframeService from "./autofill-overlay-iframe.service";

type PortSpy = chrome.runtime.Port & {
  onDisconnect: { callListener: () => void };
  onMessage: { callListener: (message: any) => void };
};

describe("AutofillOverlayIframeService", () => {
  const iframePath = "overlay/list.html";
  let autofillOverlayIframeService: AutofillOverlayIframeService;
  let portSpy: PortSpy;
  let shadowAppendSpy: jest.SpyInstance;
  let handlePortDisconnectSpy: jest.SpyInstance;
  let handlePortMessageSpy: jest.SpyInstance;
  let handleWindowMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    const shadow = document.createElement("div").attachShadow({ mode: "open" });
    autofillOverlayIframeService = new AutofillOverlayIframeService(
      iframePath,
      AutofillOverlayPort.Button,
      shadow
    );
    shadowAppendSpy = jest.spyOn(shadow, "appendChild");
    handlePortDisconnectSpy = jest.spyOn(
      autofillOverlayIframeService as any,
      "handlePortDisconnect"
    );
    handlePortMessageSpy = jest.spyOn(autofillOverlayIframeService as any, "handlePortMessage");
    handleWindowMessageSpy = jest.spyOn(autofillOverlayIframeService as any, "handleWindowMessage");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initOverlayIframe", () => {
    it("sets up the iframe's attributes", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");

      expect(autofillOverlayIframeService["iframe"]).toMatchSnapshot();
    });

    it("appends the iframe to the shadowDom", () => {
      jest.spyOn(autofillOverlayIframeService["shadow"], "appendChild");

      autofillOverlayIframeService.initOverlayIframe({}, "title");

      expect(autofillOverlayIframeService["shadow"].appendChild).toBeCalledWith(
        autofillOverlayIframeService["iframe"]
      );
    });

    it("creates an aria alert element if the ariaAlert param is passed", () => {
      const ariaAlert = "aria alert";
      jest.spyOn(autofillOverlayIframeService as any, "createAriaAlertElement");

      autofillOverlayIframeService.initOverlayIframe({}, "title", ariaAlert);

      expect(autofillOverlayIframeService["createAriaAlertElement"]).toBeCalledWith(ariaAlert);
      expect(autofillOverlayIframeService["ariaAlertElement"]).toMatchSnapshot();
    });

    describe("on load of the iframe source", () => {
      beforeEach(() => {
        autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title", "ariaAlert");
      });

      it("sets up and connects the port message listener to the extension background", () => {
        jest.spyOn(globalThis, "addEventListener");

        autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));
        portSpy = autofillOverlayIframeService["port"] as PortSpy;

        expect(chrome.runtime.connect).toBeCalledWith({ name: AutofillOverlayPort.Button });
        expect(portSpy.onDisconnect.addListener).toBeCalledWith(handlePortDisconnectSpy);
        expect(portSpy.onMessage.addListener).toBeCalledWith(handlePortMessageSpy);
        expect(globalThis.addEventListener).toBeCalledWith(EVENTS.MESSAGE, handleWindowMessageSpy);
      });

      it("skips announcing the aria alert if the aria alert element is not populated", () => {
        jest.spyOn(globalThis, "setTimeout");
        autofillOverlayIframeService["ariaAlertElement"] = undefined;

        autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));

        expect(globalThis.setTimeout).not.toBeCalled();
      });

      it("announces the aria alert if the aria alert element is populated", () => {
        jest.useFakeTimers();
        jest.spyOn(globalThis, "setTimeout");
        autofillOverlayIframeService["ariaAlertElement"] = document.createElement("div");
        autofillOverlayIframeService["ariaAlertTimeout"] = setTimeout(jest.fn(), 2000);

        autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));

        expect(globalThis.setTimeout).toBeCalled();
        jest.advanceTimersByTime(2000);

        expect(shadowAppendSpy).toBeCalledWith(autofillOverlayIframeService["ariaAlertElement"]);
      });
    });
  });

  describe("event listeners", () => {
    beforeEach(() => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title", "ariaAlert");
      autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));
      Object.defineProperty(autofillOverlayIframeService["iframe"], "contentWindow", {
        value: {
          postMessage: jest.fn(),
        },
        writable: true,
      });
      jest.spyOn(autofillOverlayIframeService["iframe"].contentWindow, "postMessage");
      portSpy = autofillOverlayIframeService["port"] as PortSpy;
    });

    describe("handlePortDisconnect", () => {
      it("ignores ports that do not have the correct port name", () => {
        portSpy.name = "wrong-port-name";
        portSpy.onDisconnect.callListener();

        expect(autofillOverlayIframeService["port"]).not.toBeNull();
      });

      it("resets the iframe element's opacity, height, and display styles", () => {
        portSpy.onDisconnect.callListener();

        expect(autofillOverlayIframeService["iframe"].style.opacity).toBe("0");
        expect(autofillOverlayIframeService["iframe"].style.height).toBe("0px");
        expect(autofillOverlayIframeService["iframe"].style.display).toBe("block");
      });

      it("removes the global message listener", () => {
        jest.spyOn(globalThis, "removeEventListener");

        portSpy.onDisconnect.callListener();

        expect(globalThis.removeEventListener).toBeCalledWith(
          EVENTS.MESSAGE,
          handleWindowMessageSpy
        );
      });

      it("removes the port's onMessage listener", () => {
        portSpy.onDisconnect.callListener();

        expect(portSpy.onMessage.removeListener).toBeCalledWith(handlePortMessageSpy);
      });

      it("removes the port's onDisconnect listener", () => {
        portSpy.onDisconnect.callListener();

        expect(portSpy.onDisconnect.removeListener).toBeCalledWith(handlePortDisconnectSpy);
      });

      it("disconnects the port", () => {
        portSpy.onDisconnect.callListener();

        expect(portSpy.disconnect).toBeCalled();
        expect(autofillOverlayIframeService["port"]).toBeNull();
      });
    });

    describe("handlePortMessage", () => {
      it("ignores port messages that do not correlate to the correct port name", () => {
        portSpy.name = "wrong-port-name";
        portSpy.onMessage.callListener({});

        expect(autofillOverlayIframeService["iframe"].contentWindow.postMessage).not.toBeCalled();
      });

      it("passes on the message to the iframe if the message is not registered with the message handlers", () => {
        const message = { command: "unregisteredMessage" };

        portSpy.onMessage.callListener(message);

        expect(autofillOverlayIframeService["iframe"].contentWindow.postMessage).toBeCalledWith(
          message,
          "*"
        );
      });

      it("handles port messages that are registered with the message handlers and does not pass the message on to the iframe", () => {
        jest.spyOn(autofillOverlayIframeService as any, "updateIframePosition");

        portSpy.onMessage.callListener({ command: "updateIframePosition" });

        expect(autofillOverlayIframeService["iframe"].contentWindow.postMessage).not.toBeCalled();
      });

      describe("updating the iframe's position", () => {
        beforeEach(() => {
          jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(true);
        });

        it("ignores updating the iframe position if the document does not have focus", () => {
          jest.spyOn(autofillOverlayIframeService as any, "updateElementStyles");
          jest.spyOn(globalThis.document, "hasFocus").mockReturnValue(false);

          portSpy.onMessage.callListener({
            command: "updateIframePosition",
            styles: { top: 100, left: 100 },
          });

          expect(autofillOverlayIframeService["updateElementStyles"]).not.toBeCalled();
        });

        it("updates the iframe position if the document has focus", () => {
          const styles = { top: "100px", left: "100px" };

          portSpy.onMessage.callListener({
            command: "updateIframePosition",
            styles,
          });

          expect(autofillOverlayIframeService["iframe"].style.top).toBe(styles.top);
          expect(autofillOverlayIframeService["iframe"].style.left).toBe(styles.left);
        });

        it("fades the iframe element in after positioning the element", () => {
          jest.useFakeTimers();
          const styles = { top: "100px", left: "100px" };

          portSpy.onMessage.callListener({
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

          portSpy.onMessage.callListener({
            command: "updateIframePosition",
            styles,
          });

          jest.advanceTimersByTime(2000);
          expect(shadowAppendSpy).toBeCalledWith(autofillOverlayIframeService["ariaAlertElement"]);
        });
      });

      it("updates the visibility of the iframe", () => {
        portSpy.onMessage.callListener({
          command: "updateOverlayHidden",
          styles: { display: "none" },
        });

        expect(autofillOverlayIframeService["iframe"].style.display).toBe("none");
      });
    });

    describe("handleWindowMessage", () => {
      it("ignores window messages when the port is not set", () => {
        autofillOverlayIframeService["port"] = null;

        globalThis.dispatchEvent(new MessageEvent("message", { data: {} }));

        expect(autofillOverlayIframeService["port"]).toBeNull();
      });

      it("ignores window messages whose source is not the iframe's content window", () => {
        globalThis.dispatchEvent(
          new MessageEvent("message", {
            data: {},
            source: window,
          })
        );

        expect(portSpy.postMessage).not.toBeCalled();
      });

      it("ignores window messages whose origin is not from the extension origin", () => {
        globalThis.dispatchEvent(
          new MessageEvent("message", {
            data: {},
            source: autofillOverlayIframeService["iframe"].contentWindow,
            origin: "https://www.google.com",
          })
        );

        expect(portSpy.postMessage).not.toBeCalled();
      });

      it("passes the window message from an iframe element to the background port", () => {
        globalThis.dispatchEvent(
          new MessageEvent("message", {
            data: { command: "not-a-handled-command" },
            source: autofillOverlayIframeService["iframe"].contentWindow,
            origin: "chrome-extension://id",
          })
        );

        expect(portSpy.postMessage).toBeCalledWith({ command: "not-a-handled-command" });
      });

      it("updates the overlay list height", () => {
        globalThis.dispatchEvent(
          new MessageEvent("message", {
            data: { command: "updateAutofillOverlayListHeight", styles: { height: "300px" } },
            source: autofillOverlayIframeService["iframe"].contentWindow,
            origin: "chrome-extension://id",
          })
        );

        expect(autofillOverlayIframeService["iframe"].style.height).toBe("300px");
      });
    });
  });

  describe("mutation observer", () => {
    beforeEach(() => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title", "ariaAlert");
      autofillOverlayIframeService["iframe"].dispatchEvent(new Event(EVENTS.LOAD));
    });

    it("will revert any styles changes made directly to the iframe", async () => {
      jest.useFakeTimers();

      autofillOverlayIframeService["iframe"].style.visibility = "hidden";
      await flushPromises();

      expect(autofillOverlayIframeService["iframe"].style.visibility).toBe("visible");
    });
  });
});
