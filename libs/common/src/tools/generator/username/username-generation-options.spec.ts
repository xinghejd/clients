import {
  getForwarderOptions,
  ForwarderIds,
  DefaultOptions,
  UsernameGeneratorOptions,
} from "./username-generation-options";

const TestOptions: UsernameGeneratorOptions = {
  type: "word",
  website: "example.com",
  word: {
    capitalize: true,
    includeNumber: true,
  },
  subaddress: {
    algorithm: "random",
    email: "foo@example.com",
  },
  catchall: {
    algorithm: "random",
    domain: "example.com",
  },
  forwarders: {
    service: ForwarderIds.FastMail,
    fastMail: {
      domain: "httpbin.com",
      prefix: "foo",
      token: "some-token",
    },
    addyIo: {
      baseUrl: "https://app.addy.io",
      domain: "example.com",
      token: "some-token",
    },
    forwardEmail: {
      token: "some-token",
      domain: "example.com",
    },
    simpleLogin: {
      baseUrl: "https://app.simplelogin.io",
      token: "some-token",
    },
    duckDuckGo: {
      token: "some-token",
    },
    firefoxRelay: {
      token: "some-token",
    },
  },
};

describe("createForwarder", () => {
  it("should return null for unsupported services", () => {
    expect(getForwarderOptions("unsupported", DefaultOptions)).toBeNull();
  });

  let options: UsernameGeneratorOptions = null;
  beforeEach(() => {
    options = structuredClone(TestOptions);
  });

  it.each([
    [TestOptions.forwarders.addyIo, "anonaddy"],
    [TestOptions.forwarders.duckDuckGo, "duckduckgo"],
    [TestOptions.forwarders.fastMail, "fastmail"],
    [TestOptions.forwarders.firefoxRelay, "firefoxrelay"],
    [TestOptions.forwarders.forwardEmail, "forwardemail"],
    [TestOptions.forwarders.simpleLogin, "simplelogin"],
  ])("should return an %s for %p", (forwarderOptions, service) => {
    const forwarder = getForwarderOptions(service, options);
    expect(forwarder).toEqual(forwarderOptions);
  });
});
