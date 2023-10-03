import { AutofillOverlayPort } from "../../utils/autofill-overlay.enum";
import { AutofillOverlayIframeService as AutofillOverlayIframeServiceInterface } from "../abstractions/autofill-overlay-iframe.service";

import AutofillOverlayIframeService from "./autofill-overlay-iframe.service";

Object.defineProperty(window, "EventSource", {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    close: jest.fn(() => {
      /* noop */
    }),
    addEventListener: jest.fn(
      (
        _event: string,
        _callback: (_message: MessageEvent) => {
          /* noop */
        }
      ) => {
        /* noop */
      }
    ),
  })),
});

(global as any).chrome = {
  runtime: {
    getURL: function (path: string) {
      return "chrome-extension://id/overlay/list.html";
    },
    connect: function (port: any) {
      return {
        onDisconnect: {
          addListener: (eventsMessage: string, messageHandler: () => void) => {
            /* noop */
          },
        },
        onMessage: {
          addListener: (eventsMessage: string, messageHandler: () => void) => {
            /* noop */
          },
        },
      };
    },
  },
};

describe("AutofillOverlayIframeService", () => {
  const iframePath = "overlay/list.html";
  let autofillOverlayIframeService: AutofillOverlayIframeServiceInterface | any;

  beforeEach(() => {
    const shadow = document.createElement("div").attachShadow({ mode: "open" });
    autofillOverlayIframeService = new AutofillOverlayIframeService(
      iframePath,
      AutofillOverlayPort.Button,
      shadow
    );
  });

  describe("initOverlayIframe", () => {
    it("sets up the iframe's attributes", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");
      const overlayIframe = autofillOverlayIframeService["iframe"];

      expect(autofillOverlayIframeService["iframe"].src).toEqual(
        "chrome-extension://id/overlay/list.html"
      );
      expect(autofillOverlayIframeService["iframe"].tabIndex).toEqual(-1);
      expect(autofillOverlayIframeService["iframe"].getAttribute("title")).toEqual("title");
      expect(autofillOverlayIframeService["iframe"].getAttribute("sandbox")).toEqual(
        "allow-scripts"
      );
      expect(autofillOverlayIframeService["iframe"].getAttribute("allowtransparency")).toEqual(
        "true"
      );
      expect(autofillOverlayIframeService["iframe"].getAttribute("style")).toContain(
        "height: 0px;"
      );
    });

    it("appends the iframe to the shadowDom", () => {
      jest.spyOn(autofillOverlayIframeService["shadow"], "appendChild");

      autofillOverlayIframeService.initOverlayIframe({}, "title");
      const overlayIframe = autofillOverlayIframeService["iframe"];

      expect(autofillOverlayIframeService["shadow"].appendChild).toBeCalledWith(
        autofillOverlayIframeService["iframe"]
      );
    });

    it("creates an aria alert element if the ariaAlert param is passed", () => {
      const ariaAlert = "aria alert";
      jest.spyOn(autofillOverlayIframeService, "createAriaAlertElement");

      autofillOverlayIframeService.initOverlayIframe({}, "title", ariaAlert);

      expect(autofillOverlayIframeService.createAriaAlertElement).toBeCalledWith(ariaAlert);
    });
  });

  describe("setupPortMessageListener", () => {
    it("sends a message to update", () => {
      const ariaAlert = "aria alert";
      autofillOverlayIframeService.initOverlayIframe({ top: "0px" }, "title", ariaAlert);
      const overlayIframe = autofillOverlayIframeService["iframe"];
      const updatedStyles = { position: "relative", top: "40px" };
      const portMessage = { command: "updateIframePosition", styles: updatedStyles };
      const port = { name: autofillOverlayIframeService["portName"] };

      jest.spyOn(autofillOverlayIframeService, "setupPortMessageListener");
      jest.spyOn(autofillOverlayIframeService, "handlePortMessage");

      expect(overlayIframe.getAttribute("style")).toContain("top: 0px;");

      autofillOverlayIframeService["setupPortMessageListener"]();
      expect(autofillOverlayIframeService["setupPortMessageListener"]).toBeCalled();

      autofillOverlayIframeService["handlePortMessage"](portMessage, port);

      expect(autofillOverlayIframeService["handlePortMessage"]).toBeCalledWith(portMessage, port);
    });
  });

  describe("updateElementStyles", () => {
    it("it updates the iframe's styling", () => {
      autofillOverlayIframeService.initOverlayIframe({ top: "0px" }, "title");
      const overlayIframe = autofillOverlayIframeService["iframe"];

      expect(overlayIframe.getAttribute("style")).toContain("top: 0px;");

      autofillOverlayIframeService["updateElementStyles"](overlayIframe, {
        position: "relative",
        top: "40px",
      });

      expect(overlayIframe.getAttribute("style")).toContain("top: 40px;");
    });

    it("it does not update the iframe's styling when a customElement is not passed", () => {
      autofillOverlayIframeService.initOverlayIframe({ top: "0px" }, "title");
      const overlayIframe = autofillOverlayIframeService["iframe"];

      expect(overlayIframe.getAttribute("style")).toContain("top: 0px;");

      autofillOverlayIframeService["updateElementStyles"](null, {
        position: "relative",
        top: "40px",
      });

      expect(overlayIframe.getAttribute("style")).toContain("top: 0px;");
    });
  });

  describe("isFromExtensionOrigin", () => {
    it("returns true when the extension path is passed", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");
      const returnedValue = autofillOverlayIframeService["isFromExtensionOrigin"](
        "chrome-extension://id/overlay/list.htm"
      );

      expect(returnedValue).toStrictEqual(true);
    });

    it("returns false when a non-extension path is passed", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");
      const returnedValue =
        autofillOverlayIframeService["isFromExtensionOrigin"]("https://bitwarden.com");

      expect(returnedValue).toStrictEqual(false);
    });
  });

  describe("handleWindowMessage", () => {
    it("returns early when the message is not from the expected sender", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");
      const testMessage = new MessageEvent("testEvent", {
        data: { command: "updateAutofillOverlayListHeight", height: 10 },
      });

      jest.spyOn(autofillOverlayIframeService, "handleWindowMessage");
      jest.spyOn(autofillOverlayIframeService, "updateElementStyles");

      autofillOverlayIframeService["handleWindowMessage"](testMessage);

      expect(autofillOverlayIframeService["handleWindowMessage"]).toBeCalledWith(testMessage);
    });
  });

  describe("handlePortDisconnect", () => {
    it("disconnects the specified port", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");

      jest.spyOn(autofillOverlayIframeService, "handlePortDisconnect");

      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      const port = { name: autofillOverlayIframeService["portName"] };

      autofillOverlayIframeService["setupPortMessageListener"]();
      expect(autofillOverlayIframeService["port"]).not.toBeNull();

      /* @TODO
      autofillOverlayIframeService["handlePortDisconnect"](port);

      expect(autofillOverlayIframeService["handlePortDisconnect"]).toBeCalledWith(port);
      expect(autofillOverlayIframeService["port"]).toBeNull();
      */
    });

    it("returns early (and does not disconnect port) when the passed port doesn't match the class port", () => {
      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");

      jest.spyOn(autofillOverlayIframeService, "handlePortDisconnect");

      const port = { name: "someOtherPort" };

      autofillOverlayIframeService["setupPortMessageListener"]();
      expect(autofillOverlayIframeService["port"]).not.toBeNull();

      autofillOverlayIframeService["handlePortDisconnect"](port);

      expect(autofillOverlayIframeService["handlePortDisconnect"]).toBeCalledWith(port);
      expect(autofillOverlayIframeService["port"]).not.toBeNull();
    });
  });
});
