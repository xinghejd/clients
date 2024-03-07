/**
 * This script handles injection of the FIDO2 override page script into the document.
 * This is required for manifest v2, but will be removed when we migrate fully to manifest v3.
 */
(function (globalContext) {
  if (globalContext.document.contentType !== "text/html") {
    return;
  }

  const script = globalContext.document.createElement("script");
  script.src = chrome.runtime.getURL("content/fido2/page-script.js");
  (globalContext.document.head || globalContext.document.documentElement).appendChild(script);
  script.addEventListener("load", () => script.remove());
})(globalThis);
