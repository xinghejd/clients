import { ForwardEmailForwarder } from "./forward-email-forwarder";
import { mockApiService, mockI18nService } from "./mocks.spec";

describe("ForwardEmail Forwarder", () => {
  describe("constructor(ApiService, I18nService)", () => {
    it("looks up the service name from the i18nService", () => {
      const apiService = mockApiService(200, {});
      const i18nService = mockI18nService();

      const forwarder = new ForwardEmailForwarder(apiService, i18nService);

      expect(forwarder.serviceName).toEqual("forwarder.serviceName.forwardemail");
    });
  });

  describe("generate(string | null, SelfHostedApiOptions & EmailDomainOptions)", () => {
    it.each([null, ""])("throws an error if the token is missing (token = %p)", async (token) => {
      const apiService = mockApiService(200, {});
      const i18nService = mockI18nService();

      const forwarder = new ForwardEmailForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token,
            domain: "example.com",
          })
      ).rejects.toEqual("forwaderInvalidToken");

      expect(apiService.nativeFetch).not.toHaveBeenCalled();
      expect(i18nService.t).toHaveBeenCalledWith(
        "forwaderInvalidToken",
        "forwarder.serviceName.forwardemail"
      );
    });

    it.each([null, ""])(
      "throws an error if the domain is missing (domain = %p)",
      async (domain) => {
        const apiService = mockApiService(200, {});
        const i18nService = mockI18nService();

        const forwarder = new ForwardEmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain,
            })
        ).rejects.toEqual("forwarderNoDomain");

        expect(apiService.nativeFetch).not.toHaveBeenCalled();
        expect(i18nService.t).toHaveBeenCalledWith(
          "forwarderNoDomain",
          "forwarder.serviceName.forwardemail"
        );
      }
    );

    it.each([
      ["forwarderGeneratedByWithWebsite", "provided", "bitwarden.com", "bitwarden.com"],
      ["forwarderGeneratedByWithWebsite", "provided", "httpbin.org", "httpbin.org"],
      ["forwarderGeneratedBy", "not provided", null, ""],
      ["forwarderGeneratedBy", "not provided", "", ""],
    ])(
      "describes the website with %p when the website is %s (= %p)",
      async (translationKey, _ignored, website, expectedWebsite) => {
        const apiService = mockApiService(200, {});
        const i18nService = mockI18nService();

        const forwarder = new ForwardEmailForwarder(apiService, i18nService);

        await forwarder.generate(website, {
          token: "token",
          domain: "example.com",
        });

        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(2, translationKey, expectedWebsite);
      }
    );

    it.each([
      ["jane.doe@example.com", 201, { name: "jane.doe", domain: { name: "example.com" } }],
      ["jane.doe@example.com", 201, { name: "jane.doe" }],
      ["john.doe@example.com", 201, { name: "john.doe", domain: { name: "example.com" } }],
      ["john.doe@example.com", 201, { name: "john.doe" }],
      ["jane.doe@example.com", 200, { name: "jane.doe", domain: { name: "example.com" } }],
      ["jane.doe@example.com", 200, { name: "jane.doe" }],
      ["john.doe@example.com", 200, { name: "john.doe", domain: { name: "example.com" } }],
      ["john.doe@example.com", 200, { name: "john.doe" }],
    ])(
      "returns the generated email address (= %p) if the request is successful (status = %p)",
      async (email, status, response) => {
        const apiService = mockApiService(status, response);
        const i18nService = mockI18nService();

        const forwarder = new ForwardEmailForwarder(apiService, i18nService);

        const result = await forwarder.generate(null, {
          token: "token",
          domain: "example.com",
        });

        expect(result).toEqual(email);
        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      }
    );

    it("throws an invalid token error if the request fails with a 401", async () => {
      const apiService = mockApiService(401, {});
      const i18nService = mockI18nService();

      const forwarder = new ForwardEmailForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token: "token",
            domain: "example.com",
          })
      ).rejects.toEqual("forwaderInvalidToken");

      expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
      expect(i18nService.t).toHaveBeenNthCalledWith(
        3,
        "forwaderInvalidToken",
        "forwarder.serviceName.forwardemail"
      );
    });

    it("throws an unknown error if the request fails and no status is provided", async () => {
      const apiService = mockApiService(500, {});
      const i18nService = mockI18nService();

      const forwarder = new ForwardEmailForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token: "token",
            domain: "example.com",
          })
      ).rejects.toEqual("forwarderUnknownError");

      expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
      expect(i18nService.t).toHaveBeenNthCalledWith(
        3,
        "forwarderUnknownError",
        "forwarder.serviceName.forwardemail"
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
      async (statusCode, message) => {
        const apiService = mockApiService(statusCode, { message });
        const i18nService = mockI18nService();

        const forwarder = new ForwardEmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
            })
        ).rejects.toEqual("forwarderError");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          3,
          "forwarderError",
          "forwarder.serviceName.forwardemail",
          message
        );
      }
    );

    it.each([
      [100, "Continue"],
      [202, "Accepted"],
      [300, "Multiple Choices"],
      [418, "I'm a teapot"],
      [500, "Internal Server Error"],
      [600, "Unknown Status"],
    ])(
      "throws an error with the status text if the request returns any other status code (= %i) and a status (= %p) is provided",
      async (statusCode, error) => {
        const apiService = mockApiService(statusCode, { error });
        const i18nService = mockI18nService();

        const forwarder = new ForwardEmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
            })
        ).rejects.toEqual("forwarderError");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          3,
          "forwarderError",
          "forwarder.serviceName.forwardemail",
          error
        );
      }
    );
  });
});
