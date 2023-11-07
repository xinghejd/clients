import { setupAutofillInitDisconnectAction } from "../utils/utils";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    windowContext.bitwardenAutofillInit = new AutofillInit();
    setupAutofillInitDisconnectAction(windowContext);

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
