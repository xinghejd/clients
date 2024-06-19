import { AutofillOverlayPort } from "../enums/autofill-overlay.enum";
import { AutofillInlineMenuContentService } from "../overlay/inline-menu/content/autofill-inline-menu-content.service";
import { AutofillOverlayContentService } from "../services/autofill-overlay-content.service";
import { InlineMenuFieldQualificationService } from "../services/inline-menu-field-qualification.service";
import { setupAutofillInitDisconnectAction } from "../utils";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    const overlayPort = chrome.runtime.connect({ name: AutofillOverlayPort.ContentScript });
    const inlineMenuFieldQualificationService = new InlineMenuFieldQualificationService();
    const autofillOverlayContentService = new AutofillOverlayContentService(
      overlayPort,
      inlineMenuFieldQualificationService,
    );
    let autofillInlineMenuContentService: AutofillInlineMenuContentService;
    if (globalThis.self === globalThis.top) {
      autofillInlineMenuContentService = new AutofillInlineMenuContentService(overlayPort);
    }
    windowContext.bitwardenAutofillInit = new AutofillInit(
      autofillOverlayContentService,
      autofillInlineMenuContentService,
    );
    setupAutofillInitDisconnectAction(windowContext);

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
