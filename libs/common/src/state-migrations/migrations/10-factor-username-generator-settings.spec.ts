import {
  convertAccountInPlace,
  AccountType,
  NewGenerationOptions,
} from "./10-factor-username-generator-settings";

describe("convertAccountInPlace", () => {
  it.each([null, { settings: null }, { settings: { usernameGenerationOptions: null } }])(
    "should return nothing if the settings are empty (= %p)",
    (account) => {
      const result = convertAccountInPlace(account);
      expect(result).toBeUndefined();
    },
  );

  it("should return nothing if the settings are already converted (= %p)", () => {
    // freeze ensures no changes are made to the object
    const account = {
      settings: {
        usernameGenerationOptions: Object.freeze({
          type: "word",
          website: "",
          word: Object.freeze({
            capitalize: true,
            includeNumber: true,
          }),
          subaddress: Object.freeze({
            algorithm: "random",
            email: "",
          }),
          catchall: Object.freeze({
            algorithm: "random",
            domain: "",
          }),
          forwarders: Object.freeze({
            service: "fastmail",
            fastMail: Object.freeze({
              domain: "",
              prefix: "",
              token: "",
            }),
            addyIo: Object.freeze({
              baseUrl: "https://app.addy.io",
              domain: "",
              token: "",
            }),
            forwardEmail: Object.freeze({
              token: "",
              domain: "",
            }),
            simpleLogin: Object.freeze({
              baseUrl: "https://app.simplelogin.io",
              token: "",
            }),
            duckDuckGo: Object.freeze({
              token: "",
            }),
            firefoxRelay: Object.freeze({
              token: "",
            }),
          }),
        }),
      },
    };

    const result = convertAccountInPlace(account);

    expect(result).toBeUndefined();
  });

  it.each([
    { type: "word", website: "example.com" },
    { type: "subaddress", website: "httpbin.org" },
  ] as {
    type: "word" | "subaddress";
    website: string;
  }[])("should map root settings (= %p)", (usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.type).toEqual(usernameGenerationOptions.type);
    expect(newOptions.website).toEqual(usernameGenerationOptions.website);
    expect(newOptions.saveOnLoad).toEqual(true);
  });

  it.each([
    { wordCapitalize: true, wordIncludeNumber: true },
    { wordCapitalize: false, wordIncludeNumber: false },
    { wordCapitalize: true, wordIncludeNumber: false },
    { wordCapitalize: false, wordIncludeNumber: true },
  ] as {
    wordCapitalize?: boolean;
    wordIncludeNumber?: boolean;
  }[])("should map word settings (= %p)", (usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.word.capitalize).toEqual(usernameGenerationOptions.wordCapitalize);
    expect(newOptions.word.includeNumber).toEqual(usernameGenerationOptions.wordIncludeNumber);
  });

  it.each([
    ["random", { subaddressType: "random", subaddressEmail: "example.com" }],
    ["website-name", { subaddressType: "website-name", subaddressEmail: "httpbin.org" }],
  ] as [
    string,
    {
      subaddressType?: "random" | "website-name";
      subaddressEmail?: string;
    },
  ][])("should map subaddress settings (= %p)", (_description, usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.subaddress.algorithm).toEqual(usernameGenerationOptions.subaddressType);
    expect(newOptions.subaddress.email).toEqual(usernameGenerationOptions.subaddressEmail);
  });

  it.each([
    ["random", { catchallType: "random", catchallDomain: "example.com" }],
    ["website-name", { catchallType: "website-name", catchallDomain: "httpbin.org" }],
  ] as [
    string,
    {
      catchallType?: "random" | "website-name";
      catchallDomain?: string;
    },
  ][])("should map catchall settings (= %p)", (_description, usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.catchall.algorithm).toEqual(usernameGenerationOptions.catchallType);
    expect(newOptions.catchall.domain).toEqual(usernameGenerationOptions.catchallDomain);
  });

  it.each(["fastmail", "anonaddy", "forwardemail", "simplelogin", "duckduckgo", "firefoxrelay"])(
    "should map forwarder service settings (= %s)",
    (forwardedService) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions: {
            forwardedService,
          },
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.service).toEqual(forwardedService);
    },
  );

  it.each(["mitmuremail", "invalidforwarder"])(
    "should drop invalid forwarder service settings (= %s)",
    (forwardedService) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions: {
            forwardedService,
          },
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.service).toEqual("fastmail");
    },
  );

  it.each([
    [
      "example",
      {
        forwardedAnonAddyApiToken: "",
        forwardedAnonAddyDomain: "www.example.com",
        forwardedAnonAddyBaseUrl: "https://www.httpbin.org/post/",
      },
    ],
    [
      "httpbin",
      {
        forwardedAnonAddyApiToken: "",
        forwardedAnonAddyDomain: "www.httpbin.org",
        forwardedAnonAddyBaseUrl: "https://www.example.com/whatever/",
      },
    ],
  ] as [
    string,
    {
      forwardedAnonAddyApiToken?: string;
      forwardedAnonAddyDomain?: string;
      forwardedAnonAddyBaseUrl?: string;
    },
  ][])(
    "should map addyIo '%s' settings without a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.addyIo.baseUrl).toEqual(
        usernameGenerationOptions.forwardedAnonAddyBaseUrl,
      );
      expect(newOptions.forwarders.addyIo.domain).toEqual(
        usernameGenerationOptions.forwardedAnonAddyDomain,
      );
      expect(newOptions.forwarders.addyIo.token).toEqual(
        usernameGenerationOptions.forwardedAnonAddyApiToken,
      );
      expect(newOptions.forwarders.addyIo.wasPlainText).not.toBeDefined();
    },
  );

  it.each([
    [
      "example",
      {
        forwardedAnonAddyApiToken: "some token",
        forwardedAnonAddyDomain: "www.example.com",
        forwardedAnonAddyBaseUrl: "https://www.httpbin.org/post/",
      },
    ],
    [
      "httpbin",
      {
        forwardedAnonAddyApiToken: "some other token",
        forwardedAnonAddyDomain: "www.httpbin.org",
        forwardedAnonAddyBaseUrl: "https://www.example.com/whatever/",
      },
    ],
  ] as [
    string,
    {
      forwardedAnonAddyApiToken?: string;
      forwardedAnonAddyDomain?: string;
      forwardedAnonAddyBaseUrl?: string;
    },
  ][])(
    "should map addyIo settings with a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.addyIo.baseUrl).toEqual(
        usernameGenerationOptions.forwardedAnonAddyBaseUrl,
      );
      expect(newOptions.forwarders.addyIo.domain).toEqual(
        usernameGenerationOptions.forwardedAnonAddyDomain,
      );
      expect(newOptions.forwarders.addyIo.token).toEqual(
        usernameGenerationOptions.forwardedAnonAddyApiToken,
      );
      expect(newOptions.forwarders.addyIo.wasPlainText).toEqual(true);
    },
  );

  it.each([
    [
      "example",
      { forwardedForwardEmailApiToken: "", forwardedForwardEmailDomain: "www.example.com" },
    ],
    [
      "httpbin",
      { forwardedForwardEmailApiToken: "", forwardedForwardEmailDomain: "www.httpbin.org" },
    ],
  ] as [
    string,
    {
      forwardedForwardEmailApiToken?: string;
      forwardedForwardEmailDomain?: string;
    },
  ][])(
    "should map forwardEmail settings without a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.forwardEmail.domain).toEqual(
        usernameGenerationOptions.forwardedForwardEmailDomain,
      );
      expect(newOptions.forwarders.forwardEmail.token).toEqual(
        usernameGenerationOptions.forwardedForwardEmailApiToken,
      );
      expect(newOptions.forwarders.forwardEmail.wasPlainText).not.toBeDefined();
    },
  );

  it.each([
    [
      "example",
      {
        forwardedForwardEmailApiToken: "some token",
        forwardedForwardEmailDomain: "www.example.com",
      },
    ],
    [
      "httpbin",
      {
        forwardedForwardEmailApiToken: "some other token",
        forwardedForwardEmailDomain: "www.httpbin.org",
      },
    ],
  ] as [
    string,
    {
      forwardedForwardEmailApiToken?: string;
      forwardedForwardEmailDomain?: string;
    },
  ][])(
    "should map forwardEmail settings with a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.forwardEmail.domain).toEqual(
        usernameGenerationOptions.forwardedForwardEmailDomain,
      );
      expect(newOptions.forwarders.forwardEmail.token).toEqual(
        usernameGenerationOptions.forwardedForwardEmailApiToken,
      );
      expect(newOptions.forwarders.forwardEmail.wasPlainText).toEqual(true);
    },
  );

  it.each([
    [
      "example",
      {
        forwardedSimpleLoginApiKey: "",
        forwardedSimpleLoginBaseUrl: "https://www.httpbin.org/post/",
      },
    ],
    [
      "httpbin",
      {
        forwardedSimpleLoginApiKey: "",
        forwardedSimpleLoginBaseUrl: "https://www.example.com/whatever/",
      },
    ],
  ] as [
    string,
    {
      forwardedSimpleLoginApiKey?: string;
      forwardedSimpleLoginBaseUrl?: string;
    },
  ][])(
    "should map simpleLogin settings without a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.simpleLogin.baseUrl).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginBaseUrl,
      );
      expect(newOptions.forwarders.simpleLogin.token).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginApiKey,
      );
      expect(newOptions.forwarders.simpleLogin.wasPlainText).not.toBeDefined();
    },
  );

  it.each([
    [
      "example",
      {
        forwardedSimpleLoginApiKey: "some token",
        forwardedSimpleLoginBaseUrl: "https://www.httpbin.org/post/",
      },
    ],
    [
      "httpbin",
      {
        forwardedSimpleLoginApiKey: "some other token",
        forwardedSimpleLoginBaseUrl: "https://www.example.com/whatever/",
      },
    ],
  ] as [
    string,
    {
      forwardedSimpleLoginApiKey?: string;
      forwardedSimpleLoginBaseUrl?: string;
    },
  ][])(
    "should map simpleLogin settings with a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: AccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const {
        settings: { usernameGenerationOptions: options },
      } = convertAccountInPlace(account);
      const newOptions = options as NewGenerationOptions;

      expect(newOptions.forwarders.simpleLogin.baseUrl).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginBaseUrl,
      );
      expect(newOptions.forwarders.simpleLogin.token).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginApiKey,
      );
      expect(newOptions.forwarders.simpleLogin.wasPlainText).toEqual(true);
    },
  );

  it("should map duckDuckGo settings without a token", () => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions: { forwardedDuckDuckGoToken: "" },
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.forwarders.duckDuckGo.wasPlainText).not.toBeDefined();
  });

  it.each([
    { forwardedDuckDuckGoToken: "some token" },
    { forwardedDuckDuckGoToken: "some other token" },
  ] as {
    forwardedDuckDuckGoToken?: string;
  }[])("should map duckDuckGo settings with a token (= %p)", (usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.forwarders.duckDuckGo.token).toEqual(
      usernameGenerationOptions.forwardedDuckDuckGoToken,
    );
    expect(newOptions.forwarders.duckDuckGo.wasPlainText).toEqual(true);
  });

  it("should map firefoxRelay settings without a token", () => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions: { forwardedFirefoxApiToken: "" },
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.forwarders.firefoxRelay.wasPlainText).not.toBeDefined();
  });

  it.each([
    { forwardedFirefoxApiToken: "some token" },
    { forwardedFirefoxApiToken: "some other token" },
  ] as {
    forwardedFirefoxApiToken?: string;
  }[])("should map firefoxRelay settings with a token (= %p)", (usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.forwarders.firefoxRelay.token).toEqual(
      usernameGenerationOptions.forwardedFirefoxApiToken,
    );
    expect(newOptions.forwarders.firefoxRelay.wasPlainText).toEqual(true);
  });

  it("should map fastMail settings without a token", () => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions: { forwardedFastmailApiToken: "" },
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.forwarders.fastMail.prefix).toEqual("");
    expect(newOptions.forwarders.fastMail.wasPlainText).not.toBeDefined();
  });

  it.each([
    { forwardedFastmailApiToken: "some token" },
    { forwardedFastmailApiToken: "some other token" },
  ] as {
    forwardedFastmailApiToken?: string;
  }[])("should map fastMail settings with a token (= %p)", (usernameGenerationOptions) => {
    const account: AccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const {
      settings: { usernameGenerationOptions: options },
    } = convertAccountInPlace(account);
    const newOptions = options as NewGenerationOptions;

    expect(newOptions.forwarders.fastMail.prefix).toEqual("");
    expect(newOptions.forwarders.fastMail.token).toEqual(
      usernameGenerationOptions.forwardedFastmailApiToken,
    );
    expect(newOptions.forwarders.fastMail.wasPlainText).toEqual(true);
  });
});
