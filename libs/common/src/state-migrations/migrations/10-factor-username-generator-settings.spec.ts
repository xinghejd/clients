import { mapAccount, LegacyAccountType } from "./10-factor-username-generator-settings";

describe("mapAccount", () => {
  it.each([null, { settings: null }, { settings: { usernameGenerationOptions: null } }])(
    "should return nothing if the settings are empty (= %p)",
    (account) => {
      expect(mapAccount(account)).toBeUndefined();
    }
  );

  it.each([
    { type: "word", website: "example.com" },
    { type: "subaddress", website: "httpbin.org" },
  ] as {
    type: "word" | "subaddress";
    website: string;
  }[])("should map root settings (= %p)", (usernameGenerationOptions) => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.type).toEqual(usernameGenerationOptions.type);
    expect(result.settings.usernameGenerationOptions.website).toEqual(
      usernameGenerationOptions.website
    );
    expect(result.settings.usernameGenerationOptions.saveOnLoad).toEqual(true);
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
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.word.capitalize).toEqual(
      usernameGenerationOptions.wordCapitalize
    );
    expect(result.settings.usernameGenerationOptions.word.includeNumber).toEqual(
      usernameGenerationOptions.wordIncludeNumber
    );
  });

  it.each([
    ["random", { subaddressType: "random", subaddressEmail: "example.com" }],
    ["website-name", { subaddressType: "website-name", subaddressEmail: "httpbin.org" }],
  ] as [
    string,
    {
      subaddressType?: "random" | "website-name";
      subaddressEmail?: string;
    }
  ][])("should map subaddress settings (= %p)", (_description, usernameGenerationOptions) => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.subaddress.algorithm).toEqual(
      usernameGenerationOptions.subaddressType
    );
    expect(result.settings.usernameGenerationOptions.subaddress.email).toEqual(
      usernameGenerationOptions.subaddressEmail
    );
  });

  it.each([
    ["random", { catchallType: "random", catchallDomain: "example.com" }],
    ["website-name", { catchallType: "website-name", catchallDomain: "httpbin.org" }],
  ] as [
    string,
    {
      catchallType?: "random" | "website-name";
      catchallDomain?: string;
    }
  ][])("should map catchall settings (= %p)", (_description, usernameGenerationOptions) => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.catchall.algorithm).toEqual(
      usernameGenerationOptions.catchallType
    );
    expect(result.settings.usernameGenerationOptions.catchall.domain).toEqual(
      usernameGenerationOptions.catchallDomain
    );
  });

  it.each(["fastmail", "anonaddy", "forwardemail", "simplelogin", "duckduckgo", "firefoxrelay"])(
    "should map forwarder service settings (= %s)",
    (forwardedService) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions: {
            forwardedService,
          },
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.service).toEqual(
        forwardedService
      );
    }
  );

  it.each(["mitmuremail", "invalidforwarder"])(
    "should drop invalid forwarder service settings (= %s)",
    (forwardedService) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions: {
            forwardedService,
          },
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.service).toEqual("fastmail");
    }
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
    }
  ][])(
    "should map addyIo '%s' settings without a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.baseUrl).toEqual(
        usernameGenerationOptions.forwardedAnonAddyBaseUrl
      );
      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.domain).toEqual(
        usernameGenerationOptions.forwardedAnonAddyDomain
      );
      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.token).toEqual(
        usernameGenerationOptions.forwardedAnonAddyApiToken
      );
      expect(
        result.settings.usernameGenerationOptions.forwarders.addyIo.wasPlainText
      ).not.toBeDefined();
    }
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
    }
  ][])(
    "should map addyIo settings with a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.baseUrl).toEqual(
        usernameGenerationOptions.forwardedAnonAddyBaseUrl
      );
      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.domain).toEqual(
        usernameGenerationOptions.forwardedAnonAddyDomain
      );
      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.token).toEqual(
        usernameGenerationOptions.forwardedAnonAddyApiToken
      );
      expect(result.settings.usernameGenerationOptions.forwarders.addyIo.wasPlainText).toEqual(
        true
      );
    }
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
    }
  ][])(
    "should map forwardEmail settings without a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.forwardEmail.domain).toEqual(
        usernameGenerationOptions.forwardedForwardEmailDomain
      );
      expect(result.settings.usernameGenerationOptions.forwarders.forwardEmail.token).toEqual(
        usernameGenerationOptions.forwardedForwardEmailApiToken
      );
      expect(
        result.settings.usernameGenerationOptions.forwarders.forwardEmail.wasPlainText
      ).not.toBeDefined();
    }
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
    }
  ][])(
    "should map forwardEmail settings with a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.forwardEmail.domain).toEqual(
        usernameGenerationOptions.forwardedForwardEmailDomain
      );
      expect(result.settings.usernameGenerationOptions.forwarders.forwardEmail.token).toEqual(
        usernameGenerationOptions.forwardedForwardEmailApiToken
      );
      expect(
        result.settings.usernameGenerationOptions.forwarders.forwardEmail.wasPlainText
      ).toEqual(true);
    }
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
    }
  ][])(
    "should map simpleLogin settings without a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.simpleLogin.baseUrl).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginBaseUrl
      );
      expect(result.settings.usernameGenerationOptions.forwarders.simpleLogin.token).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginApiKey
      );
      expect(
        result.settings.usernameGenerationOptions.forwarders.simpleLogin.wasPlainText
      ).not.toBeDefined();
    }
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
    }
  ][])(
    "should map simpleLogin settings with a token (= %s)",
    (_description, usernameGenerationOptions) => {
      const account: LegacyAccountType = {
        settings: {
          usernameGenerationOptions,
        },
      };

      const result = mapAccount(account);

      expect(result.settings.usernameGenerationOptions.forwarders.simpleLogin.baseUrl).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginBaseUrl
      );
      expect(result.settings.usernameGenerationOptions.forwarders.simpleLogin.token).toEqual(
        usernameGenerationOptions.forwardedSimpleLoginApiKey
      );
      expect(result.settings.usernameGenerationOptions.forwarders.simpleLogin.wasPlainText).toEqual(
        true
      );
    }
  );

  it("should map duckDuckGo settings without a token", () => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions: { forwardedDuckDuckGoToken: "" },
      },
    };

    const result = mapAccount(account);

    expect(
      result.settings.usernameGenerationOptions.forwarders.duckDuckGo.wasPlainText
    ).not.toBeDefined();
  });

  it.each([
    { forwardedDuckDuckGoToken: "some token" },
    { forwardedDuckDuckGoToken: "some other token" },
  ] as {
    forwardedDuckDuckGoToken?: string;
  }[])("should map duckDuckGo settings with a token (= %p)", (usernameGenerationOptions) => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.forwarders.duckDuckGo.token).toEqual(
      usernameGenerationOptions.forwardedDuckDuckGoToken
    );
    expect(result.settings.usernameGenerationOptions.forwarders.duckDuckGo.wasPlainText).toEqual(
      true
    );
  });

  it("should map firefoxRelay settings without a token", () => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions: { forwardedFirefoxApiToken: "" },
      },
    };

    const result = mapAccount(account);

    expect(
      result.settings.usernameGenerationOptions.forwarders.firefoxRelay.wasPlainText
    ).not.toBeDefined();
  });

  it.each([
    { forwardedFirefoxApiToken: "some token" },
    { forwardedFirefoxApiToken: "some other token" },
  ] as {
    forwardedFirefoxApiToken?: string;
  }[])("should map firefoxRelay settings with a token (= %p)", (usernameGenerationOptions) => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.forwarders.firefoxRelay.token).toEqual(
      usernameGenerationOptions.forwardedFirefoxApiToken
    );
    expect(result.settings.usernameGenerationOptions.forwarders.firefoxRelay.wasPlainText).toEqual(
      true
    );
  });

  it("should map fastMail settings without a token", () => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions: { forwardedFastmailApiToken: "" },
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.forwarders.fastMail.prefix).toEqual("");
    expect(
      result.settings.usernameGenerationOptions.forwarders.fastMail.wasPlainText
    ).not.toBeDefined();
  });

  it.each([
    { forwardedFastmailApiToken: "some token" },
    { forwardedFastmailApiToken: "some other token" },
  ] as {
    forwardedFastmailApiToken?: string;
  }[])("should map fastMail settings with a token (= %p)", (usernameGenerationOptions) => {
    const account: LegacyAccountType = {
      settings: {
        usernameGenerationOptions,
      },
    };

    const result = mapAccount(account);

    expect(result.settings.usernameGenerationOptions.forwarders.fastMail.prefix).toEqual("");
    expect(result.settings.usernameGenerationOptions.forwarders.fastMail.token).toEqual(
      usernameGenerationOptions.forwardedFastmailApiToken
    );
    expect(result.settings.usernameGenerationOptions.forwarders.fastMail.wasPlainText).toEqual(
      true
    );
  });
});
