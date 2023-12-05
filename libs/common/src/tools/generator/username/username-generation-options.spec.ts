import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";

import { ApiOptions, Forwarders } from "./email-forwarders";
import {
  getForwarderOptions,
  DefaultOptions,
  UsernameGeneratorOptions,
  encryptInPlace,
  decryptInPlace,
  MaybeLeakedOptions,
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
    service: Forwarders.Fastmail.id,
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

function mockEncryptService(): EncryptService {
  return {
    encrypt: jest
      .fn()
      .mockImplementation((plainText: string, _key: SymmetricCryptoKey) => plainText),
    decryptToUtf8: jest
      .fn()
      .mockImplementation((cryptoText: string, _key: SymmetricCryptoKey) => cryptoText),
  } as unknown as EncryptService;
}

describe("Username Generation Options", () => {
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

  describe("encryptInPlace", () => {
    it("should return without encrypting if a token was not supplied", async () => {
      const encryptService = mockEncryptService();

      // throws if modified, failing the test
      const options = Object.freeze({});
      await encryptInPlace(encryptService, null, options);

      expect(encryptService.encrypt).toBeCalledTimes(0);
    });

    it.each([
      ["a token", { token: "a token" }, `{"token":"a token"}${"0".repeat(493)}`, "a key"],
      [
        "a token and wasPlainText",
        { token: "a token", wasPlainText: true },
        `{"token":"a token","wasPlainText":true}${"0".repeat(473)}`,
        "another key",
      ],
      [
        "a really long token",
        { token: `a ${"really ".repeat(50)}long token` },
        `{"token":"a ${"really ".repeat(50)}long token"}${"0".repeat(138)}`,
        "a third key",
      ],
      [
        "a really long token and wasPlainText",
        { token: `a ${"really ".repeat(50)}long token`, wasPlainText: true },
        `{"token":"a ${"really ".repeat(50)}long token","wasPlainText":true}${"0".repeat(118)}`,
        "a key",
      ],
    ] as unknown as [string, ApiOptions & MaybeLeakedOptions, string, SymmetricCryptoKey][])(
      "encrypts %s and removes encrypted values",
      async (_description, options, encryptedToken, key) => {
        const encryptService = mockEncryptService();

        await encryptInPlace(encryptService, key, options);

        expect(options.encryptedToken).toEqual(encryptedToken);
        expect(options).not.toHaveProperty("token");
        expect(options).not.toHaveProperty("wasPlainText");

        // Why `encryptedToken`? The mock outputs its input without encryption.
        expect(encryptService.encrypt).toBeCalledWith(encryptedToken, key);
      },
    );
  });

  describe("decryptInPlace", () => {
    it("should return without decrypting if an encryptedToken was not supplied", async () => {
      const encryptService = mockEncryptService();

      // throws if modified, failing the test
      const options = Object.freeze({});
      await decryptInPlace(encryptService, null, options);

      expect(encryptService.decryptToUtf8).toBeCalledTimes(0);
    });

    it.each([
      ["a simple token", `{"token":"a token"}${"0".repeat(493)}`, { token: "a token" }, "a key"],
      [
        "a simple leaked token",
        `{"token":"a token","wasPlainText":true}${"0".repeat(473)}`,
        { token: "a token", wasPlainText: true },
        "another key",
      ],
      [
        "a long token",
        `{"token":"a ${"really ".repeat(50)}long token"}${"0".repeat(138)}`,
        { token: `a ${"really ".repeat(50)}long token` },
        "a third key",
      ],
      [
        "a long leaked token",
        `{"token":"a ${"really ".repeat(50)}long token","wasPlainText":true}${"0".repeat(118)}`,
        { token: `a ${"really ".repeat(50)}long token`, wasPlainText: true },
        "a key",
      ],
    ] as [string, string, ApiOptions & MaybeLeakedOptions, string][])(
      "decrypts %s and removes encrypted values",
      async (description, encryptedTokenString, options, keyString) => {
        const encryptService = mockEncryptService();

        // cast through unknown to avoid type errors; the mock doesn't need the real types
        // since it just outputs its input
        const key = keyString as unknown as SymmetricCryptoKey;
        const encryptedToken = encryptedTokenString as unknown as EncString;

        await decryptInPlace(encryptService, key, { encryptedToken });

        expect(options.token).toEqual(options.token);
        expect(options.wasPlainText).toEqual(options.wasPlainText);
        expect(options).not.toHaveProperty("encryptedToken");

        // Why `encryptedToken`? The mock outputs its input without encryption.
        expect(encryptService.decryptToUtf8).toBeCalledWith(encryptedToken, key);
      },
    );

    it.each([
      ["invalid length", "invalid length", "invalid"],
      ["all padding", "missing json object", `${"0".repeat(512)}`],
      ["only closing brace", "invalid json", `}${"0".repeat(511)}`],
      ["token is NaN", "invalid json", `{"token":NaN}${"0".repeat(499)}`],
      ["only unknown key", "unknown keys", `{"unknown":"key"}${"0".repeat(495)}`],
      ["unknown key", "unknown keys", `{"token":"some token","unknown":"key"}${"0".repeat(474)}`],
      [
        "unknown key with wasPlainText",
        "unknown keys",
        `{"token":"some token","wasPlainText":true,"unknown":"key"}${"0".repeat(454)}`,
      ],
      ["empty json object", "invalid token", `{}${"0".repeat(510)}`],
      ["token is a number", "invalid token", `{"token":5}${"0".repeat(501)}`],
      [
        "wasPlainText is false",
        "invalid wasPlainText",
        `{"token":"foo","wasPlainText":false}${"0".repeat(476)}`,
      ],
      [
        "wasPlainText is string",
        "invalid wasPlainText",
        `{"token":"foo","wasPlainText":"fal"}${"0".repeat(476)}`,
      ],
    ])(
      "should delete untrusted encrypted values (description %s, reason: %s) ",
      async (description, expectedReason, encryptedToken) => {
        const encryptService = mockEncryptService();

        // cast through unknown to avoid type errors; the mock doesn't need the real types
        // since it just outputs its input
        const key: SymmetricCryptoKey = "a key" as unknown as SymmetricCryptoKey;
        const options = { encryptedToken: encryptedToken as unknown as EncString };

        const reason = await decryptInPlace(encryptService, key, options);

        expect(options).not.toHaveProperty("encryptedToken");
        expect(reason).toEqual(expectedReason);
      },
    );
  });
});
