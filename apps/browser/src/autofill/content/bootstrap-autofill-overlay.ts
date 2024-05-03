import { AutofillOverlayInlineMenuElements } from "../overlay/inline-menu/content/autofill-overlay-inline-menu-elements";
import AutofillOverlayContentService from "../services/autofill-overlay-content.service";
import { setupAutofillInitDisconnectAction } from "../utils";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    const autofillOverlayContentService = new AutofillOverlayContentService();
    let inlineMenuElements: AutofillOverlayInlineMenuElements;
    if (globalThis.self === globalThis.top) {
      inlineMenuElements = new AutofillOverlayInlineMenuElements();
    }
    windowContext.bitwardenAutofillInit = new AutofillInit(
      autofillOverlayContentService,
      inlineMenuElements,
    );
    setupAutofillInitDisconnectAction(windowContext);

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
