(function (globalContext) {
  if (globalContext.document.contentType !== "text/html") {
    return;
  }

  void chrome.runtime.sendMessage({
    command: "triggerFido2ContentScriptsInjection",
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
})(window);
