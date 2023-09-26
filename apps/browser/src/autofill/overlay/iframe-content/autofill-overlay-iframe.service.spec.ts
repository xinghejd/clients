import { AutofillOverlayPort } from "../../utils/autofill-overlay.enum";
import { AutofillOverlayIframeService as AutofillOverlayIframeServiceInterface } from "../abstractions/autofill-overlay-iframe.service";

import AutofillOverlayIframeService from "./autofill-overlay-iframe.service";

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
      const overlayIframe = autofillOverlayIframeService["iframe"];

      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");

      expect(overlayIframe.src).toEqual("chrome-extension://id/overlay/list.html");
      expect(overlayIframe.tabIndex).toEqual(-1);
      expect(overlayIframe.getAttribute("title")).toEqual("title");
      expect(overlayIframe.getAttribute("sandbox")).toEqual("allow-scripts");
      expect(overlayIframe.getAttribute("allowtransparency")).toEqual("true");
      expect(overlayIframe.getAttribute("style")).toContain("height: 0px;");
    });

    it("appends the iframe to the shadowDom", () => {
      const overlayIframe = autofillOverlayIframeService["iframe"];
      jest.spyOn(autofillOverlayIframeService["shadow"], "appendChild");

      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title");

      expect(autofillOverlayIframeService["shadow"].appendChild).toBeCalledWith(overlayIframe);
    });

    it("creates an aria alert element if the ariaAlert param is passed", () => {
      const ariaAlert = "aria alert";
      jest.spyOn(autofillOverlayIframeService, "createAriaAlertElement");

      autofillOverlayIframeService.initOverlayIframe({ height: "0px" }, "title", ariaAlert);

      expect(autofillOverlayIframeService.createAriaAlertElement).toBeCalledWith(ariaAlert);
    });
  });
});
