import { AutofillOverlayElement } from "../../../../enums/autofill-overlay.enum";

import AutofillOverlayButton from "./autofill-overlay-button.deprecated";

require("./button.scss");

(function () {
  globalThis.customElements.define(AutofillOverlayElement.Button, AutofillOverlayButton);
})();
