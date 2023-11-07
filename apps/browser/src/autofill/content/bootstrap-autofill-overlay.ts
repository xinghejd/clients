import AutofillOverlayContentService from "../services/autofill-overlay-content.service";
import { setupAutofillInitDisconnectAction } from "../utils/utils";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    const autofillOverlayContentService = new AutofillOverlayContentService();
    windowContext.bitwardenAutofillInit = new AutofillInit(autofillOverlayContentService);
    setupAutofillInitDisconnectAction(windowContext);

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
