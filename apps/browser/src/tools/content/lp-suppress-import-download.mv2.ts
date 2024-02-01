(function (globalContext) {
  const script = globalContext.document.createElement("script");
  script.src = chrome.runtime.getURL("content/lp-suppress-import-download.js");
  globalContext.document.documentElement.appendChild(script);
})(window);
