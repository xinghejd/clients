describe("triggerFido2ContentScriptsInjection", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("init", () => {
    it("sends a message to the extension background", () => {
      require("../content/trigger-fido2-content-script-injection");

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        command: "triggerFido2ContentScriptsInjection",
        hostname: window.location.hostname,
        origin: window.location.origin,
      });
    });
  });
});
