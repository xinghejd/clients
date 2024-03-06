(function () {
  void chrome.runtime.sendMessage({
    command: "triggerFido2ContentScriptInjection",
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
})();
