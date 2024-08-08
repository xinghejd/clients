import { OverlayNotificationsContentService } from "../overlay/notifications/content/overlay-notifications-content.service";
import { AutofillOverlayContentService } from "../services/autofill-overlay-content.service";
import { InlineMenuFieldQualificationService } from "../services/inline-menu-field-qualification.service";
import { setupAutofillInitDisconnectAction } from "../utils";

import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    const inlineMenuFieldQualificationService = new InlineMenuFieldQualificationService();
    const overlayNotificationsContentService = new OverlayNotificationsContentService();
    const autofillOverlayContentService = new AutofillOverlayContentService(
      inlineMenuFieldQualificationService,
      overlayNotificationsContentService,
    );

    windowContext.bitwardenAutofillInit = new AutofillInit(autofillOverlayContentService);
    setupAutofillInitDisconnectAction(windowContext);

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
