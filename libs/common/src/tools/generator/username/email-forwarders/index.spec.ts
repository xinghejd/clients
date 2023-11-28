import { AnonAddyForwarder } from "./anon-addy-forwarder";
import { DuckDuckGoForwarder } from "./duck-duck-go-forwarder";
import { FastmailForwarder } from "./fastmail-forwarder";
import { FirefoxRelayForwarder } from "./firefox-relay-forwarder";
import { ForwardEmailForwarder } from "./forward-email-forwarder";
import { mockApiService, mockI18nService } from "./mocks.spec";
import { SimpleLoginForwarder } from "./simple-login-forwarder";

import { createForwarder } from ".";

describe("createForwarder", () => {
  it("should return null for unsupported services", () => {
    expect(createForwarder("unsupported", null, null)).toBeNull();
  });

  it.each([
    [AnonAddyForwarder, "anonaddy"],
    [DuckDuckGoForwarder, "duckduckgo"],
    [FastmailForwarder, "fastmail"],
    [FirefoxRelayForwarder, "firefoxrelay"],
    [ForwardEmailForwarder, "forwardemail"],
    [SimpleLoginForwarder, "simplelogin"],
  ])("should return an %s for %p", (type, service) => {
    const apiService = mockApiService(200, {});
    const i18nService = mockI18nService();

    const forwarder = createForwarder(service, apiService, i18nService);
    expect(forwarder).toBeInstanceOf(type);
  });
});
