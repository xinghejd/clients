import { OverlayNotificationsContentService } from "../overlay/notifications/content/overlay-notifications-content.service";
import { AutofillOverlayContentService } from "../services/autofill-overlay-content.service";
import { InlineMenuFieldQualificationService } from "../services/inline-menu-field-qualification.service";
import { setupAutofillInitDisconnectAction } from "../utils";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    const inlineMenuFieldQualificationService = new InlineMenuFieldQualificationService();
    const autofillOverlayContentService = new AutofillOverlayContentService(
      inlineMenuFieldQualificationService,
    );

    let overlayNotificationsContentService: OverlayNotificationsContentService;
    if (globalThis.self === globalThis.top) {
      overlayNotificationsContentService = new OverlayNotificationsContentService();
    }

    windowContext.bitwardenAutofillInit = new AutofillInit(
      autofillOverlayContentService,
      null,
      overlayNotificationsContentService,
    );
    setupAutofillInitDisconnectAction(windowContext);

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
