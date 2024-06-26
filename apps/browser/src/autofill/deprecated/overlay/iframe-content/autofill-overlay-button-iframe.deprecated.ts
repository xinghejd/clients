import { AutofillOverlayPort } from "../../../enums/autofill-overlay.enum";

import AutofillOverlayIframeElement from "./autofill-overlay-iframe-element.deprecated";

class AutofillOverlayButtonIframe extends AutofillOverlayIframeElement {
  constructor(element: HTMLElement) {
    super(
      element,
      "overlay/legacy-button.html",
      AutofillOverlayPort.Button,
      {
        background: "transparent",
        border: "none",
      },
      chrome.i18n.getMessage("bitwardenOverlayButton"),
      chrome.i18n.getMessage("bitwardenOverlayMenuAvailable"),
    );
  }
}

export default AutofillOverlayButtonIframe;
