import AutofillOverlayIframeService from "./autofill-overlay-iframe.service";

class AutofillOverlayIframeElement {
  constructor(
    element: HTMLElement,
    portName: string,
    initStyles: Partial<CSSStyleDeclaration>,
    iframeTitle: string,
    ariaAlert?: string,
  ) {
    const shadow: ShadowRoot = element.attachShadow({ mode: "closed" });
    const autofillOverlayIframeService = new AutofillOverlayIframeService(
      shadow,
      portName,
      initStyles,
      iframeTitle,
      ariaAlert,
    );
    autofillOverlayIframeService.initMenuIframe();
  }
}

export default AutofillOverlayIframeElement;
