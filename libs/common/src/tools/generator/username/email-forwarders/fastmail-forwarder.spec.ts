import { ApiService } from "../../../../abstractions/api.service";

import { FastmailForwarder } from "./fastmail-forwarder";
import { mockI18nService } from "./mocks.spec";

type MockResponse = { status: number; body: any };

// fastmail calls nativeFetch first to resolve the accountId,
// then it calls nativeFetch again to create the forwarding address.
// The common mock doesn't work here, because we need to return different responses
function mockApiService(accountId: MockResponse, forwardingAddress: MockResponse) {
  function response(r: MockResponse) {
    return {
      status: r.status,
      json: jest.fn().mockImplementation(() => Promise.resolve(r.body)),
    };
  }

  return {
    nativeFetch: jest
      .fn()
      .mockImplementationOnce((r: Request) => response(accountId))
      .mockImplementationOnce((r: Request) => response(forwardingAddress)),
  } as unknown as ApiService;
}

const EmptyResponse: MockResponse = Object.freeze({
  status: 200,
  body: Object.freeze({}),
});

const AccountIdSuccess: MockResponse = Object.freeze({
  status: 200,
  body: Object.freeze({
    primaryAccounts: Object.freeze({
      "https://www.fastmail.com/dev/maskedemail": "accountId",
    }),
  }),
});

// the tests
describe("Fastmail Forwarder", () => {
  describe("constructor(ApiService, I18nService)", () => {
    it("looks up the service name from the i18nService", () => {
      const apiService = mockApiService(AccountIdSuccess, EmptyResponse);
      const i18nService = mockI18nService();

      const forwarder = new FastmailForwarder(apiService, i18nService);

      expect(forwarder.serviceName).toEqual("forwarder.serviceName.fastmail");
    });
  });

  describe("generate(string | null, SelfHostedApiOptions & EmailDomainOptions)", () => {
    it.each([null, ""])("throws an error if the token is missing (token = %p)", async (token) => {
      const apiService = mockApiService(AccountIdSuccess, EmptyResponse);
      const i18nService = mockI18nService();

      const forwarder = new FastmailForwarder(apiService, i18nService);

      await expect(
        async () =>
          await forwarder.generate(null, {
            token,
            domain: "example.com",
            prefix: "prefix",
          })
      ).rejects.toEqual("forwarder.invalidToken");

      expect(apiService.nativeFetch).not.toHaveBeenCalled();
      expect(i18nService.t).toHaveBeenCalledWith(
        "forwarder.invalidToken",
        "forwarder.serviceName.fastmail"
      );
    });

    it.each([null, ""])(
      "throws an error if the domain is missing (domain = %p)",
      async (domain) => {
        const apiService = mockApiService(AccountIdSuccess, EmptyResponse);
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain,
              prefix: "prefix",
            })
        ).rejects.toEqual("forwarder.noDomain");

        expect(apiService.nativeFetch).not.toHaveBeenCalled();
        expect(i18nService.t).toHaveBeenCalledWith(
          "forwarder.noDomain",
          "forwarder.serviceName.fastmail"
        );
      }
    );

    it.each([401, 403])(
      "throws a no account id error if the accountId request responds with a status other than 200",
      async (status) => {
        const apiService = mockApiService({ status, body: {} }, EmptyResponse);
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              prefix: "prefix",
            })
        ).rejects.toEqual("forwarder.noAccountId");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          2,
          "forwarder.noAccountId",
          "forwarder.serviceName.fastmail"
        );
      }
    );

    it.each([
      ["jane.doe@example.com", 200],
      ["john.doe@example.com", 200],
    ])(
      "returns the generated email address (= %p) if both requests are successful (status = %p)",
      async (email, status) => {
        const apiService = mockApiService(AccountIdSuccess, {
          status,
          body: {
            methodResponses: [["MaskedEmail/set", { created: { "new-masked-email": { email } } }]],
          },
        });
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        const result = await forwarder.generate(null, {
          token: "token",
          domain: "example.com",
          prefix: "prefix",
        });

        expect(result).toEqual(email);
        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
      }
    );

    it.each([
      [
        "It turned inside out!",
        [
          "MaskedEmail/set",
          { notCreated: { "new-masked-email": { description: "It turned inside out!" } } },
        ],
      ],
      ["And then it exploded!", ["error", { description: "And then it exploded!" }]],
    ])(
      "throws a forwarder error (= %p) if both requests are successful (status = %p) but masked email creation fails",
      async (description, response) => {
        const apiService = mockApiService(AccountIdSuccess, {
          status: 200,
          body: {
            methodResponses: [response],
          },
        });
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              prefix: "prefix",
            })
        ).rejects.toEqual("forwarder.error");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          2,
          "forwarder.error",
          "forwarder.serviceName.fastmail",
          description
        );
      }
    );

    it.each([401, 403])(
      "throws an invalid token error if the jmap request fails with a %i",
      async (status) => {
        const apiService = mockApiService(AccountIdSuccess, { status, body: {} });
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              prefix: "prefix",
            })
        ).rejects.toEqual("forwarder.invalidToken");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          2,
          "forwarder.invalidToken",
          "forwarder.serviceName.fastmail"
        );
      }
    );

    it.each([
      null,
      [],
      [[]],
      [["MaskedEmail/not-a-real-op"]],
      [["MaskedEmail/set", null]],
      [["MaskedEmail/set", { created: null }]],
      [["MaskedEmail/set", { created: { "new-masked-email": null } }]],
      [["MaskedEmail/set", { notCreated: null }]],
      [["MaskedEmail/set", { notCreated: { "new-masked-email": null } }]],
    ])(
      "throws an unknown error if the jmap request is missing data (= %p)",
      async (responses: any) => {
        const apiService = mockApiService(AccountIdSuccess, {
          status: 200,
          body: {
            methodResponses: responses,
          },
        });
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              prefix: "prefix",
            })
        ).rejects.toEqual("forwarder.unknownError");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          2,
          "forwarder.unknownError",
          "forwarder.serviceName.fastmail"
        );
      }
    );

    it.each([100, 202, 300, 418, 500, 600])(
      "throws an unknown error if the request returns any other status code (= %i)",
      async (statusCode) => {
        const apiService = mockApiService(AccountIdSuccess, { status: statusCode, body: {} });
        const i18nService = mockI18nService();

        const forwarder = new FastmailForwarder(apiService, i18nService);

        await expect(
          async () =>
            await forwarder.generate(null, {
              token: "token",
              domain: "example.com",
              prefix: "prefix",
            })
        ).rejects.toEqual("forwarder.unknownError");

        expect(apiService.nativeFetch).toHaveBeenCalledWith(expect.any(Request));
        // counting instances is terribly flaky over changes, but jest doesn't have a better way to do this
        expect(i18nService.t).toHaveBeenNthCalledWith(
          2,
          "forwarder.unknownError",
          "forwarder.serviceName.fastmail"
        );
      }
    );
  });
});
