import { AnonAddyForwarder } from "./anon-addy-forwarder";
import { mockApiService, mockI18nService } from "./mocks.spec";

// here's where the tests start
describe("Addy.io Forwarder", () => {
  describe("constructor(ApiService, I18nService)", () => {
    it("looks up the service name from the i18nService", () => {
      const apiService = mockApiService(200, {});
      const i18nService = mockI18nService();

      const forwarder = new AnonAddyForwarder(apiService, i18nService);

      expect(forwarder.serviceName).toEqual("forwarder.serviceName.anonaddy");
    });
  });

  describe("generate(string | null, SelfHostedApiOptions & EmailDomainOptions)", () => {
    it.each([null, ""])("throws an error if the token is missing (token = %p)", async (token) => {
      const apiService = mockApiService(200, {});
      const i18nService = mockI18nService();

      const forwarder = new AnonAddyForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token,
            domain: "example.com",
            baseUrl: "https://api.example.com",
          })
      ).rejects.toEqual("forwarder.invalidToken");

      expect(apiService.nativeFetch).not.toHaveBeenCalled();
      expect(i18nService.t).toHaveBeenCalledWith(
        "forwarder.invalidToken",
        "forwarder.serviceName.anonaddy"
      );
    });

    it.each([null, ""])(
      "throws an error if the domain is missing (domain = %p)",
      async (domain) => {
        const apiService = mockApiService(200, {});
        const i18nService = mockI18nService();

        const forwarder = new AnonAddyForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain,
              baseUrl: "https://api.example.com",
            })
        ).rejects.toEqual("forwarder.noDomain");

        expect(apiService.nativeFetch).not.toHaveBeenCalled();
        expect(i18nService.t).toHaveBeenCalledWith(
          "forwarder.noDomain",
          "forwarder.serviceName.anonaddy"
        );
      }
    );

    it.each([null, ""])(
      "throws an error if the baseUrl is missing (baseUrl = %p)",
      async (baseUrl) => {
        const apiService = mockApiService(200, {});
        const i18nService = mockI18nService();

        const forwarder = new AnonAddyForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              baseUrl,
            })
        ).rejects.toEqual("forwarder.noUrl");

        expect(apiService.nativeFetch).not.toHaveBeenCalled();
        expect(i18nService.t).toHaveBeenCalledWith(
          "forwarder.noUrl",
          "forwarder.serviceName.anonaddy"
        );
      }
    );

    it.each([
      ["forwarder.generatedByWithWebsite", "provided", "bitwarden.com", "bitwarden.com"],
      ["forwarder.generatedByWithWebsite", "provided", "httpbin.org", "httpbin.org"],
      ["forwarder.generatedBy", "not provided", null, ""],
      ["forwarder.generatedBy", "not provided", "", ""],
    ])(
      "describes the website with %p when the website is %s (= %p)",
      async (translationKey, _ignored, website, expectedWebsite) => {
        const apiService = mockApiService(200, {});
        const i18nService = mockI18nService();

        const forwarder = new AnonAddyForwarder(apiService, i18nService);

        await forwarder.generate(website, {
          token: "token",
          domain: "example.com",
          baseUrl: "https://api.example.com",
        });

        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(2, translationKey, expectedWebsite);
      }
    );

    it.each([
      ["jane.doe@example.com", 201],
      ["john.doe@example.com", 201],
      ["jane.doe@example.com", 200],
      ["john.doe@example.com", 200],
    ])(
      "returns the generated email address (= %p) if the request is successful (status = %p)",
      async (email, status) => {
        const apiService = mockApiService(status, { data: { email } });
        const i18nService = mockI18nService();

        const forwarder = new AnonAddyForwarder(apiService, i18nService);

        const result = await forwarder.generate(null, {
          token: "token",
          domain: "example.com",
          baseUrl: "https://api.example.com",
        });

        expect(result).toEqual(email);
        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      }
    );

    it("throws an invalid token error if the request fails with a 401", async () => {
      const apiService = mockApiService(401, {});
      const i18nService = mockI18nService();

      const forwarder = new AnonAddyForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token: "token",
            domain: "example.com",
            baseUrl: "https://api.example.com",
          })
      ).rejects.toEqual("forwarder.invalidToken");

      expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
      expect(i18nService.t).toHaveBeenNthCalledWith(
        3,
        "forwarder.invalidToken",
        "forwarder.serviceName.anonaddy"
      );
    });

    it("throws an unknown error if the request fails and no status is provided", async () => {
      const apiService = mockApiService(500, {});
      const i18nService = mockI18nService();

      const forwarder = new AnonAddyForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token: "token",
            domain: "example.com",
            baseUrl: "https://api.example.com",
          })
      ).rejects.toEqual("forwarder.unknownError");

      expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
      expect(i18nService.t).toHaveBeenNthCalledWith(
        3,
        "forwarder.unknownError",
        "forwarder.serviceName.anonaddy"
      );
    });

    it.each([
      [100, "Continue"],
      [202, "Accepted"],
      [300, "Multiple Choices"],
      [418, "I'm a teapot"],
      [500, "Internal Server Error"],
      [600, "Unknown Status"],
    ])(
      "throws an error with the status text if the request returns any other status code (= %i) and a status (= %p) is provided",
      async (statusCode, statusText) => {
        const apiService = mockApiService(statusCode, {}, statusText);
        const i18nService = mockI18nService();

        const forwarder = new AnonAddyForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              baseUrl: "https://api.example.com",
            })
        ).rejects.toEqual("forwarder.error");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          3,
          "forwarder.error",
          "forwarder.serviceName.anonaddy",
          statusText
        );
      }
    );
  });
});
