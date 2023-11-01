import AutofillOverlayContentService from "../services/autofill-overlay-content.service";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    const autofillOverlayContentService = new AutofillOverlayContentService();
    windowContext.bitwardenAutofillInit = new AutofillInit(autofillOverlayContentService);

    const port = chrome.runtime.connect({ name: "autofill" });
    port.onDisconnect.addListener(() => {
      windowContext.bitwardenAutofillInit.destroy();
      delete windowContext.bitwardenAutofillInit;
    });

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
