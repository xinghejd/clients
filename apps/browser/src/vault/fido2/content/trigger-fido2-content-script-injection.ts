(function () {
  void chrome.runtime.sendMessage({
    command: "triggerFido2ContentScriptsInjection",
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
})();
