import AutofillInit from "./autofill-init";

(function (windowContext) {
  if (!windowContext.bitwardenAutofillInit) {
    windowContext.bitwardenAutofillInit = new AutofillInit();

    const port = chrome.runtime.connect({ name: "autofill" });
    port.onDisconnect.addListener(() => {
      windowContext.bitwardenAutofillInit.destroy();
      delete windowContext.bitwardenAutofillInit;
    });

    windowContext.bitwardenAutofillInit.init();
  }
})(window);
